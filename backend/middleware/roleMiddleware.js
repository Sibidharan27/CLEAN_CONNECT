export const allowRoles = (...roles) => (req, res, next) => roles.includes(req.user?.role) ? next() : res.status(403).json({ message: 'Insufficient permissions' });
