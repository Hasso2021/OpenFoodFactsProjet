import express from 'express';
import Product from '../models/Product.js';
import Substitute from '../models/Substitute.js';
import {
  searchOFF,
  getProductByBarcode,
  findHealthierSubstitutes,
  getAllergensTaxonomy,
} from '../services/openFoodFacts.js';
const router = express.Router();

/**
 * GET /api/products/search
 * Recherche de produits (base locale + Open Food Facts)
 */
router.get('/search', async (req, res) => {
  try {
    const { q, category, barcode, page = 1, pageSize = 24, source = 'all' } = req.query;

    let localProducts = [];
    let offProducts = [];
    let totalCount = 0;

    // Recherche dans MongoDB (produits locaux)
    if (source === 'all' || source === 'local') {
      const filter = {};
      if (barcode) {
        filter.code = barcode;
      } else {
        if (q) {
          filter.$or = [
            { product_name: { $regex: q, $options: 'i' } },
            { product_name_fr: { $regex: q, $options: 'i' } },
          ];
        }
        if (category) {
          filter.categories_tags = { $regex: category, $options: 'i' };
        }
      }

      if (Object.keys(filter).length > 0 || barcode) {
        localProducts = await Product.find(filter).limit(Number(pageSize));
      }
    }

    // Recherche via l'API Open Food Facts
    if (source === 'all' || source === 'off') {
      const offResult = await searchOFF({
        query: q,
        category,
        barcode,
        page: Number(page),
        pageSize: Number(pageSize),
      });
      offProducts = offResult.products;
      totalCount = offResult.count;
    }

    // Fusion : Open Food Facts en priorité (source fiable), produits locaux en complément
    const offCodes = new Set(offProducts.map((p) => p.code));
    const merged = [
      ...offProducts,
      ...localProducts
        .map((p) => p.toObject())
        .filter((p) => !offCodes.has(p.code)),
    ];

    res.json({
      products: merged,
      count: merged.length,
      offTotal: totalCount,
      page: Number(page),
    });
  } catch (error) {
    console.error('Product search error:', error.message);
    res.status(500).json({ message: 'Failed to search products' });
  }
});

/**
 * GET /api/products/barcode/:code
 * Détail d'un produit par code-barres
 */
router.get('/barcode/:code', async (req, res) => {
  try {
    const { code } = req.params;

    // Priorité à Open Food Facts (le code-barres est l'identifiant officiel)
    const offProduct = await getProductByBarcode(code);
    if (offProduct) {
      return res.json({ product: offProduct, source: 'off' });
    }

    // Sinon, produit ajouté manuellement par l'admin
    const localProduct = await Product.findOne({ code });
    if (!localProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ product: localProduct.toObject(), source: 'local' });
  } catch (error) {
    console.error('Barcode lookup error:', error.message);
    res.status(500).json({ message: 'Failed to fetch product' });
  }
});

/**
 * GET /api/products/allergens/taxonomy
 * Liste des allergènes pour le profil utilisateur
 */
router.get('/allergens/taxonomy', async (req, res) => {
  try {
    const taxonomy = await getAllergensTaxonomy();
    res.json({ taxonomy });
  } catch (error) {
    console.error('Allergens taxonomy error:', error.message);
    res.status(500).json({ message: 'Failed to fetch allergens taxonomy' });
  }
});

/**
 * GET /api/products/local
 * Liste des produits locaux
 */
router.get('/local', async (req, res) => {
  const products = await Product.find().sort({ product_name: 1 });
  res.json({ products });
});

/**
 * GET /api/products/:code/substitutes
 * Suggestions de substituts plus sains pour un produit
 */
router.get('/:code/substitutes', async (req, res) => {
  try {
    const { code } = req.params;
    let userAllergens = [];

    // Si connecté, filtrer selon les allergènes du profil
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const jwt = (await import('jsonwebtoken')).default;
        const User = (await import('../models/User.js')).default;
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (user) userAllergens = user.allergens || [];
      } catch {
        // Token invalide : continuer sans filtre allergènes
      }
    }

    // Produit d'origine : Open Food Facts en priorité (données complètes pour la recherche)
    let product = await getProductByBarcode(code);
    if (!product) {
      const localProduct = await Product.findOne({ code });
      if (localProduct) product = localProduct.toObject();
    }

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Substitutions définies par l'admin (enrichies avec OFF si le code-barres existe)
    const curatedDocs = await Substitute.find({ originalCode: code, isActive: true });
    const curated = await Promise.all(
      curatedDocs.map(async (s) => {
        let substitute = s.substituteProduct?.toObject?.() || s.substituteProduct;
        if (substitute?.code) {
          const offSub = await getProductByBarcode(substitute.code);
          if (offSub) {
            substitute = { ...offSub, ...substitute, image_url: offSub.image_url || substitute.image_url };
          }
        }
        return {
          id: s._id,
          substitute,
          reason: s.reason,
          source: 'curated',
        };
      })
    );

    const curatedCodes = new Set(curated.map((c) => c.substitute?.code).filter(Boolean));

    // Substitutions automatiques via Open Food Facts (sans doublons admin)
    const autoSubstitutes = (await findHealthierSubstitutes(product, userAllergens)).filter(
      (s) => !curatedCodes.has(s.code)
    );

    res.json({
      original: product,
      curated,
      suggestions: autoSubstitutes.map((s) => ({
        substitute: s,
        reason: `Better Nutri-Score (${s.nutriscore_grade?.toUpperCase()} vs ${product.nutriscore_grade?.toUpperCase()})`,
        source: 'auto',
      })),
    });
  } catch (error) {
    console.error('Substitute search error:', error.message);
    res.status(500).json({ message: 'Failed to find substitutes' });
  }
});

export default router;
