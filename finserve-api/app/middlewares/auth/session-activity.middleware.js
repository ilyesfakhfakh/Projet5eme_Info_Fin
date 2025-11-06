const db = require('../../models');

async function updateSessionActivity(sessionId, userAgent, ip) {
  if (!sessionId) return;
  try {
    const session = await db.sessions.findOne({ where: { session_id: sessionId, is_active: true } });
    if (!session) return;
    const now = new Date();
    if (session.expires_at && session.expires_at < now) {
      await session.update({ is_active: false });
      return;
    }
    await session.update({ last_activity: now, user_agent: userAgent || session.user_agent, ip_address: ip || session.ip_address });
  } catch (e) {
    // Swallow to not block request flow
  }
}

function sessionActivityMiddleware(req, res, next) {
  const sessionId = req.headers['x-session-id'] || req.session_id || (req.session && req.session.id);
  const userAgent = req.headers['user-agent'];
  const ip = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || req.ip;
  updateSessionActivity(sessionId, userAgent, ip).finally(() => next());
}

module.exports = {
  sessionActivityMiddleware,
  updateSessionActivity,
};
