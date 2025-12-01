module.exports = app => {
  const match3 = require('../controllers/match3.controller.js');
  const router = require('express').Router();

  // Get game configuration
  router.get('/config', match3.getConfig);

  // Create new game
  router.post('/game/create', match3.createGame);

  // Get game by ID
  router.get('/game/:gameId', match3.getGame);

  // Make a move
  router.post('/game/:gameId/move', match3.makeMove);

  // Get user statistics
  router.get('/stats', match3.getStats);

  // Get leaderboard for a level
  router.get('/leaderboard/:level', match3.getLeaderboard);

  app.use('/api/v1/match3', router);
};
