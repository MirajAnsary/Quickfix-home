import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/http.js';
import { identifierQuery } from '../utils/format.js';
import { consumeOtp, issueOtp, OTP_INVALID } from '../services/otp.service.js';
import { clearAuthCookie, setAuthCookie, signAccessToken, signResetToken, verifyResetToken } from '../utils/tokens.js';

// Compared against when the user does not exist, so response time doesn't reveal which accounts exist.
const DUMMY_HASH = bcrypt.hashSync('timing-equaliser-not-a-password', 12);
const DUPLICATE = 'An account with this email or phone number already exists. Please log in.';

// POST /api/auth/register
export async function register(req, res) {
  const { fullName, phone, email, password } = req.body;
  const existing = await User.find({ $or: [{ email }, { phone }] });

  let user;
  if (existing.length === 0) {
    user = await User.create({ fullName, phone, email, password, role: 'customer' });
  } else {
    // Only an unverified account with the SAME email and phone may be re-registered
    // (e.g. user never finished OTP). Anything else is a duplicate.
    const [u] = existing;
    if (existing.length > 1 || u.isVerified || u.email !== email || u.phone !== phone) throw new ApiError(409, DUPLICATE);
    u.fullName = fullName;
    u.password = password;
    await u.save();
    user = u;
  }

  const otp = await issueOtp(user, 'register');
  res.status(201).json({ message: 'Account created. Enter the 6-digit code we sent you.', identifier: user.email, ...otp });
}

// POST /api/auth/verify-otp
export async function verifyOtp(req, res) {
  const { identifier, purpose, code } = req.body;
  const user = await User.findOne(identifierQuery(identifier));
  if (!user || !user.isActive) throw new ApiError(400, OTP_INVALID);

  await consumeOtp(user.email, purpose, code);

  if (purpose === 'register') {
    if (!user.isVerified) {
      user.isVerified = true;
      await user.save();
    }
    setAuthCookie(res, signAccessToken(user), true);
    return res.json({ message: 'Account verified.', user });
  }
  return res.json({ message: 'Code verified. Set your new password.', resetToken: signResetToken(user) });
}

// POST /api/auth/resend-otp
export async function resendOtp(req, res) {
  const { identifier, purpose } = req.body;
  const generic = { message: 'If the account exists, a new code has been sent.', resendAfter: env.otp.resendCooldownSec };
  const user = await User.findOne(identifierQuery(identifier));
  if (!user || !user.isActive) return res.json(generic);
  if (purpose === 'register' && user.isVerified) throw new ApiError(400, 'This account is already verified. Please log in.');
  if (purpose === 'reset' && !user.isVerified) return res.json(generic);

  const otp = await issueOtp(user, purpose);
  return res.json({ message: 'A new code has been sent.', ...otp });
}

// POST /api/auth/login
export async function login(req, res) {
  const { identifier, password, role, rememberMe = true } = req.body;
  const user = await User.findOne(identifierQuery(identifier)).select('+password');
  const ok = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);
  if (!user || !ok || user.role !== role) {
    throw new ApiError(401, 'Invalid login details. Check the selected role, your phone/email and password.');
  }
  if (!user.isActive) throw new ApiError(403, 'Your account is disabled. Please contact support.');

  if (!user.isVerified) {
    let otp = {};
    try {
      otp = await issueOtp(user, 'register');
    } catch (e) {
      if (e.statusCode !== 429) throw e; // a code was sent recently — just send them to the verify page
    }
    throw new ApiError(403, 'Please verify your account first. Enter the code we sent you.', { code: 'NOT_VERIFIED', identifier: user.email, ...otp });
  }

  await User.updateOne({ _id: user._id }, { lastLoginAt: new Date() });
  setAuthCookie(res, signAccessToken(user), rememberMe);
  res.json({ user });
}

// POST /api/auth/logout
export function logout(_req, res) {
  clearAuthCookie(res);
  res.json({ message: 'Logged out.' });
}

// GET /api/auth/me
export function me(req, res) {
  res.json({ user: req.user });
}

// POST /api/auth/forgot-password — same response whether or not the account exists.
export async function forgotPassword(req, res) {
  const { identifier } = req.body;
  const user = await User.findOne(identifierQuery(identifier));
  if (user && user.isActive && user.isVerified) {
    try {
      await issueOtp(user, 'reset');
    } catch (e) {
      if (e.statusCode === 503) throw e; // provider down: tell the user honestly
      // Cooldown/hourly limit: stay silent so the response doesn't reveal the account exists.
    }
  }
  res.json({
    message: 'If an account exists for these details, we have sent a 6-digit code.',
    identifier,
    resendAfter: env.otp.resendCooldownSec,
  });
}

// POST /api/auth/reset-password
export async function resetPassword(req, res) {
  const { resetToken, password } = req.body;
  const payload = verifyResetToken(resetToken);
  const user = await User.findById(payload.sub).select('+password');
  if (!user || !user.isActive || user.tokenVersion !== payload.tv) {
    throw new ApiError(400, 'This reset session has expired. Please request a new code.');
  }
  user.password = password; // pre-save hook hashes it and bumps tokenVersion (single use + logs out all devices)
  await user.save();
  clearAuthCookie(res);
  res.json({ message: 'Password updated. Please log in with your new password.' });
}
