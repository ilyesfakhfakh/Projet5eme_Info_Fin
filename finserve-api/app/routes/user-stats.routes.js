const { requireRole } = require('../middlewares/auth/permission.guard');
const statsController = require('../controllers/users/stats.controller');

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      'Access-Control-Allow-Headers',
      'x-access-token, Origin, Content-Type, Accept'
    );
    next();
  });

  app.get(
    '/api/v1/users/:id/stats',
    [requireRole(['ADMIN'])],
    statsController.getUserStats
  );
};