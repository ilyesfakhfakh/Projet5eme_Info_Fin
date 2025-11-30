const db = require('../../models');

async function getUserWithRoles(userId) {
  if (!userId) return null;
  return db.users.findOne({
    where: { user_id: userId },
    include: [
      {
        model: db.roles,
        through: { attributes: [] },
      },
    ],
  });
}

function extractUserId(req) {
  // Prefer a user injected by an auth middleware (e.g., from JWT)
  if (req.user && req.user.user_id) return req.user.user_id;
  // Fallbacks for quick integration
  return req.headers['x-user-id'];
}

function requireRole(requiredRoles = []) {
  return async (req, res, next) => {
    try {
      const userId = extractUserId(req);
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      const user = await getUserWithRoles(userId);
      if (!user) return res.status(401).json({ message: 'Unauthorized' });
      const userRoles = (user.roles || []).map((r) => r.role_name);
      // ADMIN a tous les droits
      if (userRoles.includes('ADMIN')) {
        req.user = user;
        return next();
      }
      const ok = requiredRoles.length === 0 || requiredRoles.some((r) => userRoles.includes(r));
      if (!ok) return res.status(403).json({ message: 'Forbidden' });
      req.user = user; // expose to downstream
      next();
    } catch (e) {
      next(e);
    }
  };
}

function requirePermission(requiredPermissions = []) {
  return async (req, res, next) => {
    try {
      // Si un middleware auth (JWT) a déjà injecté req.user, on l'utilise
      let user = req.user;
      if (!user) {
        const userId = extractUserId(req);
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });
        user = await getUserWithRoles(userId);
      }
      if (!user) return res.status(401).json({ message: 'Unauthorized' });
      // ADMIN a tous les droits
      const hasAdmin = (user.roles || []).some((r) => r.role_name === 'ADMIN');
      if (hasAdmin) {
        req.user = user;
        return next();
      }

      // Normaliser les permissions et éviter les erreurs si mal formées
      const permissions = new Set();
      (user.roles || []).forEach((role) => {
        let perms = role && role.permissions;
        if (perms == null) perms = [];
        if (typeof perms === 'string') {
          try {
            const parsed = JSON.parse(perms);
            if (Array.isArray(parsed)) perms = parsed;
            else perms = [perms];
          } catch (_) {
            perms = perms.split(',').map((s) => s.trim()).filter(Boolean);
          }
        }
        if (!Array.isArray(perms)) perms = [perms];
        perms.filter(Boolean).forEach((p) => permissions.add(p));
      });
      const ok = requiredPermissions.length === 0 || requiredPermissions.some((p) => permissions.has(p));
      if (!ok) return res.status(403).json({ message: 'Forbidden' });
      req.user = user;
      next();
    } catch (e) {
      next(e);
    }
  };
}

module.exports = {
  requireRole,
  requirePermission,
};
