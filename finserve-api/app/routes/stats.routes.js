const { authJwt } = require("../middlewares/auth/jwt.guard");
const { requireRole } = require("../middlewares/auth/permission.guard");
const controller = require("../controllers/stats.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.get(
    "/api/v1/stats/new-users-by-month",
    [authJwt.verifyToken, requireRole(['ADMIN'])],
    controller.getNewUsersByMonth
  );
};
