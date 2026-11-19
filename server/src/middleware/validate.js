import { httpError } from '../utils/httpError.js';

// validate(schema, 'body' | 'query' | 'params') -> parsed data lands in req.valid[source]
export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    return next(httpError(400, 'Validation failed', details));
  }
  req.valid = req.valid || {};
  req.valid[source] = result.data;
  next();
};
