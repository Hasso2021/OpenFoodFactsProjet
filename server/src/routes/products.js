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

    // Fusion : produits locaux en premier, sans doublons par code-barres
    const seen = new Set(localProducts.map((p) => p.code));
    const merged = [
      ...localProducts.map((p) => p.toObject()),
      ...offProducts.filter((p) => !seen.has(p.code)),
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

    // Priorité à la base locale
    let product = await Product.findOne({ code });
    if (product) {
      return res.json({ product: product.toObject(), source: 'local' });
    }

    // Sinon, interroger Open Food Facts
    const offProduct = await getProductByBarcode(code);
    if (!offProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ product: offProduct, source: 'off' });
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

    // Récupérer le produit d'origine
    let product = await Product.findOne({ code });
    if (!product) {
      product = await getProductByBarcode(code);
    } else {
      product = product.toObject();
    }

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Substitutions définies par l'admin
    const curated = await Substitute.find({ originalCode: code, isActive: true });

    // Substitutions automatiques via Open Food Facts
    const autoSubstitutes = await findHealthierSubstitutes(product, userAllergens);

    res.json({
      original: product,
      curated: curated.map((s) => ({
        id: s._id,
        substitute: s.substituteProduct,
        reason: s.reason,
        source: 'curated',
      })),
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
