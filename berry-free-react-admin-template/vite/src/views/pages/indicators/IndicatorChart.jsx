import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  CardHeader, 
  Grid, 
  Typography, 
  Divider, 
  IconButton, 
  Tooltip,
  CircularProgress,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormControlLabel,
  Switch,
  Button,
  Paper,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart,
  BarChart,
  Bar,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import { 
  Save as SaveIcon, 
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ColorLens as ColorLensIcon,
  SwapHoriz as TimeframeIcon
} from '@mui/icons-material';
import { calculateIndicator } from 'api/indicatorsService';
import { SketchPicker } from 'react-color';
import { format } from 'date-fns';

const IndicatorChart = ({ indicator, onUpdate, onRemove }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  // Available timeframes
  const timeframes = [
    { value: '1m', label: '1 Minute' },
    { value: '5m', label: '5 Minutes' },
    { value: '15m', label: '15 Minutes' },
    { value: '1h', label: '1 Hour' },
    { value: '4h', label: '4 Hours' },
    { value: '1d', label: '1 Day' },
    { value: '1w', label: '1 Week' },
  ];
  
  // Available symbols
  const symbols = [
    'BTC/USD',
    'ETH/USD',
    'XRP/USD',
    'SOL/USD',
    'ADA/USD',
    'DOT/USD',
    'DOGE/USD',
    'MATIC/USD',
  ];

  // Fetch indicator data when parameters change
  const fetchIndicatorData = useCallback(async () => {
    if (!indicator) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await calculateIndicator(
        indicator.id,
        indicator.parameters,
        indicator.symbol,
        indicator.timeframe,
        100
      );
      
      setData(result);
    } catch (err) {
      console.error('Error fetching indicator data:', err);
      setError('Failed to load indicator data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [indicator]);

  useEffect(() => {
    fetchIndicatorData();
  }, [fetchIndicatorData]);

  const handleParameterChange = (paramName, value) => {
    onUpdate({
      parameters: {
        ...indicator.parameters,
        [paramName]: value
      }
    });
  };

  const handleColorChange = (color) => {
    onUpdate({ color: color.hex });
  };

  const handleTimeframeChange = (event) => {
    onUpdate({ timeframe: event.target.value });
  };

  const handleSymbolChange = (event) => {
    onUpdate({ symbol: event.target.value });
  };

  const toggleVisibility = () => {
    onUpdate({ visible: !indicator.visible });
  };

  const renderParameterInputs = () => {
    return indicator.parameters.map((param) => {
      switch (param.type) {
        case 'number':
          return (
            <Grid item xs={6} sm={4} key={param.name}>
              <TextField
                fullWidth
                type="number"
                label={param.name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                value={indicator.parameters[param.name] || ''}
                onChange={(e) => handleParameterChange(param.name, parseFloat(e.target.value))}
                inputProps={{
                  min: param.min,
                  max: param.max,
                  step: param.step || 1
                }}
                size="small"
                variant="outlined"
              />
            </Grid>
          );
        case 'select':
          return (
            <Grid item xs={6} sm={4} key={param.name}>
              <FormControl fullWidth size="small" variant="outlined">
                <InputLabel>{param.name}</InputLabel>
                <Select
                  value={indicator.parameters[param.name] || ''}
                  onChange={(e) => handleParameterChange(param.name, e.target.value)}
                  label={param.name}
                >
                  {param.options.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          );
        default:
          return null;
      }
    });
  };

  const renderChart = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" height={400}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Box p={3} textAlign="center">
          <Typography color="error">{error}</Typography>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={fetchIndicatorData}
            sx={{ mt: 2 }}
          >
            Retry
          </Button>
        </Box>
      );
    }

    if (data.length === 0) {
      return (
        <Box p={3} textAlign="center">
          <Typography>No data available for the selected parameters.</Typography>
        </Box>
      );
    }

    const isBands = indicator.id === 'bbands';
    const isMACD = indicator.id === 'macd';
    
    // Format X-axis tick for better readability
    const formatXAxis = (tickItem) => {
      const date = new Date(tickItem);
      if (indicator.timeframe === '1d' || indicator.timeframe === '1w') {
        return format(date, 'MMM dd');
      }
      return format(date, 'HH:mm');
    };

    return (
      <Box mt={2}>
        <ResponsiveContainer width="100%" height={400}>
          {isBands ? (
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
              <XAxis 
                dataKey="time" 
                tickFormatter={formatXAxis}
                tick={{ fill: theme.palette.text.secondary }}
              />
              <YAxis tick={{ fill: theme.palette.text.secondary }} />
              <RechartsTooltip 
                labelFormatter={(value) => format(new Date(value), 'PPpp')}
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  borderColor: theme.palette.divider,
                  borderRadius: 4,
                }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="value.upper" 
                stroke="#8884d8" 
                fill="#8884d8" 
                fillOpacity={0.1} 
                name="Upper Band" 
              />
              <Area 
                type="monotone" 
                dataKey="value.middle" 
                stroke="#000" 
                fill="#000" 
                fillOpacity={0.1} 
                name="Middle Band" 
              />
              <Area 
                type="monotone" 
                dataKey="value.lower" 
                stroke="#82ca9d" 
                fill="#82ca9d" 
                fillOpacity={0.1} 
                name="Lower Band" 
              />
            </AreaChart>
          ) : isMACD ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
              <XAxis 
                dataKey="time" 
                tickFormatter={formatXAxis}
                tick={{ fill: theme.palette.text.secondary }}
              />
              <YAxis yAxisId="left" orientation="left" stroke={indicator.color} />
              <YAxis yAxisId="right" orientation="right" stroke={theme.palette.secondary.main} />
              <RechartsTooltip 
                labelFormatter={(value) => format(new Date(value), 'PPpp')}
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  borderColor: theme.palette.divider,
                  borderRadius: 4,
                }}
              />
              <Legend />
              <Bar 
                yAxisId="right"
                dataKey="value.histogram" 
                fill={theme.palette.secondary.main} 
                name="MACD Histogram"
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="value.macdLine" 
                stroke={indicator.color} 
                dot={false} 
                name="MACD Line"
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="value.signalLine" 
                stroke={theme.palette.primary.main} 
                dot={false} 
                name="Signal Line"
              />
            </BarChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
              <XAxis 
                dataKey="time" 
                tickFormatter={formatXAxis}
                tick={{ fill: theme.palette.text.secondary }}
              />
              <YAxis tick={{ fill: theme.palette.text.secondary }} />
              <RechartsTooltip 
                labelFormatter={(value) => format(new Date(value), 'PPpp')}
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  borderColor: theme.palette.divider,
                  borderRadius: 4,
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={indicator.color} 
                dot={false} 
                name={indicator.name}
                strokeWidth={2}
              />
              
              {indicator.id === 'rsi' && (
                <>
                  <ReferenceLine y={70} stroke="#ff6b6b" strokeDasharray="3 3" label="Overbought" />
                  <ReferenceLine y={30} stroke="#4caf50" strokeDasharray="3 3" label="Oversold" />
                </>
              )}
            </LineChart>
          )}
        </ResponsiveContainer>
      </Box>
    );
  };

  return (
    <Card variant="outlined">
      <CardHeader
        title={indicator.name}
        subheader={`${indicator.symbol} • ${indicator.timeframe}`}
        action={
          <Box>
            <Tooltip title={indicator.visible ? "Hide indicator" : "Show indicator"}>
              <IconButton onClick={toggleVisibility} size="large">
                {indicator.visible ? <VisibilityIcon /> : <VisibilityOffIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Change color">
              <IconButton 
                onClick={() => setShowColorPicker(!showColorPicker)}
                size="large"
              >
                <ColorLensIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Settings">
              <IconButton 
                onClick={() => setShowSettings(!showSettings)}
                size="large"
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Remove indicator">
              <IconButton 
                onClick={onRemove} 
                color="error"
                size="large"
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
            {showColorPicker && (
              <Box position="absolute" zIndex={10} right={16} top={56}>
                <Paper elevation={3}>
                  <SketchPicker
                    color={indicator.color}
                    onChangeComplete={handleColorChange}
                  />
                </Paper>
              </Box>
            )}
          </Box>
        }
      />
      
      <Divider />
      
      {showSettings && (
        <Box p={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small" variant="outlined">
                <InputLabel>Symbol</InputLabel>
                <Select
                  value={indicator.symbol}
                  onChange={handleSymbolChange}
                  label="Symbol"
                  startAdornment={<TimeframeIcon color="action" sx={{ mr: 1 }} />}
                >
                  {symbols.map((symbol) => (
                    <MenuItem key={symbol} value={symbol}>
                      {symbol}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small" variant="outlined">
                <InputLabel>Timeframe</InputLabel>
                <Select
                  value={indicator.timeframe}
                  onChange={handleTimeframeChange}
                  label="Timeframe"
                  startAdornment={<TimeframeIcon color="action" sx={{ mr: 1 }} />}
                >
                  {timeframes.map((tf) => (
                    <MenuItem key={tf.value} value={tf.value}>
                      {tf.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {renderParameterInputs()}
            
            <Grid item xs={12}>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<SaveIcon />}
                onClick={() => {}}
              >
                Save Changes
              </Button>
            </Grid>
          </Grid>
        </Box>
      )}
      
      <CardContent>
        {renderChart()}
      </CardContent>
    </Card>
  );
};

export default IndicatorChart;
