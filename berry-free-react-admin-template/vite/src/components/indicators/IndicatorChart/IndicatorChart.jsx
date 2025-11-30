import React, { useState, useEffect } from 'react';
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
  ReferenceLine
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
import { format } from 'date-fns';

const IndicatorChart = ({ indicator, onUpdate, onRemove }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  
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
  useEffect(() => {
    if (!indicator) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // In a real app, you would call the API:
        // const result = await calculateIndicator(
        //   indicator.id,
        //   indicator.parameters,
        //   indicator.symbol,
        //   indicator.timeframe,
        //   100
        // );
        
        // Mock data for demonstration
        const mockData = Array.from({ length: 100 }, (_, i) => {
          const baseValue = 100 + Math.sin(i / 10) * 10;
          let value;
          
          switch (indicator.id) {
            case 'sma':
              value = baseValue + (Math.random() * 2 - 1);
              break;
            case 'rsi':
              value = 50 + Math.sin(i / 5) * 20 + (Math.random() * 10 - 5);
              value = Math.max(0, Math.min(100, value));
              break;
            case 'bbands':
              const middle = baseValue;
              const stdDev = indicator.parameters?.stdDev || 2;
              value = {
                upper: middle + stdDev * 2,
                middle,
                lower: middle - stdDev * 2
              };
              break;
            case 'macd':
              const macdLine = Math.sin(i / 7) * 2;
              const signalLine = Math.sin((i + 2) / 7) * 1.8;
              value = {
                macdLine,
                signalLine,
                histogram: macdLine - signalLine
              };
              break;
            default:
              value = baseValue;
          }
          
          return {
            time: new Date(Date.now() - (99 - i) * 60 * 60 * 1000).toISOString(),
            value
          };
        });
        
        setData(mockData);
      } catch (err) {
        console.error('Error fetching indicator data:', err);
        setError('Failed to load indicator data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [indicator]);

  const handleParameterChange = (paramName, value) => {
    onUpdate({
      parameters: {
        ...indicator.parameters,
        [paramName]: value
      }
    });
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

  const renderChart = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" height={300}>
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
            onClick={() => window.location.reload()}
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
        <ResponsiveContainer width="100%" height={300}>
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

  const renderParameterInputs = () => {
    if (!indicator.parameters) return null;
    
    return Object.entries(indicator.parameters).map(([paramName, paramValue]) => (
      <Grid item xs={6} key={paramName}>
        <TextField
          fullWidth
          size="small"
          label={paramName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
          type="number"
          value={paramValue}
          onChange={(e) => handleParameterChange(paramName, parseFloat(e.target.value))}
          variant="outlined"
        />
      </Grid>
    ));
  };

  return (
    <Card variant="outlined">
      <CardHeader
        title={indicator.name}
        subheader={`${indicator.symbol} • ${indicator.timeframe}`}
        action={
          <Box>
            <Tooltip title={indicator.visible ? "Hide indicator" : "Show indicator"}>
              <IconButton onClick={toggleVisibility} size="small">
                {indicator.visible ? <VisibilityIcon /> : <VisibilityOffIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Settings">
              <IconButton 
                onClick={() => setShowSettings(!showSettings)}
                size="small"
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Remove indicator">
              <IconButton 
                onClick={onRemove} 
                color="error"
                size="small"
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        }
      />
      
      <Divider />
      
      {showSettings && (
        <Box p={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
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
            
            <Grid item xs={12} sm={6} md={4}>
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
                onClick={() => setShowSettings(false)}
                fullWidth
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
