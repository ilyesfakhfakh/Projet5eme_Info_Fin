import { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  TextField,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Tabs,
  Tab
} from '@mui/material';
import {
  Casino as CasinoIcon,
  TrendingUp,
  TrendingDown,
  Remove,
  AttachMoney,
  History,
  EmojiEvents,
  Refresh,
  Info,
  MonetizationOn,
  Whatshot,
  LocalFireDepartment,
  Stars,
  Bolt,
  AutoAwesome
} from '@mui/icons-material';
import { keyframes } from '@mui/system';
import MainCard from 'ui-component/cards/MainCard';
import http from 'api/http';
import {
  spin,
  pulse,
  glow,
  float,
  shimmer,
  bounce,
  fadeInUp,
  wheelContainerStyle,
  betButtonStyle,
  cardGradientStyle,
  statCardStyle,
  spinButtonStyle,
  jackpotStyle,
  resultChipStyle
} from './GamingStyles';
import Match3Game from '../games/Match3Game';

const Gaming = () => {
  // Tab state
  const [currentTab, setCurrentTab] = useState(0);
  
  // Game state
  const [gameId, setGameId] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [jackpot, setJackpot] = useState(null);
  const [config, setConfig] = useState(null);
  const [volatility, setVolatility] = useState(null);
  
  // Betting state
  const [bets, setBets] = useState([]);
  const [betAmount, setBetAmount] = useState(10);
  const [selectedBet, setSelectedBet] = useState(null);
  const [selectedValue, setSelectedValue] = useState(null);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [gameHistory, setGameHistory] = useState([]);
  const [userStats, setUserStats] = useState(null);
  
  // Animation state
  const [wheelRotation, setWheelRotation] = useState(0);
  const [celebrating, setCelebrating] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadConfig(),
        loadWallet(),
        loadJackpot(),
        loadVolatility(),
        createNewGame()
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadConfig = async () => {
    const response = await http.get('/roulette/config');
    setConfig(response);
  };

  const loadWallet = async () => {
    const response = await http.get('/roulette/wallet');
    setWallet(response.wallet);
  };

  const loadJackpot = async () => {
    const response = await http.get('/roulette/jackpot');
    setJackpot(response.jackpot);
  };

  const loadVolatility = async () => {
    const response = await http.get('/roulette/volatility');
    setVolatility(response);
  };

  const createNewGame = async () => {
    const response = await http.post('/roulette/game/create');
    setGameId(response.game.game_id);
    return response.game;
  };

  const placeBet = async (betType, betValue = null) => {
    try {
      setError(null);
      
      if (betAmount < 1 || betAmount > 10000) {
        throw new Error('Bet must be between $1 and $10,000');
      }
      
      if (wallet.balance < betAmount) {
        throw new Error('Insufficient balance');
      }

      const response = await http.post('/roulette/game/bet', {
        gameId: gameId,
        betType: betType,
        betValue: betValue,
        amount: betAmount
      });

      setBets([...bets, response.bet]);
      await loadWallet();
      setSuccess(`Bet placed: ${betType} ${betValue || ''} - $${betAmount}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || err.response?.data?.error);
    }
  };

  const spin = async () => {
    try {
      if (bets.length === 0) {
        setError('Please place at least one bet');
        return;
      }

      setError(null);
      setSpinning(true);
      setResult(null);
      
      // Animate wheel
      const randomSpins = 5 + Math.random() * 3;
      const targetRotation = wheelRotation + (360 * randomSpins);
      setWheelRotation(targetRotation);

      // Wait for animation
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Get result from backend
      const response = await http.post(`/roulette/game/${gameId}/spin`);
      setResult(response.result);

      // Check if won
      const wonBets = bets.filter(bet => {
        if (bet.bet_type === response.result.outcome.type) {
          if (bet.bet_type === 'SECTOR' || bet.bet_type === 'STOCK') {
            return bet.bet_value === response.result.outcome.value;
          }
          return true;
        }
        return false;
      });

      if (wonBets.length > 0) {
        setCelebrating(true);
        setTimeout(() => setCelebrating(false), 3000);
      }

      // Refresh data
      await loadWallet();
      await loadJackpot();
      
      // Reset for next game
      setTimeout(async () => {
        setBets([]);
        await createNewGame();
        setSpinning(false);
      }, 5000);

    } catch (err) {
      setError(err.message || err.response?.data?.error);
      setSpinning(false);
    }
  };

  const clearBets = () => {
    setBets([]);
    setError(null);
    setSuccess(null);
  };

  const loadGameHistory = async () => {
    try {
      const response = await http.get('/roulette/games/history?limit=20');
      setGameHistory(response.games);
      setShowHistory(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadUserStats = async () => {
    try {
      const response = await http.get('/roulette/stats');
      setUserStats(response.stats);
      setShowStats(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const getBetColor = (type) => {
    const colors = {
      RED: '#e74c3c',
      BLACK: '#2c3e50',
      GREEN: '#27ae60',
      SECTOR: '#9b59b6',
      STOCK: '#f39c12'
    };
    return colors[type] || '#95a5a6';
  };

  const getResultGradient = (type) => {
    const gradients = {
      RED: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
      BLACK: 'linear-gradient(135deg, #34495e 0%, #2c3e50 100%)',
      GREEN: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
      SECTOR: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)',
      STOCK: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)'
    };
    return gradients[type] || 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)';
  };

  const quickBetAmounts = [10, 25, 50, 100, 250, 500];

  if (loading) {
    return (
      <MainCard title="Gaming - Financial Roulette">
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      </MainCard>
    );
  }

  return (
    <MainCard
      title={
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <CasinoIcon sx={{ color: 'white', fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h2">Gaming Arena</Typography>
            <Typography variant="caption" color="text.secondary">
              Choose Your Game! 🎮
            </Typography>
          </Box>
        </Stack>
      }
    >
      {/* Game Selector Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={currentTab} 
          onChange={(e, newValue) => setCurrentTab(newValue)}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              fontSize: '1.1rem',
              fontWeight: 'bold',
              padding: '16px',
              '&.Mui-selected': {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                borderRadius: '12px 12px 0 0'
              }
            }
          }}
        >
          <Tab label="🎰 Financial Roulette" />
          <Tab label="💎 Match-3 Puzzle" />
        </Tabs>
      </Box>

      {/* Roulette Game */}
      {currentTab === 0 && (
        <Grid container spacing={3}>
        {/* Alerts */}
        {error && (
          <Grid item xs={12}>
            <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
          </Grid>
        )}
        {success && (
          <Grid item xs={12}>
            <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>
          </Grid>
        )}

        {/* Top Info Bar */}
        <Grid item xs={12}>
          <Stack direction="row" spacing={2} justifyContent="space-between" flexWrap="wrap">
            <Card sx={{ ...statCardStyle('#4CAF50'), flex: 1, minWidth: 200 }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 16px rgba(76, 175, 80, 0.3)',
                      animation: `${float} 3s ease-in-out infinite`
                    }}
                  >
                    <AttachMoney sx={{ color: 'white', fontSize: 32 }} />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#4CAF50', fontWeight: 'bold' }}>
                      💰 BALANCE
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
                      ${wallet?.balance || 0}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ ...jackpotStyle, flex: 1, minWidth: 200 }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 16px rgba(255, 215, 0, 0.4)',
                      animation: `${pulse} 2s ease-in-out infinite`
                    }}
                  >
                    <EmojiEvents sx={{ color: 'white', fontSize: 32 }} />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#fff', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                      🏆 JACKPOT
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                      ${jackpot?.current_amount || 0}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ ...statCardStyle('#2196F3'), flex: 1, minWidth: 200 }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #2196F3 0%, #42A5F5 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 16px rgba(33, 150, 243, 0.3)',
                      animation: `${float} 3.5s ease-in-out infinite`
                    }}
                  >
                    <Whatshot sx={{ color: 'white', fontSize: 32 }} />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#2196F3', fontWeight: 'bold' }}>
                      🔥 VOLATILITY
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#1565C0' }}>
                      {volatility?.level || 'MODERATE'}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Roulette Wheel */}
        <Grid item xs={12} md={6}>
          <Card sx={{ ...cardGradientStyle }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center" justifyContent="center" mb={3}>
                <AutoAwesome sx={{ color: '#667eea', fontSize: 32 }} />
                <Typography variant="h3" sx={{ fontWeight: 'bold', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  The Wheel of Fortune
                </Typography>
                <AutoAwesome sx={{ color: '#764ba2', fontSize: 32 }} />
              </Stack>
              
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: 400,
                  height: 400,
                  margin: '0 auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {/* Wheel */}
                <Box sx={wheelContainerStyle}>
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      background: 'conic-gradient(from 0deg, #e74c3c 0deg 144deg, #2c3e50 144deg 288deg, #27ae60 288deg 360deg)',
                      transform: `rotate(${wheelRotation}deg)`,
                      transition: spinning ? 'transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
                      position: 'relative',
                      animation: spinning ? `${spin} 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)` : 'none'
                    }}
                  >
                    {/* Center */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 90,
                        height: 90,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 24px rgba(255, 215, 0, 0.6)',
                        border: '4px solid #fff',
                        animation: `${pulse} 2s ease-in-out infinite`
                      }}
                    >
                      <Stars sx={{ color: 'white', fontSize: 48 }} />
                    </Box>
                  </Box>
                </Box>

                {/* Pointer */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: -30,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: 0,
                    borderLeft: '24px solid transparent',
                    borderRight: '24px solid transparent',
                    borderTop: '48px solid #FF6B6B',
                    filter: 'drop-shadow(0 6px 12px rgba(255, 107, 107, 0.6))',
                    animation: `${bounce} 1s ease-in-out infinite`
                  }}
                />
              </Box>

              {/* Result Display */}
              {result && (
                <Box
                  mt={3}
                  p={3}
                  sx={{
                    background: getResultGradient(result.outcome.type),
                    borderRadius: '12px',
                    textAlign: 'center',
                    animation: celebrating ? 'pulse 1s infinite' : 'none'
                  }}
                >
                  <Typography variant="h3" color="white" gutterBottom>
                    {result.outcome.value}
                  </Typography>
                  <Typography variant="h5" color="white">
                    {result.outcome.multiplier}x Multiplier
                  </Typography>
                  {result.jackpot_won && (
                    <Typography variant="h4" color="white" mt={2}>
                      🎉 JACKPOT WON! ${result.jackpot_amount} 🎉
                    </Typography>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Betting Panel */}
        <Grid item xs={12} md={6}>
          <Card sx={{ ...cardGradientStyle }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center" mb={3}>
                <Bolt sx={{ color: '#FF6B6B', fontSize: 32 }} />
                <Typography variant="h3" sx={{ fontWeight: 'bold', background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Place Your Bets
                </Typography>
                <Bolt sx={{ color: '#FF8E53', fontSize: 32 }} />
              </Stack>

              {/* Bet Amount */}
              <Box mb={3} sx={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', borderRadius: '16px', p: 3 }}>
                <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                  <MonetizationOn sx={{ color: '#667eea' }} />
                  <Typography variant="h5" fontWeight="bold" color="#667eea">💵 Bet Amount</Typography>
                </Stack>
                <TextField
                  fullWidth
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(parseFloat(e.target.value))}
                  inputProps={{ min: 1, max: 10000, step: 1 }}
                  sx={{ 
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      background: '#fff',
                      fontWeight: 'bold',
                      fontSize: '1.2rem'
                    }
                  }}
                />
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {quickBetAmounts.map(amount => (
                    <Chip
                      key={amount}
                      label={`$${amount}`}
                      onClick={() => setBetAmount(amount)}
                      sx={{
                        background: betAmount === amount 
                          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                          : 'linear-gradient(135deg, #e0e7ff 0%, #cfd8dc 100%)',
                        color: betAmount === amount ? '#fff' : '#667eea',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        padding: '8px 12px',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'scale(1.1)',
                          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                        }
                      }}
                      clickable
                    />
                  ))}
                </Stack>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Main Bets */}
              <Stack spacing={2}>
                <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ color: '#667eea', textAlign: 'center' }}>
                  📊 Market Direction (2x)
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => placeBet('RED')}
                    disabled={spinning}
                    sx={betButtonStyle('#e74c3c', selectedBet === 'RED')}
                    startIcon={<TrendingUp />}
                  >
                    🐂 BULL
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => placeBet('BLACK')}
                    disabled={spinning}
                    sx={betButtonStyle('#2c3e50', selectedBet === 'BLACK')}
                    startIcon={<TrendingDown />}
                  >
                    🐻 BEAR
                  </Button>
                </Stack>

                <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ color: '#27ae60', textAlign: 'center', mt: 2 }}>
                  💎 Special Bet (50x)
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => placeBet('GREEN')}
                  disabled={spinning}
                  sx={{
                    ...betButtonStyle('#27ae60', selectedBet === 'GREEN'),
                    fontSize: '1.3rem',
                    padding: '24px'
                  }}
                  startIcon={<LocalFireDepartment />}
                >
                  ↔️ SIDEWAYS 🎰
                </Button>
              </Stack>

              {/* Current Bets */}
              {bets.length > 0 && (
                <Box mt={3}>
                  <Typography variant="body2" gutterBottom fontWeight={600}>
                    Your Bets ({bets.length})
                  </Typography>
                  <Stack spacing={1}>
                    {bets.map((bet, index) => (
                      <Chip
                        key={index}
                        label={`${bet.bet_type} ${bet.bet_value || ''} - $${bet.amount}`}
                        sx={{
                          background: getBetColor(bet.bet_type),
                          color: 'white',
                          fontWeight: 600
                        }}
                      />
                    ))}
                  </Stack>
                  <Typography variant="body2" mt={1}>
                    Total Wagered: ${bets.reduce((sum, bet) => sum + parseFloat(bet.amount), 0).toFixed(2)}
                  </Typography>
                </Box>
              )}

              {/* Actions */}
              <Stack spacing={2} mt={4}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={spin}
                  disabled={spinning || bets.length === 0}
                  sx={{
                    ...spinButtonStyle(spinning),
                    minHeight: '80px'
                  }}
                  startIcon={spinning ? <CircularProgress size={28} color="inherit" /> : <Stars sx={{ fontSize: 32 }} />}
                >
                  {spinning ? '🎰 SPINNING...' : '🚀 SPIN THE WHEEL!'}
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={clearBets}
                  disabled={spinning || bets.length === 0}
                  sx={{
                    borderRadius: '16px',
                    padding: '12px',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    borderWidth: '2px',
                    borderColor: '#FF6B6B',
                    color: '#FF6B6B',
                    '&:hover': {
                      borderWidth: '2px',
                      borderColor: '#FF5252',
                      background: '#FFF5F5',
                      transform: 'scale(1.02)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  🗑️ Clear Bets
                </Button>
              </Stack>

              {/* History & Stats Buttons */}
              <Stack direction="row" spacing={2} mt={3}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<History />}
                  onClick={loadGameHistory}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '16px',
                    padding: '12px 24px',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  📜 Game History
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<Info />}
                  onClick={loadUserStats}
                  sx={{
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    borderRadius: '16px',
                    padding: '12px 24px',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 15px rgba(240, 147, 251, 0.4)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(245, 87, 108, 0.6)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  📊 My Stats
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      )}

      {/* Match-3 Game */}
      {currentTab === 1 && (
        <Match3Game />
      )}

      {/* Animations */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
        `}
      </style>

      {/* History Dialog */}
      <Dialog open={showHistory} onClose={() => setShowHistory(false)} maxWidth="md" fullWidth>
        <DialogTitle>Game History</DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Game #</TableCell>
                  <TableCell>Result</TableCell>
                  <TableCell>Value</TableCell>
                  <TableCell align="right">Multiplier</TableCell>
                  <TableCell align="right">Total Bets</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {gameHistory.map((game) => (
                  <TableRow key={game.game_id}>
                    <TableCell>{game.game_number || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip
                        label={game.result_type}
                        size="small"
                        sx={{ background: getBetColor(game.result_type), color: 'white' }}
                      />
                    </TableCell>
                    <TableCell>{game.result_value}</TableCell>
                    <TableCell align="right">{game.multiplier}x</TableCell>
                    <TableCell align="right">${game.total_bets}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHistory(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Stats Dialog */}
      <Dialog open={showStats} onClose={() => setShowStats(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Your Statistics</DialogTitle>
        <DialogContent>
          {userStats && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Balance</Typography>
                <Typography variant="h4">${userStats.balance}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Total Wagered</Typography>
                <Typography variant="h4">${userStats.total_wagered}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Total Won</Typography>
                <Typography variant="h4">${userStats.total_won}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Win Rate</Typography>
                <Typography variant="h4">{userStats.win_rate}%</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Profit/Loss</Typography>
                <Typography variant="h4" color={userStats.profit >= 0 ? 'success.main' : 'error.main'}>
                  ${userStats.profit}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">ROI</Typography>
                <Typography variant="h4" color={userStats.roi >= 0 ? 'success.main' : 'error.main'}>
                  {userStats.roi}%
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowStats(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
};

export default Gaming;
