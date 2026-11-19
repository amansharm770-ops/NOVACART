import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const ACCESS_TTL_SEC = 15 * 60;
export const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const hashToken = (raw) => crypto.createHash('sha256').update(raw).digest('hex');
export const newRefreshToken = () => crypto.randomBytes(48).toString('hex');

export const signAccessToken = (user) =>
  jwt.sign({ sub: String(user._id), role: user.role }, env.JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TTL_SEC,
    algorithm: 'HS256',
  });

export const verifyAccessToken = (token) =>
  jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] });
