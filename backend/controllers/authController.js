import User from '../models/User.js';
import { signToken } from '../utils/jwt.js';

// Build the full user object for API responses
const buildUserPayload = (user) => ({
  id: user._id || user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone || null,
  address: user.address || null,
  area: user.area || null,
  employeeId: user.employeeId || null,
  vehicleId: user.vehicleId || null,
  zone: user.zone || null,
  shift: user.shift || null,
  joiningDate: user.joiningDate || null,
});

const response = (res, user, code = 200) =>
  res.status(code).json({ token: signToken(user), user: buildUserPayload(user) });

export async function register(req, res, next) {
  try {
    const { name, email, password, role = 'citizen' } = req.body;
    if (await User.exists({ email })) return res.status(409).json({ message: 'Email already registered' });
    response(res, await User.create({ name, email, password, role }), 201);
  } catch (e) { next(e); }
}

export async function login(req, res, next) {
  try {
    const user = await User.findOne({ email: req.body.email }).select('+password');
    if (!user || !(await user.matchesPassword(req.body.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    response(res, user);
  } catch (e) { next(e); }
}

// /auth/me — re-fetch full user from DB (req.user is already populated by authMiddleware)
export const me = (req, res) => {
  res.json({ user: buildUserPayload(req.user) });
};
