const express = require('express');
const router = express.Router();
const { listAuditLogs } = require('../controllers/audit.controller');
const { jwtVerify } = require('../middlewares/auth/jwt.middleware');
const { requirePermission } = require('../middlewares/auth/permission.guard');
const { sessionActivityMiddleware } = require('../middlewares/auth/session-activity.middleware');

router.use(sessionActivityMiddleware);
router.use(jwtVerify());

// Lecture des logs d'audit (ADMIN uniquement)
router.get('/audit-logs', requirePermission(['VIEW_AUDIT_LOGS']), listAuditLogs);

module.exports = router;
