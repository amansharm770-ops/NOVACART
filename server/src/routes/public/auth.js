import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { z } from 'zod';
import User, { toPublicUser } from '../../models/User.js';
import RefreshToken from '../../models/RefreshToken.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import { issueCsrfToken } from '../../middleware/csrf.js';
import { authLimiter, adminAuthLimiter } from '../../middleware/rateLimiters.js';
import { httpError } from '../../utils/httpError.js';
import { clearAuthCookies, setAuthCookies } from '../../utils/cookies.js';
import { REFRESH_TTL_MS, hashToken, newRefreshToken, signAccessToken } from '../../utils/tokens.js';
import { audit } from '../../services/audit.js';

const router = Router();

const MAX_FAILED_LOGINS = 5;
const LOCK_MS = 15 * 60 * 1000; // temporary cooldown, never a permanent lockout
const REUSE_GRACE_MS = 10 * 1000; // two tabs refreshing at the same moment is not an attack
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12); // keeps timing equal for unknown emails

const passwordRule = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password is too long')
  .regex(/[A-Za-z]/, 'Password needs at least one letter')
  .regex(/\d/, 'Password needs at least one number');

const registerSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.string().trim().toLowerCase().email().max(120),
  password: passwordRule,
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(120),
  password: z.string().min(1).max(72),
});

async function startSession(req, res, user, family = crypto.randomUUID()) {
  const refresh = newRefreshToken();
  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(refresh),
    family,
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    ip: req.ip,
    userAgent: (req.get('user-agent') || '').slice(0, 200),
  });
  setAuthCookies(res, signAccessToken(user), refresh);
}

async function authenticate(email, password, { adminOnly = false } = {}) {
  const invalid = () => httpError(401, 'Invalid email or password');
  const user = await User.findOne({ email }).select('+passwordHash');

  if (!user) {
    await bcrypt.compare(password, DUMMY_HASH);
    throw invalid();
  }
  if (user.lockUntil && user.lockUntil > new Date()) {
    throw httpError(429, 'Too many failed attempts. Please try again in a few minutes.');
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    user.failedLoginCount += 1;
    if (user.failedLoginCount >= MAX_FAILED_LOGINS) {
      user.lockUntil = new Date(Date.now() + LOCK_MS);
      user.failedLoginCount = 0;
    }
    await user.save();
    throw invalid();
  }
  if (!user.isActive || (adminOnly && user.role !== 'admin')) throw invalid();

  if (user.failedLoginCount || user.lockUntil) {
    user.failedLoginCount = 0;
    user.lockUntil = null;
    await user.save();
  }
  return user;
}

router.get('/csrf', issueCsrfToken);

router.post('/register', authLimiter, validate(registerSchema), async (req, res) => {
  const { name, email, password } = req.valid.body;
  if (await User.exists({ email })) throw httpError(409, 'An account with this email already exists');

  // role is never taken from the request: public signup can only create customers.
  const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12) });
  await startSession(req, res, user);
  res.status(201).json({ user: toPublicUser(user) });
});

router.post('/login', authLimiter, validate(loginSchema), async (req, res) => {
  const { email, password } = req.valid.body;
  const user = await authenticate(email, password);
  await startSession(req, res, user);
  res.json({ user: toPublicUser(user) });
});

router.post('/admin/login', adminAuthLimiter, validate(loginSchema), async (req, res) => {
  const { email, password } = req.valid.body;
  const user = await authenticate(email, password, { adminOnly: true });
  await startSession(req, res, user);
  req.user = user;
  await audit(req, 'auth.admin_login', 'user', user._id);
  res.json({ user: toPublicUser(user) });
});

router.post('/refresh', async (req, res) => {
  const fail = () => {
    clearAuthCookies(res);
    return httpError(401, 'Session expired');
  };
  const raw = req.cookies?.refresh_token;
  if (!raw) throw fail();

  const record = await RefreshToken.findOne({ tokenHash: hashToken(raw) });
  if (!record) throw fail();

  if (record.revokedAt) {
    // An already-used token came back: possible theft, so kill the whole session family.
    if (Date.now() - record.revokedAt.getTime() > REUSE_GRACE_MS) {
      await RefreshToken.updateMany({ family: record.family, revokedAt: null }, { revokedAt: new Date() });
    }
    throw fail();
  }
  if (record.expiresAt < new Date()) throw fail();

  const user = await User.findById(record.user);
  if (!user || !user.isActive) throw fail();

  // Rotate: the old token can be used exactly once.
  const rotated = await RefreshToken.findOneAndUpdate(
    { _id: record._id, revokedAt: null },
    { revokedAt: new Date() }
  );
  if (!rotated) throw fail();

  await startSession(req, res, user, record.family);
  res.json({ user: toPublicUser(user) });
});

router.post('/logout', async (req, res) => {
  const raw = req.cookies?.refresh_token;
  if (raw) {
    await RefreshToken.updateOne({ tokenHash: hashToken(raw), revokedAt: null }, { revokedAt: new Date() });
  }
  clearAuthCookies(res);
  res.json({ message: 'Logged out' });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: toPublicUser(req.user) });
});

export default router;
