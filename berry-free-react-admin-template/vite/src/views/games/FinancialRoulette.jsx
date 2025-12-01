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
  Tooltip
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
  MonetizationOn
} from '@mui/icons-material';
import MainCard from 'ui-component/cards/MainCard';
import http from 'api/http';

const FinancialRoulette = () => {
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
      <MainCard title="Financial Roulette">
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
            <Typography variant="h2">Financial Roulette</Typography>
            <Typography variant="caption" color="text.secondary">
              Trade the Market Volatility 🎰
            </Typography>
          </Box>
        </Stack>
      }
    >
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
            <Card sx={{ flex: 1, minWidth: 200 }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <AttachMoney color="success" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Balance</Typography>
                    <Typography variant="h4">${wallet?.balance || 0}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ flex: 1, minWidth: 200 }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <EmojiEvents sx={{ color: '#f39c12' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Jackpot</Typography>
                    <Typography variant="h4" sx={{ color: '#f39c12' }}>
                      ${jackpot?.current_amount || 0}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ flex: 1, minWidth: 200 }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <TrendingUp color={volatility?.level === 'HIGH' ? 'error' : 'primary'} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Volatility</Typography>
                    <Typography variant="h4">
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
          <Card>
            <CardContent>
              <Typography variant="h3" gutterBottom align="center">
                Roulette Wheel
              </Typography>
              
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
                <Box
                  sx={{
                    width: 300,
                    height: 300,
                    borderRadius: '50%',
                    background: 'conic-gradient(from 0deg, #e74c3c 0deg 144deg, #2c3e50 144deg 288deg, #27ae60 288deg 360deg)',
                    border: '8px solid #34495e',
                    transform: `rotate(${wheelRotation}deg)`,
                    transition: spinning ? 'transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    position: 'relative'
                  }}
                >
                  {/* Center */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.4)'
                    }}
                  >
                    <CasinoIcon sx={{ color: 'white', fontSize: 40 }} />
                  </Box>
                </Box>

                {/* Pointer */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: -20,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: 0,
                    borderLeft: '20px solid transparent',
                    borderRight: '20px solid transparent',
                    borderTop: '40px solid #e74c3c',
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
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
          <Card>
            <CardContent>
              <Typography variant="h3" gutterBottom>Place Your Bets</Typography>

              {/* Bet Amount */}
              <Box mb={3}>
                <Typography variant="body2" gutterBottom>Bet Amount</Typography>
                <TextField
                  fullWidth
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(parseFloat(e.target.value))}
                  inputProps={{ min: 1, max: 10000, step: 1 }}
                  sx={{ mb: 1 }}
                />
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {quickBetAmounts.map(amount => (
                    <Chip
                      key={amount}
                      label={`$${amount}`}
                      onClick={() => setBetAmount(amount)}
                      color={betAmount === amount ? 'primary' : 'default'}
                      clickable
                    />
                  ))}
                </Stack>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Main Bets */}
              <Typography variant="body2" gutterBottom fontWeight={600}>
                Market Direction (2x)
              </Typography>
              <Stack direction="row" spacing={2} mb={2}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => placeBet('RED')}
                  disabled={spinning}
                  sx={{
                    background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                    '&:hover': { background: 'linear-gradient(135deg, #c0392b 0%, #a93226 100%)' }
                  }}
                  startIcon={<TrendingUp />}
                >
                  BULL
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => placeBet('BLACK')}
                  disabled={spinning}
                  sx={{
                    background: 'linear-gradient(135deg, #34495e 0%, #2c3e50 100%)',
                    '&:hover': { background: 'linear-gradient(135deg, #2c3e50 0%, #1c2833 100%)' }
                  }}
                  startIcon={<TrendingDown />}
                >
                  BEAR
                </Button>
              </Stack>

              <Button
                fullWidth
                variant="contained"
                onClick={() => placeBet('GREEN')}
                disabled={spinning}
                sx={{
                  mb: 2,
                  background: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
                  '&:hover': { background: 'linear-gradient(135deg, #229954 0%, #1e8449 100%)' }
                }}
                startIcon={<Remove />}
              >
                SIDEWAYS (50x) 🎰
              </Button>

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
              <Stack direction="row" spacing={2} mt={3}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={spin}
                  disabled={spinning || bets.length === 0}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    py: 2,
                    fontSize: '1.1rem',
                    fontWeight: 700
                  }}
                  startIcon={spinning ? <CircularProgress size={20} color="inherit" /> : <CasinoIcon />}
                >
                  {spinning ? 'SPINNING...' : 'SPIN!'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={clearBets}
                  disabled={spinning || bets.length === 0}
                >
                  Clear
                </Button>
              </Stack>

              {/* History & Stats Buttons */}
              <Stack direction="row" spacing={2} mt={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<History />}
                  onClick={loadGameHistory}
                >
                  History
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<MonetizationOn />}
                  onClick={loadUserStats}
                >
                  Stats
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
                  <TableRow key={game.game_number}>
                    <TableCell>{game.game_number}</TableCell>
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

export default FinancialRoulette;
