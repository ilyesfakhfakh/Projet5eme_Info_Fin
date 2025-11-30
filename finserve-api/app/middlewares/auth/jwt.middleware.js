const jwt = require('jsonwebtoken');
const db = require('../../models');

function jwtVerify(options = {}) {
  const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
  return async (req, res, next) => {
    try {
      const auth = req.headers['authorization'] || '';
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
      if (!token) return res.status(401).json({ message: 'Unauthorized' });
      const payload = jwt.verify(token, secret);
      // Charger l\'utilisateur avec ses rôles pour permissions downstream
      const user = await db.users.findOne({
        where: { user_id: payload.sub },
        include: [{ model: db.roles, through: { attributes: [] } }],
      });
      if (!user) return res.status(401).json({ message: 'Unauthorized' });
      // Exiger une session active pour ce token (jti)
      const activeSession = await db.sessions.findOne({ where: { session_id: payload.jti, user_id: payload.sub, is_active: true } });
      if (!activeSession) return res.status(401).json({ message: 'Unauthorized' });
      req.user = { ...user.get({ plain: true }), token_jti: payload.jti };
      next();
    } catch (e) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  };
}

module.exports = { jwtVerify };
