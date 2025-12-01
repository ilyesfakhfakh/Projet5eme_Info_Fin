const db = require('../models');
const match3Service = require('../services/match3.service');

/**
 * Create a new Match-3 game
 */
exports.createGame = async (req, res) => {
  try {
    const userId = req.query.userId || 'demo-user';
    const level = parseInt(req.body.level) || 1;
    
    const game = await match3Service.createGame(db, userId, level);
    
    res.json({
      success: true,
      game: {
        ...game.toJSON(),
        board_state: JSON.parse(game.board_state),
        power_ups: JSON.parse(game.power_ups || '[]')
      }
    });
  } catch (error) {
    console.error('[Match-3] Create game error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get a game by ID
 */
exports.getGame = async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const game = await match3Service.getGame(db, gameId);
    
    res.json({
      success: true,
      game: game
    });
  } catch (error) {
    console.error('[Match-3] Get game error:', error);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Make a move
 */
exports.makeMove = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { pos1, pos2 } = req.body;
    
    if (!pos1 || !pos2) {
      return res.status(400).json({
        success: false,
        error: 'Both pos1 and pos2 are required'
      });
    }
    
    const result = await match3Service.makeMove(db, gameId, pos1, pos2);
    
    res.json({
      success: true,
      game: {
        ...result.game.toJSON(),
        board_state: result.board,
        power_ups: JSON.parse(result.game.power_ups || '[]')
      },
      matches: result.matches,
      score_gained: result.scoreGained
    });
  } catch (error) {
    console.error('[Match-3] Make move error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get user statistics
 */
exports.getStats = async (req, res) => {
  try {
    const userId = req.query.userId || 'demo-user';
    
    const stats = await match3Service.getUserStats(db, userId);
    
    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('[Match-3] Get stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get leaderboard
 */
exports.getLeaderboard = async (req, res) => {
  try {
    const level = parseInt(req.params.level) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const leaderboard = await match3Service.getLeaderboard(db, level, limit);
    
    res.json({
      success: true,
      leaderboard: leaderboard
    });
  } catch (error) {
    console.error('[Match-3] Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get game configuration
 */
exports.getConfig = async (req, res) => {
  try {
    res.json({
      success: true,
      config: {
        symbols: match3Service.SYMBOLS,
        board_size: match3Service.BOARD_SIZE,
        min_match: 3,
        levels: [
          { level: 1, target_score: 1000, moves: 30 },
          { level: 2, target_score: 1500, moves: 30 },
          { level: 3, target_score: 2000, moves: 29 },
          { level: 4, target_score: 2500, moves: 29 },
          { level: 5, target_score: 3000, moves: 28 },
          { level: 6, target_score: 3500, moves: 28 },
          { level: 7, target_score: 4000, moves: 27 },
          { level: 8, target_score: 4500, moves: 27 },
          { level: 9, target_score: 5000, moves: 26 },
          { level: 10, target_score: 6000, moves: 25 }
        ]
      }
    });
  } catch (error) {
    console.error('[Match-3] Get config error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
