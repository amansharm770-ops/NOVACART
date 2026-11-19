import { env } from '../config/env.js';
import { ACCESS_TTL_SEC, REFRESH_TTL_MS } from './tokens.js';

const base = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production' || env.COOKIE_SAMESITE === 'none',
  sameSite: env.COOKIE_SAMESITE,
});

export function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie('access_token', accessToken, { ...base(), path: '/', maxAge: ACCESS_TTL_SEC * 1000 });
  // Refresh token is only ever sent to the auth endpoints.
  res.cookie('refresh_token', refreshToken, { ...base(), path: '/api/auth', maxAge: REFRESH_TTL_MS });
}

export function clearAuthCookies(res) {
  res.clearCookie('access_token', { ...base(), path: '/' });
  res.clearCookie('refresh_token', { ...base(), path: '/api/auth' });
}
