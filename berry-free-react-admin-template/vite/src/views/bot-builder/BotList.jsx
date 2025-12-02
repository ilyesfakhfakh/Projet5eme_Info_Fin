import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Typography,
  Chip,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem
} from '@mui/material';
import {
  Add,
  PlayArrow,
  Stop,
  Edit,
  Delete,
  Science,
  TrendingUp,
  TrendingDown,
  ContentCopy
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const BotList = () => {
  const navigate = useNavigate();
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [newBot, setNewBot] = useState({
    name: '',
    description: '',
    category: 'custom',
    risk_level: 'MEDIUM'
  });

  useEffect(() => {
    loadBots();
  }, []);

  const loadBots = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3200/api/v1/bots?userId=demo-user');
      const data = await response.json();
      
      if (data.success) {
        setBots(data.bots);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to load bots');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBot = async () => {
    try {
      const response = await fetch('http://localhost:3200/api/v1/bots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newBot,
          userId: 'demo-user',
          config: {
            nodes: [],
            edges: []
          }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setOpenDialog(false);
        setNewBot({ name: '', description: '', category: 'custom', risk_level: 'MEDIUM' });
        loadBots();
        // Rediriger vers l'éditeur
        navigate(`/bot-builder/${data.bot.bot_id}`);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to create bot');
      console.error(err);
    }
  };

  const handleStartBot = async (botId) => {
    try {
      const response = await fetch(`http://localhost:3200/api/v1/bots/${botId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: 'demo-user' })
      });

      const data = await response.json();
      
      if (data.success) {
        loadBots();
      } else {
        if (data.error.includes('Invalid bot configuration')) {
          setError('❌ Bot configuration is incomplete! Please edit the bot and add at least one trigger and one action.');
        } else {
          setError(data.error);
        }
      }
    } catch (err) {
      setError('Failed to start bot');
      console.error(err);
    }
  };

  const handleStopBot = async (botId) => {
    try {
      const response = await fetch(`http://localhost:3200/api/v1/bots/${botId}/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: 'demo-user' })
      });

      const data = await response.json();
      
      if (data.success) {
        loadBots();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to stop bot');
      console.error(err);
    }
  };

  const handleDeleteBot = async (botId) => {
    if (!window.confirm('Are you sure you want to delete this bot?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3200/api/v1/bots/${botId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: 'demo-user' })
      });

      const data = await response.json();
      
      if (data.success) {
        loadBots();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to delete bot');
      console.error(err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'PAUSED':
        return 'warning';
      case 'STOPPED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'LOW':
        return 'success';
      case 'MEDIUM':
        return 'warning';
      case 'HIGH':
        return 'error';
      default:
        return 'default';
    }
  };

  const isBotConfigured = (bot) => {
    if (!bot.config || !bot.config.nodes || !bot.config.edges) {
      return false;
    }
    const hasTrigger = bot.config.nodes.some(n => n.type === 'trigger');
    const hasAction = bot.config.nodes.some(n => n.type === 'action');
    return hasTrigger && hasAction && bot.config.nodes.length > 0;
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading bots...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <div>
          <Typography variant="h4" gutterBottom>
            🤖 Trading Bots
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create and manage your automated trading bots
          </Typography>
        </div>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ContentCopy />}
            onClick={() => navigate('/bot-builder/templates')}
          >
            Templates
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={() => setOpenDialog(true)}
          >
            Create New Bot
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Bots Grid */}
      <Grid container spacing={3}>
        {bots.length === 0 ? (
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No bots yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Create your first trading bot to get started
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setOpenDialog(true)}
                >
                  Create Bot
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ) : (
          bots.map((bot) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={bot.bot_id}>
              <Card>
                <CardContent>
                  {/* Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {bot.name}
                    </Typography>
                    <Chip
                      label={bot.status}
                      color={getStatusColor(bot.status)}
                      size="small"
                    />
                  </Box>

                  {/* Description */}
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                    {bot.description || 'No description'}
                  </Typography>

                  {/* Chips */}
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Chip
                      label={bot.risk_level}
                      color={getRiskColor(bot.risk_level)}
                      size="small"
                    />
                    <Chip label={bot.category} size="small" variant="outlined" />
                    <Chip 
                      label={isBotConfigured(bot) ? '✓ Configured' : '⚠ Not Configured'}
                      color={isBotConfigured(bot) ? 'success' : 'warning'}
                      size="small"
                      variant="outlined"
                    />
                  </Box>

                  {/* Stats */}
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Trades
                      </Typography>
                      <Typography variant="h6">
                        {bot.total_trades || 0}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Win Rate
                      </Typography>
                      <Typography variant="h6">
                        {bot.win_rate || 0}%
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        ROI
                      </Typography>
                      <Typography
                        variant="h6"
                        color={bot.roi >= 0 ? 'success.main' : 'error.main'}
                      >
                        {bot.roi >= 0 ? <TrendingUp /> : <TrendingDown />}
                        {bot.roi || 0}%
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>

                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  <Box>
                    {bot.status !== 'ACTIVE' ? (
                      <IconButton
                        color="success"
                        onClick={() => handleStartBot(bot.bot_id)}
                        title={isBotConfigured(bot) ? "Start Bot" : "Configure bot first"}
                        disabled={!isBotConfigured(bot)}
                      >
                        <PlayArrow />
                      </IconButton>
                    ) : (
                      <IconButton
                        color="error"
                        onClick={() => handleStopBot(bot.bot_id)}
                        title="Stop Bot"
                      >
                        <Stop />
                      </IconButton>
                    )}
                    <IconButton
                      color="primary"
                      onClick={() => navigate(`/bot-builder/${bot.bot_id}`)}
                      title="Edit Bot"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      color="info"
                      onClick={() => navigate(`/bot-builder/${bot.bot_id}/backtest`)}
                      title={isBotConfigured(bot) ? "Backtest" : "Configure bot first"}
                      disabled={!isBotConfigured(bot)}
                    >
                      <Science />
                    </IconButton>
                  </Box>
                  <IconButton
                    color="error"
                    onClick={() => handleDeleteBot(bot.bot_id)}
                    title="Delete Bot"
                  >
                    <Delete />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Create Bot Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Bot</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Bot Name"
              value={newBot.name}
              onChange={(e) => setNewBot({ ...newBot, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={newBot.description}
              onChange={(e) => setNewBot({ ...newBot, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
            <TextField
              select
              label="Category"
              value={newBot.category}
              onChange={(e) => setNewBot({ ...newBot, category: e.target.value })}
              fullWidth
            >
              <MenuItem value="custom">Custom</MenuItem>
              <MenuItem value="scalping">Scalping</MenuItem>
              <MenuItem value="swing">Swing Trading</MenuItem>
              <MenuItem value="arbitrage">Arbitrage</MenuItem>
            </TextField>
            <TextField
              select
              label="Risk Level"
              value={newBot.risk_level}
              onChange={(e) => setNewBot({ ...newBot, risk_level: e.target.value })}
              fullWidth
            >
              <MenuItem value="LOW">Low</MenuItem>
              <MenuItem value="MEDIUM">Medium</MenuItem>
              <MenuItem value="HIGH">High</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateBot}
            variant="contained"
            disabled={!newBot.name}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BotList;
