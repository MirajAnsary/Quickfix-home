import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from './http.js';

export const AUTH_COOKIE = 'qf_token';
const ISSUER = 'quickfix-home';

// "tv" (token version) lets us kill every session for a user by bumping user.tokenVersion
// (done automatically on password change, reset and account disable).
export const signAccessToken = (user) =>
  jwt.sign({ sub: String(user._id), role: user.role, tv: user.tokenVersion }, env.jwtSecret, { expiresIn: env.jwtExpiresIn, issuer: ISSUER });

export const verifyAccessToken = (token) => jwt.verify(token, env.jwtSecret, { issuer: ISSUER });

const cookieBase = () => ({ httpOnly: true, secure: env.cookie.secure, sameSite: env.cookie.sameSite, path: '/' });

export function setAuthCookie(res, token, remember = true) {
  res.cookie(AUTH_COOKIE, token, { ...cookieBase(), ...(remember ? { maxAge: 7 * 24 * 60 * 60 * 1000 } : {}) });
}

export function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE, cookieBase());
}

// Short-lived, single-use (tied to tokenVersion) token issued after a reset OTP is verified.
export const signResetToken = (user) =>
  jwt.sign({ sub: String(user._id), tv: user.tokenVersion, purpose: 'reset' }, env.resetTokenSecret, { expiresIn: '15m', issuer: ISSUER });

export function verifyResetToken(token) {
  try {
    const payload = jwt.verify(token, env.resetTokenSecret, { issuer: ISSUER });
    if (payload.purpose !== 'reset') throw new Error('wrong purpose');
    return payload;
  } catch {
    throw new ApiError(400, 'This reset session has expired. Please request a new code.');
  }
}
