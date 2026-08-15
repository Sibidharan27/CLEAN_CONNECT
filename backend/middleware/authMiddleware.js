import jwt from 'jsonwebtoken';
import User from '../models/User.js';
export async function protect(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new Error('Authentication required');
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(payload.id);
    if (!req.user) throw new Error('User not found');
    next();
  } catch (error) { res.status(401); next(error); }
}
