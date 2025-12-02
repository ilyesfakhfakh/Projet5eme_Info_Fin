import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  Grid,
  TextField,
  Paper,
  CircularProgress
} from '@mui/material';
import { Science, ArrowBack } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';

const Backtest = () => {
  const { botId } = useParams();
  const navigate = useNavigate();
  const [bot, setBot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [config, setConfig] = useState({
    startDate: '2024-01-01',
    endDate: '2024-06-01',
    initialCapital: 10000,
    asset: 'BTC'
  });

  useEffect(() => {
    loadBot();
  }, [botId]);

  const loadBot = async () => {
    try {
      const response = await fetch(`http://localhost:3200/api/v1/bots/${botId}?userId=demo-user`);
      const data = await response.json();
      
      if (data.success) {
        setBot(data.bot);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to load bot');
    } finally {
      setLoading(false);
    }
  };

  const isBotConfigured = () => {
    if (!bot || !bot.config || !bot.config.nodes || !bot.config.edges) {
      return false;
    }
    const hasTrigger = bot.config.nodes.some(n => n.type === 'trigger');
    const hasAction = bot.config.nodes.some(n => n.type === 'action');
    return hasTrigger && hasAction && bot.config.nodes.length > 0;
  };

  const runBacktest = async () => {
    try {
      setRunning(true);
      setError('');
      setResult(null);

      const response = await fetch(`http://localhost:3200/api/v1/bots/${botId}/backtest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: 'demo-user',
          ...config
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(data.backtest);
      } else {
        if (data.error.includes('Invalid bot configuration')) {
          setError('❌ Bot configuration is incomplete! Please edit the bot and add at least one trigger and one action before running a backtest.');
        } else {
          setError(data.error);
        }
      }
    } catch (err) {
      setError('Failed to run backtest');
      console.error(err);
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <div>
          <Typography variant="h4" gutterBottom>
            🧪 Backtest Bot
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {bot?.name}
          </Typography>
        </div>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/bot-builder')}
        >
          Back to Bots
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {!isBotConfigured() && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          ⚠️ This bot is not configured yet! Please add at least one trigger and one action in the bot editor before running a backtest.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Configuration */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Backtest Configuration
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Start Date"
                  type="date"
                  value={config.startDate}
                  onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="End Date"
                  type="date"
                  value={config.endDate}
                  onChange={(e) => setConfig({ ...config, endDate: e.target.value })}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Initial Capital ($)"
                  type="number"
                  value={config.initialCapital}
                  onChange={(e) => setConfig({ ...config, initialCapital: parseFloat(e.target.value) || 0 })}
                  fullWidth
                />
                <TextField
                  label="Asset"
                  value={config.asset}
                  onChange={(e) => setConfig({ ...config, asset: e.target.value })}
                  fullWidth
                  placeholder="BTC, ETH, etc."
                />
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={running ? <CircularProgress size={20} color="inherit" /> : <Science />}
                  onClick={runBacktest}
                  disabled={running || !isBotConfigured()}
                  fullWidth
                >
                  {running ? 'Running...' : isBotConfigured() ? 'Run Backtest' : 'Configure Bot First'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Results */}
        <Grid size={{ xs: 12, md: 8 }}>
          {result ? (
            <Grid container spacing={2}>
              {/* Summary Cards */}
              <Grid size={{ xs: 6, md: 3 }}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom variant="caption">
                      Total Trades
                    </Typography>
                    <Typography variant="h4">
                      {result.total_trades || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom variant="caption">
                      Win Rate
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {result.win_rate || 0}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom variant="caption">
                      ROI
                    </Typography>
                    <Typography
                      variant="h4"
                      color={(result.roi || 0) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {result.roi || 0}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom variant="caption">
                      Net Profit
                    </Typography>
                    <Typography
                      variant="h4"
                      color={(result.net_profit || 0) >= 0 ? 'success.main' : 'error.main'}
                    >
                      ${result.net_profit || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Detailed Stats */}
              <Grid size={{ xs: 12 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Detailed Statistics
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6, md: 4 }}>
                        <Typography variant="caption" color="text.secondary">
                          Initial Capital
                        </Typography>
                        <Typography variant="h6">
                          ${result.initial_capital || 0}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6, md: 4 }}>
                        <Typography variant="caption" color="text.secondary">
                          Final Capital
                        </Typography>
                        <Typography variant="h6">
                          ${result.final_capital || 0}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6, md: 4 }}>
                        <Typography variant="caption" color="text.secondary">
                          Winning Trades
                        </Typography>
                        <Typography variant="h6">
                          {result.winning_trades || 0}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6, md: 4 }}>
                        <Typography variant="caption" color="text.secondary">
                          Losing Trades
                        </Typography>
                        <Typography variant="h6">
                          {result.losing_trades || 0}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6, md: 4 }}>
                        <Typography variant="caption" color="text.secondary">
                          Max Drawdown
                        </Typography>
                        <Typography variant="h6" color="error.main">
                          {result.max_drawdown || 0}%
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6, md: 4 }}>
                        <Typography variant="caption" color="text.secondary">
                          Sharpe Ratio
                        </Typography>
                        <Typography variant="h6">
                          {result.sharpe_ratio || 0}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Trades List */}
              <Grid size={{ xs: 12 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Recent Trades
                    </Typography>
                    <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                      {result.trades_data?.slice(0, 10).map((trade, index) => (
                        <Paper key={index} sx={{ p: 2, mb: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">
                              <strong>{trade.type}</strong> {trade.quantity} {trade.symbol}
                            </Typography>
                            <Typography variant="body2">
                              @ ${trade.price}
                            </Typography>
                            {trade.profit_loss !== 0 && (
                              <Typography
                                variant="body2"
                                color={trade.profit_loss >= 0 ? 'success.main' : 'error.main'}
                              >
                                {trade.profit_loss >= 0 ? '+' : ''}${trade.profit_loss.toFixed(2)}
                              </Typography>
                            )}
                          </Box>
                        </Paper>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Paper
              sx={{
                p: 8,
                textAlign: 'center',
                bgcolor: 'grey.50',
                border: '2px dashed',
                borderColor: 'grey.300'
              }}
            >
              <Science sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No backtest results yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Configure the backtest settings and click "Run Backtest"
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default Backtest;
