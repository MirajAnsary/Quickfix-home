import rateLimit from 'express-rate-limit';

const opts = (windowMinutes, limit, message) => ({
  windowMs: windowMinutes * 60 * 1000,
  limit,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message },
});

/** General API limit per IP. */
export const apiLimiter = rateLimit(opts(15, 600, 'Too many requests. Please slow down.'));

/** Login / register brute-force protection per IP. */
export const authLimiter = rateLimit(opts(15, 20, 'Too many attempts. Please wait 15 minutes and try again.'));

/** OTP send/verify per IP (per-account limits are also enforced in otp.service). */
export const otpLimiter = rateLimit(opts(15, 15, 'Too many OTP requests. Please wait 15 minutes.'));
