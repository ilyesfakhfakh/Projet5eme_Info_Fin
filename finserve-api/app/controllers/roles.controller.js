const db = require('../models');

async function createAudit(req, action, entityType, entityId, oldValues, newValues) {
  try {
    await db.audit_logs.create({
      user_id: req.user && req.user.user_id,
      action,
      entity_type: entityType,
      entity_id: String(entityId || ''),
      old_values: oldValues || {},
      new_values: newValues || {},
      ip_address: req.headers['x-forwarded-for'] || req.connection?.remoteAddress || req.ip,
    });
  } catch (e) {}
}

async function listRoles(req, res) {
  try {
    const roles = await db.roles.findAll();
    return res.json(roles);
  } catch (e) {
    return res.status(500).json({ message: 'Erreur serveur', error: e.message });
  }
}

async function getRole(req, res) {
  try {
    const { id } = req.params;
    const role = await db.roles.findOne({ where: { role_id: id } });
    if (!role) return res.status(404).json({ message: 'Rôle non trouvé' });
    return res.json(role);
  } catch (e) {
    return res.status(500).json({ message: 'Erreur serveur', error: e.message });
  }
}

async function createRole(req, res) {
  try {
    const { role_name, permissions = [] } = req.body || {};
    if (!role_name) return res.status(400).json({ message: 'role_name requis' });
    const exists = await db.roles.findOne({ where: { role_name } });
    if (exists) return res.status(409).json({ message: 'Rôle déjà existant' });
    const role = await db.roles.create({ role_name, permissions });
    await createAudit(req, 'ROLE_CREATE', 'ROLE', role.role_id, null, role && role.get ? role.get({ plain: true }) : role);
    return res.status(201).json(role);
  } catch (e) {
    return res.status(500).json({ message: 'Erreur serveur', error: e.message });
  }
}

async function updateRole(req, res) {
  try {
    const { id } = req.params;
    const { permissions } = req.body || {};
    const role = await db.roles.findOne({ where: { role_id: id } });
    if (!role) return res.status(404).json({ message: 'Rôle non trouvé' });
    const before = role.get({ plain: true });
    await role.update({ permissions });
    await createAudit(req, 'ROLE_UPDATE', 'ROLE', id, before, role && role.get ? role.get({ plain: true }) : role);
    return res.json(role);
  } catch (e) {
    return res.status(500).json({ message: 'Erreur serveur', error: e.message });
  }
}

async function deleteRole(req, res) {
  try {
    const { id } = req.params;
    const role = await db.roles.findOne({ where: { role_id: id } });
    if (!role) return res.status(404).json({ message: 'Rôle non trouvé' });
    const before = role.get({ plain: true });
    await role.destroy();
    await createAudit(req, 'ROLE_DELETE', 'ROLE', id, before, null);
    return res.json({ message: 'Supprimé' });
  } catch (e) {
    return res.status(500).json({ message: 'Erreur serveur', error: e.message });
  }
}

module.exports = { listRoles, getRole, createRole, updateRole, deleteRole };
