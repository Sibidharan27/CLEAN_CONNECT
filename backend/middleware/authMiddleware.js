import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Citizen from '../models/Citizen.js';
import Driver from '../models/Driver.js';

export async function protect(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new Error('Authentication required');
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Check new role-specific collections first, then fall back to legacy User
    const user =
      await Citizen.findById(payload.id) ||
      await Driver.findById(payload.id) ||
      await User.findById(payload.id);

    if (!user) throw new Error('User not found');
    req.user = user;
    next();
  } catch (error) { res.status(401); next(error); }
}

// Admin-only middleware
export function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}
