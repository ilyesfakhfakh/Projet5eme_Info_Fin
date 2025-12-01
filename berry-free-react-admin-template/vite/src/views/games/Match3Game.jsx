import { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Stack,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material';
import {
  EmojiEvents,
  Star,
  Refresh,
  Info as InfoIcon,
  MonetizationOn
} from '@mui/icons-material';
import { keyframes } from '@mui/system';
import http from 'api/http';

// Animations
const popIn = keyframes`
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
`;

const match = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.5; }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
`;

const Match3Game = () => {
  const [game, setGame] = useState(null);
  const [selectedTile, setSelectedTile] = useState(null);
  const [board, setBoard] = useState([]);
  const [level, setLevel] = useState(1);
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [showWin, setShowWin] = useState(false);
  const [showLose, setShowLose] = useState(false);
  const [stats, setStats] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [error, setError] = useState(null);
  const [matchedTiles, setMatchedTiles] = useState([]);

  useEffect(() => {
    startNewGame(1);
    loadStats();
  }, []);

  const startNewGame = async (gameLevel) => {
    try {
      setLoading(true);
      setError(null);
      const userId = 'demo-user';
      
      const response = await http.post(`/match3/game/create?userId=${userId}`, {
        level: gameLevel
      });
      
      setGame(response.game);
      setBoard(response.game.board_state);
      setLevel(gameLevel);
      setSelectedTile(null);
      setShowWin(false);
      setShowLose(false);
    } catch (err) {
      console.error('Failed to create game:', err);
      setError('Failed to create game. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const userId = 'demo-user';
      const response = await http.get(`/match3/stats?userId=${userId}`);
      setStats(response.stats);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleTileClick = async (row, col) => {
    if (animating || !game || game.status !== 'IN_PROGRESS') return;

    if (!selectedTile) {
      // First tile selected
      setSelectedTile({ row, col });
    } else {
      // Second tile selected - try to swap
      if (selectedTile.row === row && selectedTile.col === col) {
        // Clicked same tile, deselect
        setSelectedTile(null);
        return;
      }

      // Check if adjacent
      const rowDiff = Math.abs(selectedTile.row - row);
      const colDiff = Math.abs(selectedTile.col - col);
      
      if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
        // Valid swap
        await makeMove(selectedTile, { row, col });
      }
      
      setSelectedTile(null);
    }
  };

  const makeMove = async (pos1, pos2) => {
    try {
      setAnimating(true);
      setError(null);
      
      const response = await http.post(`/match3/game/${game.game_id}/move`, {
        pos1,
        pos2
      });

      // Show matched tiles animation
      if (response.matches && response.matches.length > 0) {
        setMatchedTiles(response.matches);
        
        // Wait for animation
        await new Promise(resolve => setTimeout(resolve, 600));
        setMatchedTiles([]);
      }

      // Update game state
      setGame(response.game);
      setBoard(response.game.board_state);

      // Check win/lose
      if (response.game.status === 'WON') {
        setShowWin(true);
        await loadStats();
      } else if (response.game.status === 'LOST') {
        setShowLose(true);
      }

    } catch (err) {
      console.error('Move failed:', err);
      const errorMessage = err.message || err.response?.data?.error || 'Invalid move';
      setError(errorMessage);
      console.log('Error details:', {
        message: err.message,
        data: err.data,
        status: err.status
      });
    } finally {
      setAnimating(false);
    }
  };

  const getTileStyle = (row, col) => {
    const isSelected = selectedTile && selectedTile.row === row && selectedTile.col === col;
    const isMatched = matchedTiles.some(m => m.row === row && m.col === col);

    return {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '2rem',
      cursor: animating ? 'not-allowed' : 'pointer',
      background: isSelected 
        ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
        : isMatched
        ? 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)'
        : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      borderRadius: '12px',
      border: isSelected ? '3px solid #FF6B6B' : '2px solid #ddd',
      boxShadow: isSelected 
        ? '0 8px 24px rgba(255, 215, 0, 0.6)'
        : isMatched
        ? '0 8px 24px rgba(255, 107, 107, 0.6)'
        : '0 4px 8px rgba(0,0,0,0.1)',
      transition: 'all 0.3s ease',
      transform: isSelected ? 'scale(1.1)' : isMatched ? 'scale(1.2)' : 'scale(1)',
      animation: isMatched ? `${match} 0.6s ease-out` : 'none',
      '&:hover': {
        transform: animating ? 'scale(1)' : 'scale(1.05)',
        boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
      }
    };
  };

  const getScorePercentage = () => {
    if (!game) return 0;
    return Math.min((game.score / game.target_score) * 100, 100);
  };

  return (
    <Grid container spacing={3}>
      {/* Error Alert */}
      {error && (
        <Grid item xs={12}>
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Grid>
      )}

      {/* Game Info Bar */}
      <Grid item xs={12}>
        <Stack direction="row" spacing={2} justifyContent="space-between" flexWrap="wrap">
          <Card sx={{ flex: 1, minWidth: 150 }}>
            <CardContent sx={{ p: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Star sx={{ color: '#FFD700' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">Level</Typography>
                  <Typography variant="h5" fontWeight="bold">{level}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1, minWidth: 150 }}>
            <CardContent sx={{ p: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <EmojiEvents sx={{ color: '#4CAF50' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">Score</Typography>
                  <Typography variant="h5" fontWeight="bold">{game?.score || 0}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1, minWidth: 150 }}>
            <CardContent sx={{ p: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <MonetizationOn sx={{ color: '#2196F3' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">Moves Left</Typography>
                  <Typography variant="h5" fontWeight="bold" color={game?.moves_left <= 5 ? 'error' : 'text.primary'}>
                    {game?.moves_left || 0}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Grid>

      {/* Progress Bar */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Target Score: {game?.target_score || 0}</Typography>
                <Typography variant="body2" fontWeight="bold">{getScorePercentage().toFixed(0)}%</Typography>
              </Stack>
              <LinearProgress 
                variant="determinate" 
                value={getScorePercentage()} 
                sx={{ 
                  height: 12, 
                  borderRadius: 6,
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(90deg, #4CAF50 0%, #8BC34A 100%)'
                  }
                }}
              />
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Game Board */}
      <Grid item xs={12}>
        <Card sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          p: 2
        }}>
          <CardContent>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(8, 1fr)',
                gap: 1,
                maxWidth: 600,
                margin: '0 auto',
                aspectRatio: '1/1'
              }}
            >
              {board.map((row, rowIndex) => 
                row.map((tile, colIndex) => (
                  <Box
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => handleTileClick(rowIndex, colIndex)}
                    sx={getTileStyle(rowIndex, colIndex)}
                  >
                    {tile.symbol}
                  </Box>
                ))
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Action Buttons */}
      <Grid item xs={12}>
        <Stack direction="row" spacing={2}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<Refresh />}
            onClick={() => startNewGame(level)}
            disabled={loading}
            sx={{
              background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              padding: '16px',
              borderRadius: '16px',
              '&:hover': {
                background: 'linear-gradient(135deg, #FF8E53 0%, #FF6B6B 100%)',
              }
            }}
          >
            New Game
          </Button>
          <Button
            fullWidth
            variant="contained"
            startIcon={<InfoIcon />}
            onClick={() => setShowStats(true)}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              padding: '16px',
              borderRadius: '16px',
              '&:hover': {
                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
              }
            }}
          >
            Stats
          </Button>
        </Stack>
      </Grid>

      {/* Win Dialog */}
      <Dialog open={showWin} onClose={() => setShowWin(false)}>
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)',
          color: '#fff',
          textAlign: 'center'
        }}>
          <EmojiEvents sx={{ fontSize: 64, animation: `${float} 2s ease-in-out infinite` }} />
          <Typography variant="h4" fontWeight="bold">🎉 LEVEL COMPLETE! 🎉</Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pt: 3 }}>
          <Typography variant="h5" gutterBottom>Score: {game?.score}</Typography>
          <Typography variant="h6" color="primary">Coins Earned: {game?.coins_earned} 💰</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => startNewGame(level + 1)} variant="contained" color="success">
            Next Level
          </Button>
          <Button onClick={() => setShowWin(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Lose Dialog */}
      <Dialog open={showLose} onClose={() => setShowLose(false)}>
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
          color: '#fff',
          textAlign: 'center'
        }}>
          <Typography variant="h4" fontWeight="bold">😢 Game Over</Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pt: 3 }}>
          <Typography variant="h6" gutterBottom>Score: {game?.score}</Typography>
          <Typography variant="body1">Target: {game?.target_score}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => startNewGame(level)} variant="contained" color="primary">
            Try Again
          </Button>
          <Button onClick={() => setShowLose(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Stats Dialog */}
      <Dialog open={showStats} onClose={() => setShowStats(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Your Statistics</DialogTitle>
        <DialogContent>
          {stats && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Total Games</Typography>
                <Typography variant="h5" fontWeight="bold">{stats.total_games}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Won Games</Typography>
                <Typography variant="h5" fontWeight="bold" color="success.main">{stats.won_games}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Win Rate</Typography>
                <Typography variant="h5" fontWeight="bold">{stats.win_rate}%</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Total Coins</Typography>
                <Typography variant="h5" fontWeight="bold" color="primary">{stats.total_coins} 💰</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Highest Level</Typography>
                <Typography variant="h4" fontWeight="bold">Level {stats.highest_level}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowStats(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default Match3Game;
