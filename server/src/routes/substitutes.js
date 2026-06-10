import express from 'express';
import Substitute from '../models/Substitute.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

/**
 * GET /api/substitutes
 * Liste des substitutions actives (admin)
 */
router.get('/', async (req, res) => {
  const substitutes = await Substitute.find({ isActive: true })
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 });
  res.json({ substitutes });
});

/**
 * GET /api/substitutes/:id
 * Détail d'une substitution par ID
 */
router.get('/:id', async (req, res) => {
  const substitute = await Substitute.findById(req.params.id);
  if (!substitute) {
    return res.status(404).json({ message: 'Substitute not found' });
  }
  res.json({ substitute });
});

/**
 * POST /api/substitutes
 * Créer une substitution (admin)
 */
router.post(
  '/',
  protect,
  adminOnly,
  [
    body('originalCode').notEmpty(),
    body('substituteProduct').isObject(),
    body('originalProduct').optional().isObject(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const substitute = await Substitute.create({
      ...req.body,
      createdBy: req.user._id,
    });

    res.status(201).json({ substitute });
  }
);

/**
 * PUT /api/substitutes/:id
 * Modifier une substitution (admin)
 */
router.put('/:id', protect, adminOnly, async (req, res) => {
  const substitute = await Substitute.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!substitute) {
    return res.status(404).json({ message: 'Substitute not found' });
  }

  res.json({ substitute });
});

/**
 * DELETE /api/substitutes/:id
 * Supprimer une substitution (admin)
 */
router.delete('/:id', protect, adminOnly, async (req, res) => {
  const substitute = await Substitute.findByIdAndDelete(req.params.id);
  if (!substitute) {
    return res.status(404).json({ message: 'Substitute not found' });
  }
  res.json({ message: 'Substitute deleted' });
});

export default router;
