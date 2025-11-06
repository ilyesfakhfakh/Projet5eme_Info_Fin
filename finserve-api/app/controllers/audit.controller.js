const db = require('../models');
const { Op } = require('sequelize');

async function listAuditLogs(req, res) {
  try {
    const { q = '', page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    const where = {};
    if (q) {
      where[Op.or] = [
        { action: { [Op.iLike]: `%${q}%` } },
        { entity_type: { [Op.iLike]: `%${q}%` } },
        { entity_id: { [Op.iLike]: `%${q}%` } },
      ];
    }

    const { count, rows } = await db.audit_logs.findAndCountAll({
      where,
      include: [
        {
          model: db.users,
          as: 'user',
          attributes: ['user_id', 'username', 'email'],
        },
      ],
      order: [['timestamp', 'DESC']],
      offset,
      limit: pageSize,
    });

    return res.json({
      logs: rows,
      total: count,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(count / pageSize),
    });
  } catch (e) {
    console.error('Error in listAuditLogs:', e);
    return res.status(500).json({ message: 'Erreur serveur', error: e.message });
  }
}

module.exports = { listAuditLogs };
