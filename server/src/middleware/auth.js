import { User } from '../models/index.js';
import { ApiError, asyncHandler } from '../utils/http.js';
import { AUTH_COOKIE, verifyAccessToken } from '../utils/tokens.js';

/** Requires a valid JWT (httpOnly cookie, or "Authorization: Bearer" for API tools). */
export const protect = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;
  const token = req.cookies?.[AUTH_COOKIE] || (header?.startsWith('Bearer ') ? header.slice(7) : null);
  if (!token) throw new ApiError(401, 'Please log in to continue.');

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new ApiError(401, 'Your session has expired. Please log in again.');
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive || user.tokenVersion !== payload.tv) {
    throw new ApiError(401, 'Your session has expired. Please log in again.');
  }
  if (!user.isVerified) throw new ApiError(403, 'Please verify your account first.');

  req.user = user;
  next();
});

/** Role-based access control. Use after protect. */
export const authorize =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return next(new ApiError(403, 'You do not have permission to do this.'));
    return next();
  };
