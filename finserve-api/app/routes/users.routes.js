const express = require('express');
const router = express.Router();
const { listUsers, getUser, createUser, updateUser, deleteUser, setUserRoles, exportUsers } = require('../controllers/users.controller');
const { getUserStats } = require('../controllers/users/stats.controller');
const { getUserAuditLogs } = require('../controllers/users/audit-logs.controller');
const { jwtVerify } = require('../middlewares/auth/jwt.middleware');
const { requireRole, requirePermission } = require('../middlewares/auth/permission.guard');
const { sessionActivityMiddleware } = require('../middlewares/auth/session-activity.middleware');

router.use(sessionActivityMiddleware);
router.use(jwtVerify());

// Lecture liste et détail (ADMIN ou permission VIEW_USERS)
router.get('/', requirePermission(['VIEW_USERS']), listUsers);
router.get('/export', requirePermission(['VIEW_USERS']), exportUsers);
router.get('/:id', requirePermission(['VIEW_USERS']), getUser);

// Statistiques et logs d'audit
router.get('/:id/stats', requirePermission(['VIEW_USERS']), getUserStats);
router.get('/:id/audit-logs', requirePermission(['VIEW_USERS']), getUserAuditLogs);

// MAJ/Suppression (ADMIN ou permissions dédiées)
router.put('/:id', requirePermission(['MANAGE_USERS']), updateUser);
router.delete('/:id', requirePermission(['MANAGE_USERS']), deleteUser);

// Affectation de rôles (ADMIN uniquement ou permission MANAGE_ROLES)
router.put('/:id/roles', requirePermission(['MANAGE_ROLES']), setUserRoles);

module.exports = router;
