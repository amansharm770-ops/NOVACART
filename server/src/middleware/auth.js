import User from '../models/User.js';
import { httpError } from '../utils/httpError.js';
import { verifyAccessToken } from '../utils/tokens.js';

// Loads the user fresh from the DB, so disabling an account takes effect immediately.
export async function requireAuth(req, _res, next) {
  const token = req.cookies?.access_token;
  if (!token) throw httpError(401, 'Please log in to continue');
  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw httpError(401, 'Session expired');
  }
  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) throw httpError(401, 'Session expired');
  req.user = user;
  next();
}

export function requireAdmin(req, _res, next) {
  if (req.user?.role !== 'admin') throw httpError(403, 'Admin access required');
  next();
}
