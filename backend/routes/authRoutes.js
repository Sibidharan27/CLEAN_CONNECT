import { Router } from 'express';
import { login, me, register, updateMe } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
const router = Router();
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, me);
router.patch('/me', protect, updateMe);
router.patch('/push-token', protect, async (req, res) => {
  // Store push token on user — optional, swallow errors
  try {
    const { default: User } = await import('../models/User.js');
    await User.findByIdAndUpdate(req.user.id, { expoPushToken: req.body.expoPushToken });
    res.json({ ok: true });
  } catch { res.json({ ok: true }); }
});
export default router;
