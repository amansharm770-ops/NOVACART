import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { httpError } from '../utils/httpError.js';

const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);

// Double-submit token. The cookie is HttpOnly; the client gets the value from
// GET /api/auth/csrf and echoes it in the X-CSRF-Token header.
export function issueCsrfToken(req, res) {
  const token = req.cookies?.csrf_token || crypto.randomBytes(24).toString('hex');
  res.cookie('csrf_token', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production' || env.COOKIE_SAMESITE === 'none',
    sameSite: env.COOKIE_SAMESITE,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.json({ csrfToken: token });
}

export function csrfProtection(req, _res, next) {
  if (SAFE.has(req.method)) return next();
  const cookie = req.cookies?.csrf_token;
  const header = req.get('x-csrf-token');
  if (!cookie || !header) throw httpError(403, 'Invalid CSRF token');
  const a = Buffer.from(cookie);
  const b = Buffer.from(header);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw httpError(403, 'Invalid CSRF token');
  next();
}
