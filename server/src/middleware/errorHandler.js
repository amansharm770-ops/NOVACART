import { env } from '../config/env.js';

export function notFound(_req, res) {
  res.status(404).json({ message: 'Not found' });
}

// Central error handler. Never sends stack traces or internal messages to the client.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  let status = Number(err.status || err.statusCode) || 500;
  if (status < 400 || status > 599) status = 500;

  // Malformed JSON body etc. from body-parser
  if (err.type === 'entity.parse.failed') status = 400;
  if (err.name === 'CastError') status = 400;

  if (status >= 500 && env.NODE_ENV !== 'test') {
    console.error(`[error] ${err.name}: ${err.message}`);
  }

  const safeMessages = {
    400: 'Bad request',
    401: 'Authentication required',
    403: 'Forbidden',
    404: 'Not found',
    413: 'Payload too large',
    429: 'Too many requests',
  };
  const message = err.name === 'HttpError' ? err.message : safeMessages[status] || 'Something went wrong';
  res.status(status).json({ message, ...(err.errors ? { errors: err.errors } : {}) });
}
