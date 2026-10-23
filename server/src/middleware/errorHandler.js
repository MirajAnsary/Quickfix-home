import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { ApiError } from '../utils/http.js';

export const notFound = (req, _res, next) => next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  let status = err.statusCode || 500;
  let message = err.message || 'Something went wrong.';
  let details = err.details;

  if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = 'Please fix the highlighted fields.';
    details = { fields: Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message])) };
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = 'Invalid id.';
  } else if (err?.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern || {})[0] || 'value';
    message = field === 'email' || field === 'phone' ? `An account with this ${field} already exists.` : 'This record already exists.';
    details = { fields: { [field]: message } };
  } else if (err?.type === 'entity.parse.failed') {
    status = 400;
    message = 'Invalid JSON body.';
  } else if (err?.type === 'entity.too.large') {
    status = 413;
    message = 'Request is too large.';
  }

  if (status >= 500) {
    // Log without request bodies (they can contain passwords or OTPs).
    if (err instanceof ApiError) {
      console.warn(`[warn] ${req.method} ${req.originalUrl}: ${status} ${err.message}`);
    } else {
      console.error(`[error] ${req.method} ${req.originalUrl}:`, env.isProd ? err.message : err);
      if (env.isProd) message = 'Something went wrong. Please try again.';
    }
  }

  res.status(status).json({ message, ...(details ? { details } : {}) });
}
