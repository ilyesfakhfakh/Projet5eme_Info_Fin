// Match-3 Game Service
// Financial themed Match-3 puzzle game logic

const SYMBOLS = ['💰', '💎', '📈', '📉', '🪙', '⭐'];
const BOARD_SIZE = 8;
const MIN_MATCH = 3;

// Power-ups
const POWER_UPS = {
  BOMB: 'BOMB',           // Destroys 3x3 area
  HORIZONTAL: 'HORIZONTAL', // Clears entire row
  VERTICAL: 'VERTICAL',     // Clears entire column
  COLOR: 'COLOR'           // Removes all of one color
};

/**
 * Generate a random board
 */
function generateBoard() {
  const board = [];
  for (let i = 0; i < BOARD_SIZE; i++) {
    board[i] = [];
    for (let j = 0; j < BOARD_SIZE; j++) {
      board[i][j] = {
        symbol: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        id: `${i}-${j}`
      };
    }
  }
  
  // Remove initial matches
  removeInitialMatches(board);
  
  return board;
}

/**
 * Remove any initial matches from the board
 */
function removeInitialMatches(board) {
  let hasMatches = true;
  let iterations = 0;
  const maxIterations = 100;
  
  while (hasMatches && iterations < maxIterations) {
    hasMatches = false;
    const matches = findMatches(board);
    
    if (matches.length > 0) {
      hasMatches = true;
      // Replace matched tiles
      matches.forEach(match => {
        board[match.row][match.col].symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      });
    }
    iterations++;
  }
}

/**
 * Find all matches on the board
 */
function findMatches(board) {
  const matches = [];
  const visited = new Set();
  
  // Check horizontal matches
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE - 2; j++) {
      const symbol = board[i][j].symbol;
      let count = 1;
      
      for (let k = j + 1; k < BOARD_SIZE && board[i][k].symbol === symbol; k++) {
        count++;
      }
      
      if (count >= MIN_MATCH) {
        for (let k = j; k < j + count; k++) {
          const key = `${i}-${k}`;
          if (!visited.has(key)) {
            matches.push({ row: i, col: k, symbol });
            visited.add(key);
          }
        }
      }
    }
  }
  
  // Check vertical matches
  for (let j = 0; j < BOARD_SIZE; j++) {
    for (let i = 0; i < BOARD_SIZE - 2; i++) {
      const symbol = board[i][j].symbol;
      let count = 1;
      
      for (let k = i + 1; k < BOARD_SIZE && board[k][j].symbol === symbol; k++) {
        count++;
      }
      
      if (count >= MIN_MATCH) {
        for (let k = i; k < i + count; k++) {
          const key = `${k}-${j}`;
          if (!visited.has(key)) {
            matches.push({ row: k, col: j, symbol });
            visited.add(key);
          }
        }
      }
    }
  }
  
  return matches;
}

/**
 * Swap two tiles
 */
function swapTiles(board, pos1, pos2) {
  const temp = board[pos1.row][pos1.col];
  board[pos1.row][pos1.col] = board[pos2.row][pos2.col];
  board[pos2.row][pos2.col] = temp;
}

/**
 * Check if swap is valid (adjacent tiles)
 */
function isValidSwap(pos1, pos2) {
  const rowDiff = Math.abs(pos1.row - pos2.row);
  const colDiff = Math.abs(pos1.col - pos2.col);
  
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

/**
 * Apply gravity to fill empty spaces
 */
function applyGravity(board) {
  for (let j = 0; j < BOARD_SIZE; j++) {
    let emptyRow = BOARD_SIZE - 1;
    
    for (let i = BOARD_SIZE - 1; i >= 0; i--) {
      if (board[i][j].symbol !== null) {
        if (i !== emptyRow) {
          board[emptyRow][j] = board[i][j];
          board[i][j] = { symbol: null, id: `${i}-${j}` };
        }
        emptyRow--;
      }
    }
    
    // Fill from top with new symbols
    for (let i = 0; i <= emptyRow; i++) {
      board[i][j] = {
        symbol: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        id: `${i}-${j}`
      };
    }
  }
}

/**
 * Calculate score based on matches
 */
function calculateScore(matches) {
  let score = 0;
  
  matches.forEach(match => {
    score += 10; // Base score per tile
  });
  
  // Bonus for larger combos
  if (matches.length > 3) {
    score += (matches.length - 3) * 20;
  }
  
  return score;
}

/**
 * Check if power-up should be created
 */
function checkPowerUpCreation(matches) {
  if (matches.length >= 5) {
    return POWER_UPS.COLOR;
  } else if (matches.length === 4) {
    return Math.random() > 0.5 ? POWER_UPS.HORIZONTAL : POWER_UPS.VERTICAL;
  }
  return null;
}

/**
 * Create a new game
 */
async function createGame(models, userId, level = 1) {
  const board = generateBoard();
  const targetScore = 1000 + (level - 1) * 500;
  const movesLeft = 30 - Math.floor((level - 1) / 2);
  
  const game = await models.match3_games.create({
    user_id: userId,
    level: level,
    score: 0,
    moves_left: movesLeft,
    target_score: targetScore,
    board_state: JSON.stringify(board),
    power_ups: JSON.stringify([]),
    status: 'IN_PROGRESS'
  });
  
  return game;
}

/**
 * Make a move (swap tiles)
 */
async function makeMove(models, gameId, pos1, pos2) {
  try {
    console.log('[Match-3] makeMove called:', { gameId, pos1, pos2 });
    
    const game = await models.match3_games.findByPk(gameId);
    
    if (!game) {
      throw new Error('Game not found');
    }
    
    if (game.status !== 'IN_PROGRESS') {
      throw new Error('Game is not in progress');
    }
    
    if (game.moves_left <= 0) {
      throw new Error('No moves left');
    }
    
    // Validate positions
    if (!pos1 || typeof pos1.row !== 'number' || typeof pos1.col !== 'number') {
      throw new Error('Invalid pos1 format');
    }
    if (!pos2 || typeof pos2.row !== 'number' || typeof pos2.col !== 'number') {
      throw new Error('Invalid pos2 format');
    }
    
    // Check boundaries
    if (pos1.row < 0 || pos1.row >= BOARD_SIZE || pos1.col < 0 || pos1.col >= BOARD_SIZE) {
      throw new Error('pos1 is out of bounds');
    }
    if (pos2.row < 0 || pos2.row >= BOARD_SIZE || pos2.col < 0 || pos2.col >= BOARD_SIZE) {
      throw new Error('pos2 is out of bounds');
    }
    
    if (!isValidSwap(pos1, pos2)) {
      throw new Error('Invalid swap - tiles must be adjacent');
    }
    
    const board = JSON.parse(game.board_state);
    console.log('[Match-3] Board loaded, size:', board.length);
    
    // Try the swap
    swapTiles(board, pos1, pos2);
    
    // Check for matches
    let matches = findMatches(board);
    console.log('[Match-3] Matches found:', matches.length);
    
    if (matches.length === 0) {
      // No matches, swap back
      swapTiles(board, pos1, pos2);
      throw new Error('No matches found - invalid move');
    }
    
    // Valid move, process matches
    let totalScore = 0;
    let allMatches = [];
    
    // Keep processing matches until no more
    while (matches.length > 0) {
      allMatches = [...allMatches, ...matches];
      const scoreGained = calculateScore(matches);
      totalScore += scoreGained;
      
      // Remove matched tiles
      matches.forEach(match => {
        if (board[match.row] && board[match.row][match.col]) {
          board[match.row][match.col].symbol = null;
        }
      });
      
      // Apply gravity
      applyGravity(board);
      
      // Check for new matches
      matches = findMatches(board);
    }
    
    console.log('[Match-3] Total score gained:', totalScore);
    
    // Update game state
    const newScore = game.score + totalScore;
    const newMovesLeft = game.moves_left - 1;
    
    let status = game.status;
    let coinsEarned = game.coins_earned;
    
    // Check win condition
    if (newScore >= game.target_score) {
      status = 'WON';
      coinsEarned = Math.floor(newScore / 10) + (newMovesLeft * 5);
    } else if (newMovesLeft <= 0) {
      status = 'LOST';
    }
    
    await game.update({
      score: newScore,
      moves_left: newMovesLeft,
      board_state: JSON.stringify(board),
      status: status,
      coins_earned: coinsEarned,
      completed_at: status !== 'IN_PROGRESS' ? new Date() : null
    });
    
    // Update high score if won
    if (status === 'WON') {
      await updateHighScore(models, game.user_id, game.level, newScore, 30 - newMovesLeft, coinsEarned);
    }
    
    console.log('[Match-3] Move completed successfully');
    
    return {
      game,
      matches: allMatches,
      scoreGained: totalScore,
      board: board
    };
  } catch (err) {
    console.error('[Match-3] makeMove error:', err.message, err.stack);
    throw err;
  }
}

/**
 * Update high score
 */
async function updateHighScore(models, userId, level, score, movesUsed, coinsEarned) {
  const existing = await models.match3_highscores.findOne({
    where: { user_id: userId, level: level }
  });
  
  if (!existing || score > existing.score) {
    await models.match3_highscores.upsert({
      user_id: userId,
      level: level,
      score: score,
      moves_used: movesUsed,
      coins_earned: coinsEarned
    });
  }
}

/**
 * Get game by ID
 */
async function getGame(models, gameId) {
  const game = await models.match3_games.findByPk(gameId);
  
  if (!game) {
    throw new Error('Game not found');
  }
  
  return {
    ...game.toJSON(),
    board_state: JSON.parse(game.board_state),
    power_ups: JSON.parse(game.power_ups || '[]')
  };
}

/**
 * Get user statistics
 */
async function getUserStats(models, userId) {
  const totalGames = await models.match3_games.count({
    where: { user_id: userId }
  });
  
  const wonGames = await models.match3_games.count({
    where: { user_id: userId, status: 'WON' }
  });
  
  const totalCoins = await models.match3_games.sum('coins_earned', {
    where: { user_id: userId }
  }) || 0;
  
  const highScores = await models.match3_highscores.findAll({
    where: { user_id: userId },
    order: [['level', 'ASC']]
  });
  
  const highestLevel = highScores.length > 0 
    ? Math.max(...highScores.map(hs => hs.level))
    : 0;
  
  return {
    total_games: totalGames,
    won_games: wonGames,
    win_rate: totalGames > 0 ? ((wonGames / totalGames) * 100).toFixed(2) : 0,
    total_coins: totalCoins,
    highest_level: highestLevel,
    high_scores: highScores
  };
}

/**
 * Get leaderboard for a level
 */
async function getLeaderboard(models, level, limit = 10) {
  const scores = await models.match3_highscores.findAll({
    where: { level: level },
    order: [['score', 'DESC']],
    limit: limit
  });
  
  return scores;
}

module.exports = {
  createGame,
  makeMove,
  getGame,
  getUserStats,
  getLeaderboard,
  SYMBOLS,
  BOARD_SIZE
};
