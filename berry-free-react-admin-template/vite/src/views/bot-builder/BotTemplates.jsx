import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Grid,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { Download, TrendingUp, CompareArrows, ShowChart } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const templates = [
  {
    id: 'rsi-scalping',
    name: 'RSI Scalping Bot',
    description: 'Buy when RSI < 30 (oversold), sell when RSI > 70 (overbought)',
    category: 'scalping',
    difficulty: 'BEGINNER',
    icon: <TrendingUp />,
    config: {
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger',
          position: { x: 100, y: 100 },
          data: {
            label: 'RSI Oversold',
            condition: 'rsi',
            operator: '<',
            value: 30
          }
        },
        {
          id: 'action-1',
          type: 'action',
          position: { x: 400, y: 100 },
          data: {
            label: 'Buy 20%',
            type: 'BUY',
            quantity: 20,
            symbol: 'BTC'
          }
        },
        {
          id: 'trigger-2',
          type: 'trigger',
          position: { x: 100, y: 300 },
          data: {
            label: 'RSI Overbought',
            condition: 'rsi',
            operator: '>',
            value: 70
          }
        },
        {
          id: 'action-2',
          type: 'action',
          position: { x: 400, y: 300 },
          data: {
            label: 'Sell All',
            type: 'SELL',
            quantity: 100,
            symbol: 'BTC'
          }
        }
      ],
      edges: [
        { source: 'trigger-1', target: 'action-1', animated: true },
        { source: 'trigger-2', target: 'action-2', animated: true }
      ]
    }
  },
  {
    id: 'macd-crossover',
    name: 'MACD Crossover Strategy',
    description: 'Trade based on MACD line crossing the signal line',
    category: 'swing',
    difficulty: 'INTERMEDIATE',
    icon: <CompareArrows />,
    config: {
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger',
          position: { x: 100, y: 100 },
          data: {
            label: 'MACD Bullish Cross',
            condition: 'macd',
            operator: '>',
            value: 0
          }
        },
        {
          id: 'action-1',
          type: 'action',
          position: { x: 400, y: 100 },
          data: {
            label: 'Buy 30%',
            type: 'BUY',
            quantity: 30,
            symbol: 'BTC'
          }
        },
        {
          id: 'trigger-2',
          type: 'trigger',
          position: { x: 100, y: 300 },
          data: {
            label: 'MACD Bearish Cross',
            condition: 'macd',
            operator: '<',
            value: 0
          }
        },
        {
          id: 'action-2',
          type: 'action',
          position: { x: 400, y: 300 },
          data: {
            label: 'Sell All',
            type: 'SELL',
            quantity: 100,
            symbol: 'BTC'
          }
        }
      ],
      edges: [
        { source: 'trigger-1', target: 'action-1', animated: true },
        { source: 'trigger-2', target: 'action-2', animated: true }
      ]
    }
  },
  {
    id: 'price-breakout',
    name: 'Price Breakout Bot',
    description: 'Buy when price breaks above resistance, sell at target',
    category: 'breakout',
    difficulty: 'ADVANCED',
    icon: <ShowChart />,
    config: {
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger',
          position: { x: 100, y: 150 },
          data: {
            label: 'Price Breakout',
            condition: 'price',
            operator: '>',
            value: 100000
          }
        },
        {
          id: 'condition-1',
          type: 'condition',
          position: { x: 300, y: 150 },
          data: {
            label: 'Volume Confirm',
            operator: 'AND'
          }
        },
        {
          id: 'trigger-2',
          type: 'trigger',
          position: { x: 100, y: 250 },
          data: {
            label: 'High Volume',
            condition: 'volume',
            operator: '>',
            value: 1000000
          }
        },
        {
          id: 'action-1',
          type: 'action',
          position: { x: 500, y: 150 },
          data: {
            label: 'Buy 50%',
            type: 'BUY',
            quantity: 50,
            symbol: 'BTC'
          }
        }
      ],
      edges: [
        { source: 'trigger-1', target: 'condition-1', animated: true },
        { source: 'trigger-2', target: 'condition-1', animated: true },
        { source: 'condition-1', target: 'action-1', animated: true }
      ]
    }
  }
];

const BotTemplates = () => {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [botName, setBotName] = useState('');

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'BEGINNER':
        return 'success';
      case 'INTERMEDIATE':
        return 'warning';
      case 'ADVANCED':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleUseTemplate = (template) => {
    setSelectedTemplate(template);
    setBotName(template.name);
    setDialogOpen(true);
  };

  const createBotFromTemplate = async () => {
    try {
      const response = await fetch('http://localhost:3200/api/v1/bots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: 'demo-user',
          name: botName,
          description: selectedTemplate.description,
          category: selectedTemplate.category,
          config: selectedTemplate.config
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setDialogOpen(false);
        navigate(`/bot-builder/${data.bot.bot_id}`);
      }
    } catch (err) {
      console.error('Failed to create bot from template:', err);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          📚 Bot Templates
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Start with a pre-built strategy and customize it to your needs
        </Typography>
      </Box>

      {/* Templates Grid */}
      <Grid container spacing={3}>
        {templates.map((template) => (
          <Grid size={{ xs: 12, md: 6, lg: 4 }} key={template.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                {/* Icon and Title */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: 'primary.light',
                      color: 'primary.main',
                      display: 'flex',
                      mr: 2
                    }}
                  >
                    {template.icon}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {template.name}
                  </Typography>
                </Box>

                {/* Description */}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {template.description}
                </Typography>

                {/* Tags */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    label={template.difficulty}
                    color={getDifficultyColor(template.difficulty)}
                    size="small"
                  />
                  <Chip
                    label={template.category}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={`${template.config.nodes.length} nodes`}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </CardContent>

              <CardActions>
                <Button
                  startIcon={<Download />}
                  onClick={() => handleUseTemplate(template)}
                  fullWidth
                  variant="contained"
                >
                  Use Template
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Bot from Template</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Template: <strong>{selectedTemplate?.name}</strong>
            </Typography>
            <TextField
              label="Bot Name"
              value={botName}
              onChange={(e) => setBotName(e.target.value)}
              fullWidth
              autoFocus
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={createBotFromTemplate} variant="contained" disabled={!botName}>
            Create Bot
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BotTemplates;
