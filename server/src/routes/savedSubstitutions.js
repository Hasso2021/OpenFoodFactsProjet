import express from 'express';
import SavedSubstitution from '../models/SavedSubstitution.js';
import { protect } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

/**
 * GET /api/saved-substitutions
 * Liste les substitutions sauvegardées de l'utilisateur connecté
 */
router.get('/', async (req, res) => {
  const saved = await SavedSubstitution.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ savedSubstitutions: saved });
});

/**
 * POST /api/saved-substitutions
 * Sauvegarde une substitution (snapshot des deux produits)
 */
router.post(
  '/',
  [
    body('originalProduct').isObject().withMessage('Original product is required'),
    body('substituteProduct').isObject().withMessage('Substitute product is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { originalProduct, substituteProduct, notes } = req.body;

    const saved = await SavedSubstitution.create({
      user: req.user._id,
      originalProduct,
      substituteProduct,
      notes,
    });

    res.status(201).json({ savedSubstitution: saved });
  }
);

/**
 * DELETE /api/saved-substitutions/:id
 * Supprime une substitution sauvegardée
 */
router.delete('/:id', async (req, res) => {
  const saved = await SavedSubstitution.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!saved) {
    return res.status(404).json({ message: 'Saved substitution not found' });
  }

  await saved.deleteOne();
  res.json({ message: 'Saved substitution removed' });
});

export default router;
