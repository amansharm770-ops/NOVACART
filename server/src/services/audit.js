import AuditLog from '../models/AuditLog.js';

// Never put passwords, tokens or full request bodies into `meta`.
export async function audit(req, action, entity, entityId, meta = {}) {
  try {
    await AuditLog.create({
      actor: req.user?._id ?? null,
      actorEmail: req.user?.email,
      action,
      entity,
      entityId: entityId ? String(entityId) : undefined,
      meta,
      ip: req.ip,
    });
  } catch (err) {
    console.error(`[audit] failed to write log: ${err.message}`);
  }
}
