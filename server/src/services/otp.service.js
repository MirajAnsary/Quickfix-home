import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { OTPVerification } from '../models/index.js';
import { ApiError } from '../utils/http.js';
import { deliverOtp } from './notify.service.js';

export const OTP_INVALID = 'This code is invalid or has expired. Please request a new one.';
const HOUR = 3600 * 1000;

const hashCode = (identifier, purpose, code) =>
  crypto.createHmac('sha256', env.otp.hmacSecret).update(`${identifier}:${purpose}:${code}`).digest('hex');

// Exported only so the automated smoke test can plant a known code. Not used by any route.
export const hashCodeForTests = hashCode;

const safeEqualHex = (a, b) => {
  const A = Buffer.from(a, 'hex');
  const B = Buffer.from(b, 'hex');
  return A.length === B.length && crypto.timingSafeEqual(A, B);
};

/**
 * Creates a new 6-digit code for the user, enforcing the resend cooldown and the
 * hourly send cap, then delivers it. Only the HMAC of the code is stored.
 */
export async function issueOtp(user, purpose) {
  const identifier = user.email;
  const now = Date.now();
  const cfg = env.otp;

  let rec = await OTPVerification.findOne({ identifier, purpose });

  if (rec?.resendAvailableAt && rec.resendAvailableAt.getTime() > now) {
    const wait = Math.ceil((rec.resendAvailableAt.getTime() - now) / 1000);
    throw new ApiError(429, `Please wait ${wait} seconds before requesting a new code.`, { retryAfter: wait });
  }
  const newWindow = !rec?.windowStartedAt || now - rec.windowStartedAt.getTime() >= HOUR;
  if (rec && !newWindow && rec.sendCount >= cfg.maxSendsPerHour) {
    throw new ApiError(429, 'Too many codes requested. Please try again in an hour.');
  }

  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
  if (!rec) rec = new OTPVerification({ identifier, purpose });
  rec.set({
    user: user._id,
    codeHash: hashCode(identifier, purpose, code),
    expiresAt: new Date(now + cfg.ttlMinutes * 60 * 1000),
    attempts: 0,
    consumedAt: null,
    resendAvailableAt: new Date(now + cfg.resendCooldownSec * 1000),
    windowStartedAt: newWindow ? new Date(now) : rec.windowStartedAt,
    sendCount: newWindow ? 1 : rec.sendCount + 1,
    purgeAt: new Date(now + 2 * HOUR),
  });
  await rec.save();

  try {
    const sentTo = await deliverOtp(user, code, purpose);
    return { sentTo, resendAfter: cfg.resendCooldownSec, expiresInMinutes: cfg.ttlMinutes };
  } catch (err) {
    // Delivery failed: invalidate this code and let the user retry right away.
    await OTPVerification.updateOne({ _id: rec._id }, { expiresAt: new Date(now), resendAvailableAt: new Date(now) });
    throw err;
  }
}

/** Checks a code. Counts attempts atomically; a correct code can be used only once. */
export async function consumeOtp(identifier, purpose, code) {
  const now = new Date();
  // Count the attempt first (atomic), THEN compare — so parallel guesses can't bypass the limit.
  const counted = await OTPVerification.updateOne(
    { identifier, purpose, consumedAt: null, expiresAt: { $gt: now }, attempts: { $lt: env.otp.maxAttempts } },
    { $inc: { attempts: 1 } }
  );
  const rec = counted.modifiedCount === 1 ? await OTPVerification.findOne({ identifier, purpose }).select('+codeHash') : null;

  if (!rec) {
    const existing = await OTPVerification.findOne({ identifier, purpose }).lean();
    if (existing && !existing.consumedAt && existing.expiresAt > now && existing.attempts >= env.otp.maxAttempts) {
      throw new ApiError(429, 'Too many wrong attempts. Please request a new code.');
    }
    throw new ApiError(400, OTP_INVALID);
  }

  if (!safeEqualHex(rec.codeHash, hashCode(identifier, purpose, code))) {
    const left = env.otp.maxAttempts - rec.attempts;
    throw new ApiError(400, left > 0 ? `Incorrect code. ${left} attempt${left === 1 ? '' : 's'} left.` : 'Too many wrong attempts. Please request a new code.');
  }

  const used = await OTPVerification.updateOne({ _id: rec._id, consumedAt: null }, { consumedAt: now });
  if (used.modifiedCount !== 1) throw new ApiError(400, OTP_INVALID);
}
