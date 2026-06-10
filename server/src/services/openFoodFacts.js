import axios from 'axios';

// URLs de l'API Open Food Facts
const OFF_BASE = 'https://world.openfoodfacts.net/api/v2';
const OFF_CGI = 'https://world.openfoodfacts.net/cgi/search.pl'; // miroir .net (le .org renvoie souvent 503)
const OFF_FIELDS =
  'code,product_name,product_name_fr,product_name_en,generic_name,brands,abbreviated_product_name,nutriscore_grade,image_url,image_front_url,image_front_small_url,selected_images,categories_tags,allergens_tags,nutriments';

const IMAGE_LANG_PRIORITY = ['fr', 'en', 'es', 'de', 'it', 'nl'];

const offClient = axios.create({
  baseURL: OFF_BASE,
  timeout: 15000,
  headers: {
    'User-Agent': 'OpenFactFood/1.0 (Educational Project)',
  },
});

// Classement Nutri-Score : plus l'indice est bas, plus c'est sain
const NUTRISCORE_RANK = { a: 0, b: 1, c: 2, d: 3, e: 4, unknown: 5 };

/**
 * Choisit le meilleur nom disponible (certains produits OFF ont un product_name vide)
 */
function resolveProductName(product) {
  const nameFields = [
    product.product_name_fr,
    product.product_name,
    product.product_name_en,
    product.product_name_es,
    product.product_name_de,
    product.generic_name_fr,
    product.generic_name,
    product.generic_name_en,
    product.abbreviated_product_name_fr,
    product.abbreviated_product_name,
  ];

  for (const value of nameFields) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  if (product.brands?.trim()) {
    return product.brands.split(',')[0].trim();
  }

  if (product.categories_tags?.length) {
    const lastTag = product.categories_tags[product.categories_tags.length - 1];
    return lastTag
      .replace(/^[a-z]{2}:/, '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return product.code ? `Product ${product.code}` : 'Unknown product';
}

/**
 * Choisit la meilleure image (priorité au français, les photos EN sont parfois incorrectes)
 */
function resolveImageUrl(product) {
  const selected = product.selected_images?.front?.display;
  if (selected) {
    for (const lang of IMAGE_LANG_PRIORITY) {
      if (selected[lang]) return selected[lang];
    }
  }

  const fallbacks = [
    product.image_front_url,
    product.image_front_small_url,
    product.image_url,
  ];

  for (const url of fallbacks) {
    if (typeof url === 'string' && url.trim()) return url.trim();
  }

  return '';
}

/**
 * Normalise un produit OFF vers un format uniforme pour notre application
 */
export function normalizeProduct(product) {
  if (!product) return null;

  const name = resolveProductName(product);

  return {
    code: product.code,
    product_name: name,
    product_name_fr: product.product_name_fr?.trim() || name,
    nutriscore_grade: (product.nutriscore_grade || 'unknown').toLowerCase(),
    image_url: resolveImageUrl(product),
    categories_tags: product.categories_tags || [],
    allergens_tags: product.allergens_tags || [],
    nutriments: product.nutriments || {},
    brands: product.brands || '',
    source: 'off',
  };
}

function slugifyTag(value) {
  return value.trim().toLowerCase().replace(/\s+/g, '-');
}

function mapSearchResults(data) {
  const products = (data.products || [])
    .map(normalizeProduct)
    .filter((p) => p && p.code);

  return {
    products,
    count: data.count || products.length,
    page: data.page || 1,
  };
}

/**
 * Recherche textuelle via l'endpoint CGI (seul OFF qui supporte les mots-clés)
 */
async function searchOFFCgi({ query, category, page, pageSize }) {
  const params = {
    search_terms: query,
    search_simple: 1,
    action: 'process',
    json: 1,
    page,
    page_size: pageSize,
    fields: OFF_FIELDS,
  };

  if (category) {
    params.tagtype_0 = 'categories';
    params.tag_contains_0 = 'contains';
    params.tag_0 = category;
  }

  const { data } = await axios.get(OFF_CGI, {
    params,
    timeout: 15000,
    headers: { 'User-Agent': 'OpenFactFood/1.0 (Educational Project)' },
  });

  if (!data || typeof data !== 'object' || !Array.isArray(data.products)) {
    throw new Error('Réponse CGI invalide');
  }

  const result = mapSearchResults(data);
  if (result.products.length === 0) {
    throw new Error('Aucun résultat CGI');
  }

  return result;
}

/**
 * Recherche structurée v2 (filtres par catégorie/marque — pas de texte libre)
 */
function buildV2SearchParams({ query, category, page, pageSize }) {
  const params = {
    page,
    page_size: pageSize,
    fields: OFF_FIELDS,
    sort_by: 'product_name',
  };

  if (category) {
    params.categories_tags = category;
  }

  // L'API v2 ignore search_terms ; on filtre par marque en secours
  if (query) {
    params.brands_tags = slugifyTag(query);
  }

  return params;
}

/**
 * Recherche de produits sur Open Food Facts (nom, catégorie ou code-barres)
 */
export async function searchOFF({ query, category, barcode, page = 1, pageSize = 24 }) {
  if (barcode) {
    const product = await getProductByBarcode(barcode);
    return { products: product ? [product] : [], count: product ? 1 : 0, page: 1 };
  }

  if (query) {
    try {
      return await searchOFFCgi({ query, category, page, pageSize });
    } catch (error) {
      console.warn('Recherche CGI échouée, repli sur v2:', error.message);
    }
  }

  const { data } = await offClient.get('/search', {
    params: buildV2SearchParams({ query, category, page, pageSize }),
  });

  return mapSearchResults(data);
}

/**
 * Récupère un produit par son code-barres
 */
export async function getProductByBarcode(barcode) {
  try {
    const { data } = await offClient.get(`/product/${barcode}`, {
      params: { fields: OFF_FIELDS },
    });

    if (data.status === 0 || !data.product) {
      return null;
    }

    return normalizeProduct(data.product);
  } catch (error) {
    if (error.response?.status === 404) return null;
    throw error;
  }
}

/**
 * Récupère la taxonomie des allergènes depuis Open Food Facts
 */
export async function getAllergensTaxonomy() {
  const { data } = await axios.get(
    'https://world.openfoodfacts.org/data/taxonomies/allergens.json',
    { timeout: 15000 }
  );
  return data;
}

/**
 * Compare deux Nutri-Scores (true si le substitut est plus sain)
 */
export function isHealthierSubstitute(originalGrade, substituteGrade) {
  const orig = NUTRISCORE_RANK[(originalGrade || 'unknown').toLowerCase()] ?? 5;
  const sub = NUTRISCORE_RANK[(substituteGrade || 'unknown').toLowerCase()] ?? 5;
  return sub < orig;
}

// Catégories trop larges à ignorer pour la recherche de substituts
const BROAD_CATEGORY_SLUGS = new Set([
  'breakfasts',
  'snacks',
  'meals',
  'beverages',
  'plant-based-foods-and-beverages',
  'foods',
  'food',
]);

function isBroadCategory(tag) {
  const slug = tag.replace(/^[a-z]{2}:/, '').toLowerCase();
  return BROAD_CATEGORY_SLUGS.has(slug);
}

/**
 * Choisit la catégorie la plus précise (évite en:breakfasts pour Nutella par ex.)
 */
function resolveSubstituteCategory(product) {
  const tags = product.categories_tags || [];
  if (tags.length === 0) return null;

  const specificTags = tags.filter((tag) => !isBroadCategory(tag));
  const candidates = specificTags.length > 0 ? specificTags : tags;

  const slugTags = candidates.filter((tag) => /^[a-z]{2}:[a-z0-9-]+$/.test(tag));
  if (slugTags.length > 0) {
    return slugTags[slugTags.length - 1];
  }

  return candidates[candidates.length - 1];
}

/**
 * Trouve des substituts plus sains dans la même catégorie de produit
 */
export async function findHealthierSubstitutes(product, userAllergens = []) {
  if (!product) return [];

  const category = resolveSubstituteCategory(product);
  if (!category) return [];

  const originalGrade = (product.nutriscore_grade || 'unknown').toLowerCase();
  const originalRank = NUTRISCORE_RANK[originalGrade] ?? 5;

  const { products } = await searchOFF({ category, pageSize: 50 });

  const substitutes = products
    .filter((p) => {
      if (p.code === product.code) return false;

      const grade = (p.nutriscore_grade || 'unknown').toLowerCase();
      const rank = NUTRISCORE_RANK[grade] ?? 5;
      if (rank >= originalRank) return false;

      // Exclure les produits contenant les allergènes de l'utilisateur
      if (userAllergens.length > 0) {
        const productAllergens = p.allergens_tags || [];
        const hasAllergen = userAllergens.some((a) => productAllergens.includes(a));
        if (hasAllergen) return false;
      }

      return true;
    })
    .sort((a, b) => {
      const rankA = NUTRISCORE_RANK[(a.nutriscore_grade || 'unknown').toLowerCase()] ?? 5;
      const rankB = NUTRISCORE_RANK[(b.nutriscore_grade || 'unknown').toLowerCase()] ?? 5;
      return rankA - rankB;
    })
    .slice(0, 5);

  return substitutes;
}
