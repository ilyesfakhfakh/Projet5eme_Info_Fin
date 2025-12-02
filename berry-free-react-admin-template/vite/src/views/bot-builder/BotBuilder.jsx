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
  Paper
} from '@mui/material';
import { Save, PlayArrow } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import VisualBotEditor from './VisualBotEditor';

const BotBuilder = () => {
  const { botId } = useParams();
  const navigate = useNavigate();
  const [bot, setBot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (botId) {
      loadBot();
    }
  }, [botId]);

  const loadBot = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3200/api/v1/bots/${botId}?userId=demo-user`);
      const data = await response.json();
      
      if (data.success) {
        setBot(data.bot);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to load bot');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigSave = async (newConfig) => {
    try {
      // Mettre à jour le state local d'abord
      const updatedBot = { ...bot, config: newConfig };
      setBot(updatedBot);
      
      // Sauvegarder automatiquement dans la base de données
      const response = await fetch(`http://localhost:3200/api/v1/bots/${botId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: 'demo-user',
          name: updatedBot.name,
          description: updatedBot.description,
          config: newConfig,
          settings: updatedBot.settings
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('✅ Configuration saved successfully to database!');
        // Recharger le bot depuis la DB pour confirmer
        loadBot();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to save configuration');
      console.error(err);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`http://localhost:3200/api/v1/bots/${botId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: 'demo-user',
          name: bot.name,
          description: bot.description,
          config: bot.config,
          settings: bot.settings
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Bot saved successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to save bot');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading bot...</Typography>
      </Box>
    );
  }

  if (!bot) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Bot not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <div>
          <Typography variant="h4" gutterBottom>
            🎨 Bot Builder
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {bot.name}
          </Typography>
        </div>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/bot-builder')}
          >
            Back to List
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
          >
            Save Bot
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<PlayArrow />}
            onClick={() => navigate(`/bot-builder/${botId}/backtest`)}
          >
            Backtest
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Bot Info */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Bot Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Name"
                  value={bot.name}
                  onChange={(e) => setBot({ ...bot, name: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="Description"
                  value={bot.description || ''}
                  onChange={(e) => setBot({ ...bot, description: e.target.value })}
                  fullWidth
                  multiline
                  rows={3}
                />
                <TextField
                  label="Status"
                  value={bot.status}
                  fullWidth
                  disabled
                />
              </Box>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Settings
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Max Investment ($)"
                  type="number"
                  value={bot.settings?.maxInvestment || 1000}
                  onChange={(e) => setBot({
                    ...bot,
                    settings: { ...bot.settings, maxInvestment: parseFloat(e.target.value) || 0 }
                  })}
                  fullWidth
                />
                <TextField
                  label="Stop Loss (%)"
                  type="number"
                  value={bot.settings?.stopLoss || 5}
                  onChange={(e) => setBot({
                    ...bot,
                    settings: { ...bot.settings, stopLoss: parseFloat(e.target.value) || 0 }
                  })}
                  fullWidth
                />
                <TextField
                  label="Take Profit (%)"
                  type="number"
                  value={bot.settings?.takeProfit || 10}
                  onChange={(e) => setBot({
                    ...bot,
                    settings: { ...bot.settings, takeProfit: parseFloat(e.target.value) || 0 }
                  })}
                  fullWidth
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Visual Bot Editor */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ height: 600, overflow: 'hidden' }}>
            <VisualBotEditor 
              initialConfig={bot.config}
              onSave={handleConfigSave}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BotBuilder;
