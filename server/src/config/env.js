import 'dotenv/config';

const fail = (msg) => {
  console.error(`[config] ${msg}`);
  process.exit(1);
};

const isProd = process.env.NODE_ENV === 'production';

for (const key of ['MONGODB_URI', 'JWT_SECRET', 'OTP_HMAC_SECRET', 'RESET_TOKEN_SECRET']) {
  if (!process.env[key]) fail(`Missing required environment variable ${key}. See .env.example`);
}
const secrets = ['JWT_SECRET', 'OTP_HMAC_SECRET', 'RESET_TOKEN_SECRET'];
for (const key of secrets) {
  if (process.env[key].length < 32) fail(`${key} must be at least 32 characters long.`);
}
if (new Set(secrets.map((k) => process.env[k])).size !== secrets.length) fail('JWT_SECRET, OTP_HMAC_SECRET and RESET_TOKEN_SECRET must all be different.');
if (isProd && process.env.DEV_LOG_OTP === 'true') fail('DEV_LOG_OTP must be false in production (it would print OTPs to logs).');

const num = (v, d) => (Number.isFinite(Number(v)) && v !== '' && v !== undefined ? Number(v) : d);
const sameSite = (process.env.COOKIE_SAMESITE || 'lax').toLowerCase();

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd,
  port: num(process.env.PORT, 5000),
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((s) => s.trim()).filter(Boolean),
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  resetTokenSecret: process.env.RESET_TOKEN_SECRET,
  cookie: {
    sameSite: ['lax', 'strict', 'none'].includes(sameSite) ? sameSite : 'lax',
    secure: isProd || sameSite === 'none',
  },
  otp: {
    hmacSecret: process.env.OTP_HMAC_SECRET,
    ttlMinutes: num(process.env.OTP_TTL_MINUTES, 10),
    maxAttempts: num(process.env.OTP_MAX_ATTEMPTS, 5),
    resendCooldownSec: num(process.env.OTP_RESEND_COOLDOWN_SECONDS, 60),
    maxSendsPerHour: num(process.env.OTP_MAX_SENDS_PER_HOUR, 5),
    devLog: !isProd && process.env.DEV_LOG_OTP === 'true',
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: num(process.env.SMTP_PORT, 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'QuickFix Home <no-reply@example.com>',
  },
  sms: {
    provider: (process.env.SMS_PROVIDER || '').toLowerCase(),
    fast2smsKey: process.env.FAST2SMS_API_KEY || '',
    twilioSid: process.env.TWILIO_ACCOUNT_SID || '',
    twilioToken: process.env.TWILIO_AUTH_TOKEN || '',
    twilioFrom: process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_PHONE_NUMBER || '',
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
  },
  gstRatePercent: num(process.env.GST_RATE_PERCENT, 0),
});
