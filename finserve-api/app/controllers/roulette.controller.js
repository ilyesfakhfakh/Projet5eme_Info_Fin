const express = require('express');
const router = express.Router();
const rouletteService = require('../services/roulette.service');
const db = require('../models');

// Get game configuration
const getGameConfig = async (req, res) => {
  try {
    res.json({
      success: true,
      config: {
        sectors: rouletteService.SECTORS,
        stocks: rouletteService.STOCKS,
        payouts: rouletteService.PAYOUTS,
        minBet: 1,
        maxBet: 10000,
        jackpotContributionRate: 0.01
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get or create user wallet
const getWallet = async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId || 'demo-user';
    
    const wallet = await rouletteService.getOrCreateWallet(db, userId);
    
    res.json({
      success: true,
      wallet: {
        balance: wallet.balance,
        currency: wallet.currency,
        total_wagered: wallet.total_wagered,
        total_won: wallet.total_won
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get jackpot information
const getJackpot = async (req, res) => {
  try {
    const jackpot = await rouletteService.getJackpotInfo(db);
    
    res.json({
      success: true,
      jackpot: {
        current_amount: jackpot.current_amount,
        last_winner: jackpot.last_winner,
        last_win_amount: jackpot.last_win_amount,
        last_win_date: jackpot.last_win_date,
        total_paid: jackpot.total_paid
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Create new game
const createGame = async (req, res) => {
  try {
    const game = await rouletteService.createGame(db);
    const volatility = await rouletteService.getMarketVolatility();
    
    res.json({
      success: true,
      game: {
        game_id: game.game_id,
        game_number: game.game_number,
        volatility_index: volatility,
        status: game.status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Place bet
const placeBet = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId || 'demo-user';
    const { gameId, betType, betValue, amount } = req.body;
    
    if (!gameId || !betType || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: gameId, betType, amount'
      });
    }
    
    const bet = await rouletteService.placeBet(
      db,
      userId,
      gameId,
      betType,
      betValue,
      parseFloat(amount)
    );
    
    res.json({
      success: true,
      bet: {
        bet_id: bet.bet_id,
        game_id: bet.game_id,
        bet_type: bet.bet_type,
        bet_value: bet.bet_value,
        amount: bet.amount,
        potential_payout: bet.potential_payout,
        result: bet.result
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Spin roulette
const spinRoulette = async (req, res) => {
  try {
    const { gameId } = req.params;
    
    if (!gameId) {
      return res.status(400).json({
        success: false,
        error: 'Game ID is required'
      });
    }
    
    const result = await rouletteService.spinRoulette(db, gameId);
    
    res.json({
      success: true,
      result: {
        game_id: result.game.game_id,
        game_number: result.game.game_number,
        outcome: {
          type: result.outcome.type,
          value: result.outcome.value,
          multiplier: result.outcome.multiplier,
          color: result.outcome.color
        },
        total_bets: result.game.total_bets,
        total_payouts: result.totalPayouts,
        volatility: result.game.volatility_index,
        jackpot_won: !!result.jackpotWinner,
        jackpot_winner: result.jackpotWinner,
        jackpot_amount: result.jackpotAmount,
        timestamp: result.game.spin_timestamp
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Get game history
const getGameHistory = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    
    const games = await rouletteService.getGameHistory(db, limit);
    
    res.json({
      success: true,
      count: games.length,
      games: games.map(g => ({
        game_number: g.game_number,
        result_type: g.result_type,
        result_value: g.result_value,
        multiplier: g.multiplier,
        total_bets: g.total_bets,
        total_payouts: g.total_payouts,
        volatility_index: g.volatility_index,
        spin_timestamp: g.spin_timestamp
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get user bet history
const getUserBetHistory = async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId || 'demo-user';
    const limit = parseInt(req.query.limit) || 50;
    
    const bets = await rouletteService.getUserBetHistory(db, userId, limit);
    
    res.json({
      success: true,
      count: bets.length,
      bets: bets.map(b => ({
        bet_id: b.bet_id,
        game_number: b.roulette_game?.game_number,
        bet_type: b.bet_type,
        bet_value: b.bet_value,
        amount: b.amount,
        potential_payout: b.potential_payout,
        actual_payout: b.actual_payout,
        result: b.result,
        game_result_type: b.roulette_game?.result_type,
        game_result_value: b.roulette_game?.result_value,
        created_at: b.created_at
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get user statistics
const getUserStats = async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId || 'demo-user';
    
    const stats = await rouletteService.getUserStats(db, userId);
    
    if (!stats) {
      return res.status(404).json({
        success: false,
        error: 'User wallet not found'
      });
    }
    
    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get current volatility
const getVolatility = async (req, res) => {
  try {
    const volatility = await rouletteService.getMarketVolatility();
    
    res.json({
      success: true,
      volatility: volatility,
      level: volatility < 15 ? 'LOW' : volatility < 25 ? 'MODERATE' : 'HIGH',
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Routes
router.get('/config', getGameConfig);
router.get('/wallet', getWallet);
router.get('/jackpot', getJackpot);
router.post('/game/create', createGame);
router.post('/game/bet', placeBet);
router.post('/game/:gameId/spin', spinRoulette);
router.get('/games/history', getGameHistory);
router.get('/bets/history', getUserBetHistory);
router.get('/stats', getUserStats);
router.get('/volatility', getVolatility);

module.exports = router;
