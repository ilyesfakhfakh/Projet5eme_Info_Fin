const express = require('express');
const router = express.Router();
const { listRoles, getRole, createRole, updateRole, deleteRole } = require('../controllers/roles.controller');
const { jwtVerify } = require('../middlewares/auth/jwt.middleware');
const { requirePermission } = require('../middlewares/auth/permission.guard');
const { sessionActivityMiddleware } = require('../middlewares/auth/session-activity.middleware');

router.use(sessionActivityMiddleware);
router.use(jwtVerify());

router.get('/', requirePermission(['MANAGE_ROLES', 'VIEW_USERS']), listRoles);
router.get('/:id', requirePermission(['MANAGE_ROLES', 'VIEW_USERS']), getRole);
router.put('/:id', requirePermission(['MANAGE_ROLES']), updateRole);
router.delete('/:id', requirePermission(['MANAGE_ROLES']), deleteRole);

module.exports = router;
