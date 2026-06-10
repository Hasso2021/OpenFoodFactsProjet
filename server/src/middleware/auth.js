import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Vérifie le token JWT et attache l'utilisateur à la requête.
 * À utiliser sur les routes protégées.
 */
export async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Not authorized, token invalid' });
  }
}

/**
 * Restreint l'accès aux administrateurs uniquement.
 * Doit être utilisé après le middleware protect.
 */
export function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: admin only' });
  }
  next();
}
