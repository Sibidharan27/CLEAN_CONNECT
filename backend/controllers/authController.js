import User from '../models/User.js';
import Citizen from '../models/Citizen.js';
import Driver from '../models/Driver.js';
import { signToken } from '../utils/jwt.js';

// ─── In-memory OTP store { email -> { otp, expiresAt } } ─────────────────────
const otpStore = new Map();
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

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
    const { name, email, password, role = 'citizen', phone, area } = req.body;
    // Block driver self-registration — only admins can create driver accounts
    if (role === 'driver') {
      return res.status(403).json({ message: 'Driver accounts can only be created by an administrator.' });
    }
    const emailLower = email.toLowerCase().trim();
    // Check both Citizen and legacy User collection for duplicates
    const exists = await Citizen.exists({ email: emailLower }) || await User.exists({ email: emailLower });
    if (exists) return res.status(409).json({ message: 'Email already registered' });
    const newUser = await Citizen.create({ name, email: emailLower, password, role: 'citizen', phone, area });
    response(res, newUser, 201);
  } catch (e) { next(e); }
}

export async function login(req, res, next) {
  try {
    const emailLower = (req.body.email || '').toLowerCase().trim();
    // Check Citizen collection first, then Driver, then legacy User (backward compat)
    let user =
      await Citizen.findOne({ email: emailLower }).select('+password') ||
      await Driver.findOne({ email: emailLower }).select('+password') ||
      await User.findOne({ email: emailLower }).select('+password');
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

// PATCH /auth/me — update profile fields
export async function updateMe(req, res, next) {
  try {
    const { name, phone, area, address } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { ...(name && { name }), ...(phone !== undefined && { phone }), ...(area !== undefined && { area }), ...(address !== undefined && { address }) },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user: buildUserPayload(user) });
  } catch (e) { next(e); }
}

// POST /auth/forgot-password — generate and send OTP via email
export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const emailLower = email.toLowerCase().trim();
    const user =
      await Citizen.findOne({ email: emailLower }) ||
      await Driver.findOne({ email: emailLower }) ||
      await User.findOne({ email: emailLower });

    // Always respond with success (security: don't reveal if email exists)
    if (!user) return res.json({ message: 'If this email is registered, you will receive an OTP.' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(emailLower, { otp, expiresAt: Date.now() + OTP_TTL_MS, verified: false });

    // ── Send OTP via Gmail SMTP ──────────────────────────────────────────────
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (emailUser && emailPass && !emailPass.includes('your_16_char')) {
      try {
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.default.createTransport({
          service: 'gmail',
          auth: { user: emailUser, pass: emailPass },
        });
        await transporter.sendMail({
          from: `"CleanConnect+ " <${emailUser}>`,
          to: email,
          subject: '🔑 Your OTP for Password Reset — CleanConnect+',
          html: `
            <div style="font-family: 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; background: #f0fdf4; border-radius: 16px; overflow: hidden;">
              <div style="background: linear-gradient(135deg, #1B5E20, #2E7D32); padding: 32px; text-align: center;">
                <h1 style="color:#fff; margin:0; font-size:24px; letter-spacing:-0.5px;">CleanConnect+</h1>
                <p style="color:rgba(255,255,255,0.8); margin:8px 0 0; font-size:14px;">Password Reset</p>
              </div>
              <div style="padding: 32px;">
                <p style="color:#1a1a1a; font-size:16px; margin-bottom:8px;">Hi <strong>${user.name}</strong>,</p>
                <p style="color:#444; font-size:14px; line-height:1.6;">Use the one-time password below to reset your CleanConnect+ account password. This OTP is valid for <strong>10 minutes</strong>.</p>
                <div style="background:#fff; border:2px solid #2E7D32; border-radius:12px; padding:24px; text-align:center; margin:24px 0;">
                  <p style="margin:0 0 8px; color:#666; font-size:12px; letter-spacing:1px; text-transform:uppercase;">Your OTP</p>
                  <p style="margin:0; font-size:40px; font-weight:800; letter-spacing:12px; color:#1B5E20;">${otp}</p>
                </div>
                <p style="color:#999; font-size:12px;">If you did not request this, please ignore this email. Your password will not change.</p>
              </div>
              <div style="background:#e8f5e9; padding:16px; text-align:center;">
                <p style="color:#555; font-size:12px; margin:0;">© 2026 CleanConnect+ — Coimbatore Waste Management</p>
              </div>
            </div>
          `,
        });
        console.log(`✅ OTP email sent to ${email}`);
      } catch (mailErr) {
        console.error('❌ Email send failed:', mailErr.message);
        // Still log OTP so dev can test even if email fails
        console.log(`🔑 OTP for ${email}: ${otp}`);
      }
    } else {
      // Email not configured — log to console for dev use
      console.log(`\n🔑 OTP for ${email}: ${otp} (valid for 10 min)\n⚠️  Set EMAIL_USER & EMAIL_PASS in .env to send real emails\n`);
    }

    res.json({ message: 'OTP sent to your email.' });
  } catch (e) { next(e); }
}

// POST /auth/verify-otp — check OTP validity
export async function verifyOtp(req, res, next) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

    const record = otpStore.get(email.toLowerCase().trim());
    if (!record) return res.status(400).json({ message: 'No OTP found for this email. Please request a new one.' });
    if (Date.now() > record.expiresAt) {
      otpStore.delete(email.toLowerCase().trim());
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }
    if (record.otp !== otp.toString()) return res.status(400).json({ message: 'Invalid OTP. Please try again.' });

    // Mark as verified
    otpStore.set(email.toLowerCase().trim(), { ...record, verified: true });
    res.json({ message: 'OTP verified successfully.' });
  } catch (e) { next(e); }
}

// POST /auth/reset-password — reset password after OTP verification
export async function resetPassword(req, res, next) {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ message: 'Email, OTP and new password are required' });
    if (newPassword.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const emailLower = email.toLowerCase().trim();
    const record = otpStore.get(emailLower);
    if (!record || !record.verified || record.otp !== otp.toString()) {
      return res.status(400).json({ message: 'Invalid or expired OTP. Please start over.' });
    }
    if (Date.now() > record.expiresAt) {
      otpStore.delete(emailLower);
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    const user =
      await Citizen.findOne({ email: emailLower }).select('+password') ||
      await Driver.findOne({ email: emailLower }).select('+password') ||
      await User.findOne({ email: emailLower }).select('+password');

    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = newPassword;
    await user.save();
    otpStore.delete(emailLower);

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (e) { next(e); }
}
