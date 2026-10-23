import { ApiError } from '../utils/http.js';

/**
 * validate({ body, params, query }) — each a zod schema.
 * Parsed (trimmed, normalised) values replace the raw request values.
 * Unknown body fields are dropped because schemas are strict objects.
 */
export const validate = (schemas) => (req, _res, next) => {
  const fields = {};
  for (const key of ['params', 'query', 'body']) {
    const schema = schemas[key];
    if (!schema) continue;
    const result = schema.safeParse(req[key] ?? {});
    if (!result.success) {
      for (const issue of result.error.issues) {
        const path = issue.path.join('.') || key;
        if (!fields[path]) fields[path] = issue.message;
      }
    } else {
      req[key] = result.data;
    }
  }
  if (Object.keys(fields).length) return next(new ApiError(400, 'Please fix the highlighted fields.', { fields }));
  return next();
};
