import { Router } from 'express';
import * as c from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { authLimiter, otpLimiter } from '../middleware/rateLimiters.js';
import { asyncHandler as h } from '../utils/http.js';
import * as s from '../validators/schemas.js';

const r = Router();
r.post('/register', authLimiter, validate({ body: s.registerBody }), h(c.register));
r.post('/login', authLimiter, validate({ body: s.loginBody }), h(c.login));
r.post('/verify-otp', otpLimiter, validate({ body: s.verifyOtpBody }), h(c.verifyOtp));
r.post('/resend-otp', otpLimiter, validate({ body: s.resendOtpBody }), h(c.resendOtp));
r.post('/forgot-password', otpLimiter, validate({ body: s.forgotBody }), h(c.forgotPassword));
r.post('/reset-password', authLimiter, validate({ body: s.resetBody }), h(c.resetPassword));
r.post('/logout', c.logout);
r.get('/me', protect, c.me);
export default r;
