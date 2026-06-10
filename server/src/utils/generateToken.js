import jwt from 'jsonwebtoken';

/**
 * Génère un token JWT pour un utilisateur connecté
 */
export function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}
