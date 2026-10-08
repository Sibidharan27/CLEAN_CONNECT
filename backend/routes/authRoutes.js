import { Router } from 'express';
import { login, me, register, updateMe, forgotPassword, verifyOtp, resetPassword } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
const router = Router();
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, me);
router.patch('/me', protect, updateMe);
// OTP-based password reset
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);
router.patch('/push-token', protect, async (req, res) => {
  // Store push token on user — optional, swallow errors
  try {
    const { default: Citizen } = await import('../models/Citizen.js');
    const { default: Driver } = await import('../models/Driver.js');
    const { default: User } = await import('../models/User.js');
    await Citizen.findByIdAndUpdate(req.user.id, { expoPushToken: req.body.expoPushToken }) ||
    await Driver.findByIdAndUpdate(req.user.id, { expoPushToken: req.body.expoPushToken }) ||
    await User.findByIdAndUpdate(req.user.id, { expoPushToken: req.body.expoPushToken });
    res.json({ ok: true });
  } catch { res.json({ ok: true }); }
});
export default router;
