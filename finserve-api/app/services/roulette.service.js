const crypto = require('crypto');
const axios = require('axios');

// Market sectors configuration
const SECTORS = [
  'Technology', 'Healthcare', 'Finance', 'Energy', 
  'Consumer', 'Industrial', 'Real Estate', 'Utilities'
];

// Popular stocks for betting
const STOCKS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 
  'META', 'JPM', 'V', 'WMT', 'JNJ', 'PG'
];

// Payout multipliers
const PAYOUTS = {
  RED: 2.0,      // Bull market
  BLACK: 2.0,    // Bear market
  GREEN: 50.0,   // Sideways
  SECTOR: 5.0,   // Specific sector
  STOCK: 35.0    // Specific stock
};

/**
 * Generate provably fair random result
 */
function generateProvablyFairResult(gameId, serverSeed) {
  const combined = `${gameId}-${serverSeed}-${Date.now()}`;
  const hash = crypto.createHash('sha256').update(combined).digest('hex');
  const randomValue = parseInt(hash.substring(0, 8), 16);
  return randomValue;
}

/**
 * Determine game outcome based on random value and volatility
 */
function determineOutcome(randomValue, volatility = 20) {
  const normalized = randomValue % 1000;
  
  // Green (Sideways) - 2% chance (20/1000)
  if (normalized < 20) {
    return {
      type: 'GREEN',
      value: 'SIDEWAYS',
      multiplier: PAYOUTS.GREEN,
      color: 'green'
    };
  }
  
  // Sector - 16% chance (160/1000)
  if (normalized < 180) {
    const sectorIndex = Math.floor((normalized - 20) / 20);
    return {
      type: 'SECTOR',
      value: SECTORS[sectorIndex % SECTORS.length],
      multiplier: PAYOUTS.SECTOR,
      color: 'purple'
    };
  }
  
  // Stock - 12% chance (120/1000)
  if (normalized < 300) {
    const stockIndex = Math.floor((normalized - 180) / 10);
    return {
      type: 'STOCK',
      value: STOCKS[stockIndex % STOCKS.length],
      multiplier: PAYOUTS.STOCK,
      color: 'gold'
    };
  }
  
  // Red vs Black - 70% chance (700/1000)
  // Volatility affects distribution
  const threshold = 500 + (volatility * 2); // Higher volatility = more black (bear)
  
  if (normalized < threshold) {
    return {
      type: 'RED',
      value: 'BULL',
      multiplier: PAYOUTS.RED,
      color: 'red'
    };
  } else {
    return {
      type: 'BLACK',
      value: 'BEAR',
      multiplier: PAYOUTS.BLACK,
      color: 'black'
    };
  }
}

/**
 * Get current market volatility (VIX-like)
 */
async function getMarketVolatility() {
  try {
    // In production, fetch from real API (Alpha Vantage, Yahoo Finance, etc.)
    // For now, simulate volatility based on time and randomness
    const baseVolatility = 15;
    const timeVariance = Math.sin(Date.now() / 100000) * 5;
    const randomVariance = (Math.random() - 0.5) * 10;
    
    return Math.max(5, Math.min(40, baseVolatility + timeVariance + randomVariance));
  } catch (error) {
    console.error('Error fetching volatility:', error);
    return 20; // Default moderate volatility
  }
}

/**
 * Calculate jackpot contribution
 */
function calculateJackpotContribution(totalBets, contributionRate = 0.01) {
  return totalBets * contributionRate;
}

/**
 * Check if jackpot is won (rare event)
 */
function checkJackpotWin(outcome) {
  // Jackpot won if GREEN lands (2% chance already)
  return outcome.type === 'GREEN';
}

/**
 * Create new roulette game
 */
async function createGame(models) {
  const volatility = await getMarketVolatility();
  const serverSeed = crypto.randomBytes(32).toString('hex');
  
  const game = await models.roulette_games.create({
    server_seed: serverSeed,
    result_type: 'PENDING',
    result_value: 'PENDING',
    multiplier: 0,
    volatility_index: volatility,
    status: 'PENDING'
  });
  
  return game;
}

/**
 * Place a bet
 */
async function placeBet(models, userId, gameId, betType, betValue, amount) {
  // Validate bet amount
  if (amount < 1 || amount > 10000) {
    throw new Error('Bet amount must be between $1 and $10,000');
  }
  
  // Get user wallet
  const wallet = await models.wallets.findOne({ where: { user_id: userId } });
  if (!wallet) {
    throw new Error('Wallet not found');
  }
  
  if (wallet.balance < amount) {
    throw new Error('Insufficient balance');
  }
  
  // Validate bet type and value
  const validBetTypes = ['RED', 'BLACK', 'GREEN', 'SECTOR', 'STOCK'];
  if (!validBetTypes.includes(betType)) {
    throw new Error('Invalid bet type');
  }
  
  if (betType === 'SECTOR' && !SECTORS.includes(betValue)) {
    throw new Error('Invalid sector');
  }
  
  if (betType === 'STOCK' && !STOCKS.includes(betValue)) {
    throw new Error('Invalid stock symbol');
  }
  
  // Calculate potential payout
  const multiplier = PAYOUTS[betType];
  const potentialPayout = amount * multiplier;
  
  // Deduct from wallet
  await wallet.update({
    balance: wallet.balance - amount,
    locked_balance: wallet.locked_balance + amount,
    total_wagered: wallet.total_wagered + amount
  });
  
  // Create bet
  const bet = await models.roulette_bets.create({
    game_id: gameId,
    user_id: userId,
    bet_type: betType,
    bet_value: betValue || betType,
    amount: amount,
    potential_payout: potentialPayout,
    result: 'PENDING'
  });
  
  // Update game total bets
  const game = await models.roulette_games.findByPk(gameId);
  await game.update({
    total_bets: parseFloat(game.total_bets) + parseFloat(amount)
  });
  
  return bet;
}

/**
 * Spin the roulette
 */
async function spinRoulette(models, gameId) {
  const game = await models.roulette_games.findByPk(gameId);
  
  const bets = await models.roulette_bets.findAll({ where: { game_id: gameId } });
  
  if (!game) {
    throw new Error('Game not found');
  }
  
  if (game.status !== 'PENDING') {
    throw new Error('Game already spun');
  }
  
  // Update status to spinning
  await game.update({ status: 'SPINNING' });
  
  // Generate result
  const serverSeed = crypto.randomBytes(32).toString('hex');
  const randomValue = generateProvablyFairResult(gameId, serverSeed);
  const outcome = determineOutcome(randomValue, game.volatility_index);
  
  // Update game with result
  await game.update({
    result_type: outcome.type,
    result_value: outcome.value,
    multiplier: outcome.multiplier,
    status: 'COMPLETED',
    spun_at: new Date()
  });
  
  // Process all bets
  let totalPayouts = 0;
  const jackpot = await models.jackpots.findOne();
  let jackpotWinner = null;
  
  for (const bet of bets) {
    let isWin = false;
    let payout = 0;
    
    // Check if bet wins
    if (bet.bet_type === outcome.type) {
      if (bet.bet_type === 'SECTOR' || bet.bet_type === 'STOCK') {
        isWin = bet.bet_value === outcome.value;
      } else {
        isWin = true;
      }
    }
    
    if (isWin) {
      payout = bet.potential_payout;
      totalPayouts += payout;
      
      // Check jackpot win
      if (checkJackpotWin(outcome) && jackpot) {
        jackpotWinner = bet.user_id;
        payout += parseFloat(jackpot.current_amount);
      }
    }
    
    // Update bet
    await bet.update({
      result: isWin ? 'WIN' : 'LOSS',
      actual_payout: payout
    });
    
    // Update wallet
    const wallet = await models.wallets.findOne({ where: { user_id: bet.user_id } });
    if (wallet) {
      await wallet.update({
        balance: parseFloat(wallet.balance) + payout,
        locked_balance: parseFloat(wallet.locked_balance) - parseFloat(bet.amount),
        total_won: parseFloat(wallet.total_won) + payout
      });
    }
  }
  
  // Update game total payouts
  await game.update({ total_payouts: totalPayouts });
  
  // Update jackpot
  if (jackpot) {
    const contribution = calculateJackpotContribution(game.total_bets);
    
    if (jackpotWinner) {
      // Jackpot won, reset
      await jackpot.update({
        current_amount: 1000.00, // Reset to base
        last_winner: jackpotWinner,
        last_win_amount: jackpot.current_amount,
        last_win_date: new Date(),
        total_paid: parseFloat(jackpot.total_paid) + parseFloat(jackpot.current_amount)
      });
    } else {
      // Add contribution
      await jackpot.update({
        current_amount: parseFloat(jackpot.current_amount) + contribution
      });
    }
  }
  
  return {
    game,
    outcome,
    totalPayouts,
    jackpotWinner,
    jackpotAmount: jackpotWinner ? jackpot.current_amount : null
  };
}

/**
 * Get game history
 */
async function getGameHistory(models, limit = 50) {
  const games = await models.roulette_games.findAll({
    where: { status: 'COMPLETED' },
    order: [['spun_at', 'DESC']],
    limit: limit
  });
  
  return games;
}

/**
 * Get user bet history
 */
async function getUserBetHistory(models, userId, limit = 50) {
  const bets = await models.roulette_bets.findAll({
    where: { user_id: userId },
    order: [['created_at', 'DESC']],
    limit: limit
  });
  
  return bets;
}

/**
 * Get user statistics
 */
async function getUserStats(models, userId) {
  const wallet = await models.wallets.findOne({ where: { user_id: userId } });
  
  if (!wallet) {
    return null;
  }
  
  const totalBets = await models.roulette_bets.count({ where: { user_id: userId } });
  const winBets = await models.roulette_bets.count({ 
    where: { user_id: userId, result: 'WIN' } 
  });
  
  const winRate = totalBets > 0 ? (winBets / totalBets * 100).toFixed(2) : 0;
  const profit = parseFloat(wallet.total_won) - parseFloat(wallet.total_wagered);
  const roi = wallet.total_wagered > 0 
    ? ((profit / wallet.total_wagered) * 100).toFixed(2) 
    : 0;
  
  return {
    balance: wallet.balance,
    total_wagered: wallet.total_wagered,
    total_won: wallet.total_won,
    total_bets: totalBets,
    win_bets: winBets,
    win_rate: winRate,
    profit: profit,
    roi: roi
  };
}

/**
 * Get or create wallet
 */
async function getOrCreateWallet(models, userId) {
  let wallet = await models.wallets.findOne({ where: { user_id: userId } });
  
  if (!wallet) {
    wallet = await models.wallets.create({
      user_id: userId,
      balance: 1000.00, // Starting bonus
      currency: 'USD'
    });
  }
  
  return wallet;
}

/**
 * Get jackpot info
 */
async function getJackpotInfo(models) {
  let jackpot = await models.jackpots.findOne();
  
  if (!jackpot) {
    jackpot = await models.jackpots.create({
      current_amount: 1000.00
    });
  }
  
  return jackpot;
}

module.exports = {
  SECTORS,
  STOCKS,
  PAYOUTS,
  createGame,
  placeBet,
  spinRoulette,
  getGameHistory,
  getUserBetHistory,
  getUserStats,
  getOrCreateWallet,
  getJackpotInfo,
  getMarketVolatility
};
