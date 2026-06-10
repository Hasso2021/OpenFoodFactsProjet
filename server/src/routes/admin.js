import express from 'express';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Substitute from '../models/Substitute.js';
import SavedSubstitution from '../models/SavedSubstitution.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Routes réservées aux administrateurs authentifiés
router.use(protect, adminOnly);

/**
 * GET /api/admin/users
 * Liste des utilisateurs (sans les mots de passe)
 */
router.get('/users', async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json({
    users: users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      allergens: u.allergens,
      createdAt: u.createdAt,
    })),
  });
});

/**
 * GET /api/admin/stats
 * Statistiques du tableau de bord
 */
router.get('/stats', async (req, res) => {
  const [userCount, productCount, substituteCount, savedCount] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments(),
    Substitute.countDocuments(),
    SavedSubstitution.countDocuments(),
  ]);

  res.json({
    stats: { userCount, productCount, substituteCount, savedCount },
  });
});

/**
 * POST /api/admin/products
 * Ajouter un produit en base locale
 */
router.post('/products', async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json({ product });
});

/**
 * PUT /api/admin/products/:id
 * Modifier un produit local
 */
router.put('/products/:id', async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  res.json({ product });
});

/**
 * DELETE /api/admin/products/:id
 * Supprimer un produit local
 */
router.delete('/products/:id', async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  res.json({ message: 'Product deleted' });
});

/**
 * PUT /api/admin/users/:id/role
 * Modifier le rôle d'un utilisateur
 */
router.put('/users/:id/role', async (req, res) => {
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true }
  ).select('-password');

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
});

export default router;
