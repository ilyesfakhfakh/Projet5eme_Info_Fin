import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Slider,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Alert,
  Collapse,
  FormGroup,
  FormLabel,
  FormHelperText as MuiFormHelperText,
  styled,
  Tooltip,
} from '@mui/material';
import { Save, Cancel, ArrowBack, InfoOutlined, Refresh, Timeline, ShowChart } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, subDays, startOfToday, isBefore, isAfter } from 'date-fns';
import { useFormik } from 'formik';
import * as Yup from 'yup';

// Custom styled components
const FormSection = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  backgroundColor: theme.palette.background.paper,
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  paddingBottom: theme.spacing(1),
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  alignItems: 'center',
  '& .MuiSvgIcon-root': {
    marginRight: theme.spacing(1),
  },
}));

const BacktestForm = ({ 
  simulation = null, 
  onCancel, 
  onSubmitSuccess,
  onBack,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [backtestResults, setBacktestResults] = useState(null);
  
  // Available timeframes for backtesting
  const timeframes = [
    { value: '1m', label: '1 Minute' },
    { value: '5m', label: '5 Minutes' },
    { value: '15m', label: '15 Minutes' },
    { value: '30m', label: '30 Minutes' },
    { value: '1h', label: '1 Hour' },
    { value: '4h', label: '4 Hours' },
    { value: '1d', label: '1 Day' },
  ];
  
  // Available symbols for backtesting
  const symbols = [
    'BTC/USD', 'ETH/USD', 'XRP/USD', 'ADA/USD', 'SOL/USD', 'DOT/USD',
    'BNB/USD', 'DOGE/USD', 'AVAX/USD', 'MATIC/USD', 'LTC/USD', 'LINK/USD'
  ];
  
  // Default form values
  const initialValues = {
    name: simulation?.name ? `${simulation.name} - Backtest ${format(new Date(), 'MMM d, yyyy')}` : '',
    description: simulation?.description || '',
    symbol: simulation?.symbol || 'BTC/USD',
    timeframe: simulation?.timeframe || '1h',
    startDate: subDays(startOfToday(), 30),
    endDate: startOfToday(),
    initialCapital: 10000,
    commission: 0.1, // 0.1% commission
    slippage: 0.1, // 0.1% slippage
    
    // Strategy parameters (will be populated from simulation if available)
    strategy: simulation?.strategy || '',
    parameters: simulation?.parameters || {},
    
    // Advanced settings
    useWalkForward: false,
    walkForwardPeriods: 3,
    walkForwardOptimization: false,
    
    // Performance metrics to track
    metrics: {
      sharpeRatio: true,
      sortinoRatio: true,
      maxDrawdown: true,
      winRate: true,
      profitFactor: true,
      expectancy: true,
    },
    
    // Execution settings
    execution: {
      orderType: 'limit', // 'market' or 'limit'
      allowPartialFills: true,
      maxOpenTrades: 1,
      maxLeverage: 1,
      marginMode: 'isolated', // 'isolated' or 'cross'
    },
  };

  // Form validation schema
  const validationSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    symbol: Yup.string().required('Symbol is required'),
    timeframe: Yup.string().required('Timeframe is required'),
    startDate: Yup.date()
      .required('Start date is required')
      .max(Yup.ref('endDate'), 'Start date must be before end date'),
    endDate: Yup.date()
      .required('End date is required')
      .min(Yup.ref('startDate'), 'End date must be after start date'),
    initialCapital: Yup.number()
      .min(1, 'Initial capital must be greater than 0')
      .required('Initial capital is required'),
    commission: Yup.number()
      .min(0, 'Commission cannot be negative')
      .max(100, 'Commission is too high')
      .required('Commission is required'),
    slippage: Yup.number()
      .min(0, 'Slippage cannot be negative')
      .max(100, 'Slippage is too high')
      .required('Slippage is required'),
  });

  const formik = useFormik({
    initialValues,
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError(null);
        setIsRunning(true);
        setProgress(0);
        
        // Simulate backtest progress (in a real app, this would be handled by WebSocket or polling)
        const interval = setInterval(() => {
          setProgress((prev) => {
            const newProgress = prev + Math.random() * 20;
            if (newProgress >= 100) {
              clearInterval(interval);
              setIsRunning(false);
              
              // Generate mock results
              setTimeout(() => {
                setBacktestResults(generateMockResults(values));
              }, 500);
              
              return 100;
            }
            return newProgress;
          });
        }, 500);
        
        // In a real app, you would call your API here
        // const result = await runBacktest(values);
        // onSubmitSuccess(result);
        
      } catch (err) {
        console.error('Error running backtest:', err);
        setError(err.message || 'Failed to run backtest. Please try again.');
        setIsRunning(false);
      } finally {
        setLoading(false);
      }
    },
  });
  
  // Generate mock backtest results (for demo purposes)
  const generateMockResults = (values) => {
    const totalTrades = Math.floor(Math.random() * 50) + 10;
    const winningTrades = Math.floor(totalTrades * (0.4 + Math.random() * 0.3));
    const losingTrades = totalTrades - winningTrades;
    const profit = (Math.random() * 5000) - 1000;
    const profitPercent = (profit / values.initialCapital) * 100;
    
    return {
      id: `bt-${Math.random().toString(36).substr(2, 8)}`,
      name: values.name,
      symbol: values.symbol,
      timeframe: values.timeframe,
      startDate: values.startDate,
      endDate: values.endDate,
      duration: Math.floor((values.endDate - values.startDate) / (1000 * 60 * 60 * 24)), // days
      status: 'completed',
      createdAt: new Date().toISOString(),
      
      // Performance metrics
      initialCapital: values.initialCapital,
      finalCapital: values.initialCapital + profit,
      profitLoss: profit,
      profitLossPercent: profitPercent,
      totalTrades,
      winningTrades,
      losingTrades,
      winRate: (winningTrades / totalTrades) * 100,
      lossRate: (losingTrades / totalTrades) * 100,
      averageWin: 2.5 + (Math.random() * 3),
      averageLoss: -1.5 - (Math.random() * 2),
      largestWin: 8 + (Math.random() * 5),
      largestLoss: -4 - (Math.random() * 3),
      maxDrawdown: 5 + (Math.random() * 10),
      sharpeRatio: 1.2 + (Math.random() * 1.5),
      sortinoRatio: 1.5 + (Math.random() * 1.8),
      profitFactor: 1.3 + (Math.random() * 1.2),
      expectancy: 0.8 + (Math.random() * 1.5),
      
      // Equity curve data
      equityCurve: Array.from({ length: 30 }, (_, i) => ({
        date: format(subDays(values.endDate, 29 - i), 'yyyy-MM-dd'),
        equity: values.initialCapital + (profit * (i / 29)) + (Math.random() * 200 - 100),
        balance: values.initialCapital + (profit * (i / 29)),
      })),
      
      // Trades
      trades: Array.from({ length: totalTrades }, (_, i) => ({
        id: `trade-${i + 1}`,
        entryTime: format(subDays(values.endDate, Math.floor(Math.random() * 30)), 'yyyy-MM-dd HH:mm'),
        exitTime: format(subDays(values.endDate, Math.floor(Math.random() * 30)), 'yyyy-MM-dd HH:mm'),
        symbol: values.symbol,
        side: Math.random() > 0.5 ? 'buy' : 'sell',
        entryPrice: 40000 + (Math.random() * 10000),
        exitPrice: 40000 + (Math.random() * 10000),
        quantity: 0.1 + (Math.random() * 0.9),
        pnl: (Math.random() * 200) - 50,
        pnlPercent: (Math.random() * 10) - 2.5,
        status: 'closed',
        commission: values.commission,
        slippage: values.slippage,
      })),
      
      // Parameters used
      parameters: values.parameters,
    };
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Handle parameter changes
  const handleParamChange = (paramName, value) => {
    formik.setFieldValue(`parameters.${paramName}`, value);
  };
  
  // Render parameter field based on type
  const renderParameterField = (param) => {
    const value = formik.values.parameters[param.name] ?? param.default;
    
    switch (param.type) {
      case 'number':
        return (
          <TextField
            fullWidth
            type="number"
            value={value}
            onChange={(e) => handleParamChange(param.name, parseFloat(e.target.value))}
            onBlur={formik.handleBlur}
            inputProps={{
              min: param.min,
              max: param.max,
              step: param.step || 1,
            }}
            InputProps={{
              endAdornment: param.suffix && (
                <InputAdornment position="end">
                  {param.suffix}
                </InputAdornment>
              ),
            }}
          />
        );
        
      case 'boolean':
        return (
          <Switch
            checked={Boolean(value)}
            onChange={(e) => handleParamChange(param.name, e.target.checked)}
            color="primary"
          />
        );
        
      case 'select':
        return (
          <FormControl fullWidth>
            <Select
              value={value}
              onChange={(e) => handleParamChange(param.name, e.target.value)}
              onBlur={formik.handleBlur}
            >
              {param.options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
        
      case 'slider':
        return (
          <Box>
            <Slider
              value={typeof value === 'number' ? value : 0}
              onChange={(_, newValue) => handleParamChange(param.name, newValue)}
              valueLabelDisplay="auto"
              min={param.min}
              max={param.max}
              step={param.step || 1}
              marks={param.marks}
            />
            <Box display="flex" justifyContent="space-between">
              <Typography variant="caption">
                {param.min} {param.suffix || ''}
              </Typography>
              <Typography variant="caption">
                {param.max} {param.suffix || ''}
              </Typography>
            </Box>
          </Box>
        );
        
      default:
        return (
          <TextField
            fullWidth
            value={value || ''}
            onChange={(e) => handleParamChange(param.name, e.target.value)}
            onBlur={formik.handleBlur}
          />
        );
    }
  };
  
  // Render the form tabs
  const renderTabs = () => {
    return (
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        indicatorColor="primary"
        textColor="primary"
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2 }}
      >
        <Tab label="Configuration" icon={<Timeline />} />
        <Tab label="Strategy Parameters" icon={<ShowChart />} disabled={!formik.values.strategy} />
        <Tab label="Advanced" icon={<InfoOutlined />} />
      </Tabs>
    );
  };
  
  // Render the form content based on the active tab
  const renderTabContent = () => {
    if (backtestResults) {
      return (
        <Box textAlign="center" py={4}>
          <Box mb={3}>
            <Typography variant="h5" color="primary" gutterBottom>
              Backtest Completed Successfully!
            </Typography>
            <Typography color="textSecondary" paragraph>
              Your backtest has completed with {backtestResults.totalTrades} total trades.
            </Typography>
          </Box>
          
          <Box display="flex" justifyContent="center" gap={2} flexWrap="wrap" mb={4}>
            <Paper sx={{ p: 2, minWidth: 150, textAlign: 'center' }}>
              <Typography variant="h6" color="textSecondary">Profit/Loss</Typography>
              <Typography 
                variant="h5" 
                color={backtestResults.profitLoss >= 0 ? 'success.main' : 'error.main'}
                fontWeight="bold"
              >
                {backtestResults.profitLoss >= 0 ? '+' : ''}
                {backtestResults.profitLoss.toFixed(2)} USD
              </Typography>
              <Typography variant="body2" color="textSecondary">
                ({backtestResults.profitLossPercent.toFixed(2)}%)
              </Typography>
            </Paper>
            
            <Paper sx={{ p: 2, minWidth: 150, textAlign: 'center' }}>
              <Typography variant="h6" color="textSecondary">Win Rate</Typography>
              <Typography variant="h5" fontWeight="bold">
                {backtestResults.winRate.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {backtestResults.winningTrades}W / {backtestResults.losingTrades}L
              </Typography>
            </Paper>
            
            <Paper sx={{ p: 2, minWidth: 150, textAlign: 'center' }}>
              <Typography variant="h6" color="textSecondary">Sharpe Ratio</Typography>
              <Typography variant="h5" fontWeight="bold">
                {backtestResults.sharpeRatio.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Max Drawdown: {backtestResults.maxDrawdown.toFixed(1)}%
              </Typography>
            </Paper>
          </Box>
          
          <Box display="flex" justifyContent="center" gap={2} mt={4}>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => {
                if (onSubmitSuccess) {
                  onSubmitSuccess(backtestResults);
                }
              }}
              startIcon={<Save />}
            >
              Save Results
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setBacktestResults(null)}
              startIcon={<Refresh />}
            >
              Run Another Test
            </Button>
          </Box>
        </Box>
      );
    }
    
    if (isRunning) {
      return (
        <Box textAlign="center" py={4}>
          <CircularProgress 
            variant={progress < 100 ? 'determinate' : 'indeterminate'} 
            value={progress} 
            size={80} 
            thickness={4}
            sx={{ mb: 3 }}
          />
          <Typography variant="h6" gutterBottom>
            {progress < 100 ? 'Running Backtest...' : 'Finalizing Results...'}
          </Typography>
          <Typography color="textSecondary" gutterBottom>
            {progress.toFixed(0)}% Complete
          </Typography>
          <Typography variant="body2" color="textSecondary" maxWidth={400} mx="auto">
            This may take a few moments. You can continue using the application while the backtest runs.
          </Typography>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={() => {
              // In a real app, this would cancel the running backtest
              setIsRunning(false);
              setProgress(0);
            }}
            sx={{ mt: 3 }}
            disabled={progress >= 100}
          >
            Cancel
          </Button>
        </Box>
      );
    }
    
    switch (activeTab) {
      case 0: // Configuration tab
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="name"
                name="name"
                label="Backtest Name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="symbol-label">Trading Pair *</InputLabel>
                <Select
                  labelId="symbol-label"
                  id="symbol"
                  name="symbol"
                  value={formik.values.symbol}
                  label="Trading Pair"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.symbol && Boolean(formik.errors.symbol)}
                  required
                >
                  {symbols.map((symbol) => (
                    <MenuItem key={symbol} value={symbol}>
                      {symbol}
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.symbol && formik.errors.symbol && (
                  <FormHelperText error>{formik.errors.symbol}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="timeframe-label">Timeframe *</InputLabel>
                <Select
                  labelId="timeframe-label"
                  id="timeframe"
                  name="timeframe"
                  value={formik.values.timeframe}
                  label="Timeframe"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.timeframe && Boolean(formik.errors.timeframe)}
                  required
                >
                  {timeframes.map((tf) => (
                    <MenuItem key={tf.value} value={tf.value}>
                      {tf.label}
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.timeframe && formik.errors.timeframe && (
                  <FormHelperText error>{formik.errors.timeframe}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="initialCapital"
                name="initialCapital"
                label="Initial Capital (USD)"
                type="number"
                value={formik.values.initialCapital}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.initialCapital && 
                  Boolean(formik.errors.initialCapital)
                }
                helperText={
                  formik.touched.initialCapital && formik.errors.initialCapital
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">$</InputAdornment>
                  ),
                }}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={formik.values.startDate}
                  onChange={(date) => formik.setFieldValue('startDate', date)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      error={
                        formik.touched.startDate && 
                        Boolean(formik.errors.startDate)
                      }
                      helperText={
                        formik.touched.startDate && formik.errors.startDate
                      }
                      required
                    />
                  )}
                  maxDate={formik.values.endDate}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="End Date"
                  value={formik.values.endDate}
                  onChange={(date) => formik.setFieldValue('endDate', date)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      error={
                        formik.touched.endDate && 
                        Boolean(formik.errors.endDate)
                      }
                      helperText={
                        formik.touched.endDate && formik.errors.endDate
                      }
                      required
                    />
                  )}
                  minDate={formik.values.startDate}
                  maxDate={new Date()}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="commission"
                name="commission"
                label="Commission per Trade (%)"
                type="number"
                value={formik.values.commission}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.commission && 
                  Boolean(formik.errors.commission)
                }
                helperText={
                  formik.touched.commission && formik.errors.commission
                }
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="slippage"
                name="slippage"
                label="Slippage per Trade (%)"
                type="number"
                value={formik.values.slippage}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.slippage && 
                  Boolean(formik.errors.slippage)
                }
                helperText={
                  formik.touched.slippage && formik.errors.slippage
                }
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="description"
                name="description"
                label="Description (Optional)"
                multiline
                rows={3}
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.description && 
                  Boolean(formik.errors.description)
                }
                helperText={
                  formik.touched.description && formik.errors.description
                }
              />
            </Grid>
          </Grid>
        );
        
      case 1: // Strategy Parameters tab
        if (!simulation?.parameters) {
          return (
            <Box 
              display="flex" 
              justifyContent="center" 
              alignItems="center" 
              minHeight="200px"
              color="text.secondary"
            >
              <Typography>No strategy parameters to configure</Typography>
            </Box>
          );
        }
        
        return (
          <Grid container spacing={3}>
            {Object.entries(simulation.parameters).map(([key, param]) => (
              <Grid item xs={12} md={6} key={key}>
                <FormControl fullWidth>
                  <InputLabel id={`${key}-label`}>
                    {param.label || key}
                  </InputLabel>
                  {renderParameterField(param)}
                  {param.description && (
                    <FormHelperText>{param.description}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
            ))}
          </Grid>
        );
        
      case 2: // Advanced tab
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Walk-Forward Optimization</FormLabel>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formik.values.useWalkForward}
                        onChange={(e) =>
                          formik.setFieldValue('useWalkForward', e.target.checked)
                        }
                        name="useWalkForward"
                        color="primary"
                      />
                    }
                    label="Enable Walk-Forward Analysis"
                  />
                  <FormHelperText>
                    Split the backtest period into multiple segments to test strategy robustness.
                  </FormHelperText>
                  
                  {formik.values.useWalkForward && (
                    <Box mt={2} pl={4}>
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Number of Periods"
                            type="number"
                            value={formik.values.walkForwardPeriods}
                            onChange={(e) =>
                              formik.setFieldValue(
                                'walkForwardPeriods',
                                Math.max(2, parseInt(e.target.value) || 2)
                              )
                            }
                            inputProps={{ min: 2, max: 10 }}
                            disabled={!formik.values.useWalkForward}
                          />
                          <FormHelperText>
                            Split the backtest into this many equal periods.
                          </FormHelperText>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={formik.values.walkForwardOptimization}
                                onChange={(e) =>
                                  formik.setFieldValue(
                                    'walkForwardOptimization',
                                    e.target.checked
                                  )
                                }
                                name="walkForwardOptimization"
                                color="primary"
                                disabled={!formik.values.useWalkForward}
                              />
                            }
                            label="Optimize Parameters"
                          />
                          <FormHelperText>
                            Optimize parameters on each walk-forward step.
                          </FormHelperText>
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                </FormGroup>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Performance Metrics</FormLabel>
                <FormGroup row>
                  {Object.entries(formik.values.metrics).map(([key, value]) => (
                    <Grid item xs={12} sm={6} md={4} key={key}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={value}
                            onChange={(e) =>
                              formik.setFieldValue(
                                `metrics.${key}`,
                                e.target.checked
                              )
                            }
                            name={`metrics.${key}`}
                            color="primary"
                          />
                        }
                        label={key
                          .replace(/([A-Z])/g, ' $1')
                          .replace(/^./, (str) => str.toUpperCase())}
                      />
                    </Grid>
                  ))}
                </FormGroup>
                <FormHelperText>
                  Select which performance metrics to calculate during the backtest.
                </FormHelperText>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Execution Settings</FormLabel>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel id="order-type-label">Order Type</InputLabel>
                      <Select
                        labelId="order-type-label"
                        id="execution.orderType"
                        name="execution.orderType"
                        value={formik.values.execution.orderType}
                        onChange={formik.handleChange}
                        label="Order Type"
                      >
                        <MenuItem value="market">Market Order</MenuItem>
                        <MenuItem value="limit">Limit Order</MenuItem>
                      </Select>
                      <FormHelperText>
                        Type of orders to use for trade execution.
                      </FormHelperText>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel id="margin-mode-label">Margin Mode</InputLabel>
                      <Select
                        labelId="margin-mode-label"
                        id="execution.marginMode"
                        name="execution.marginMode"
                        value={formik.values.execution.marginMode}
                        onChange={formik.handleChange}
                        label="Margin Mode"
                      >
                        <MenuItem value="isolated">Isolated Margin</MenuItem>
                        <MenuItem value="cross">Cross Margin</MenuItem>
                      </Select>
                      <FormHelperText>
                        Margin mode for trading.
                      </FormHelperText>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Max Open Trades"
                      type="number"
                      name="execution.maxOpenTrades"
                      value={formik.values.execution.maxOpenTrades}
                      onChange={formik.handleChange}
                      inputProps={{ min: 1, max: 100 }}
                      helperText="Maximum number of concurrent open trades"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Max Leverage"
                      type="number"
                      name="execution.maxLeverage"
                      value={formik.values.execution.maxLeverage}
                      onChange={formik.handleChange}
                      inputProps={{ min: 1, max: 100, step: 1 }}
                      helperText="Maximum leverage to use (1 = no leverage)"
                      InputProps={{
                        endAdornment: <InputAdornment position="end">x</InputAdornment>,
                      }}
                    />
                  </Grid>
                </Grid>
              </FormControl>
            </Grid>
          </Grid>
        );
        
      default:
        return null;
    }
  };

  return (
    <form onSubmit={formik.handleSubmit}>
      <Card>
        <CardHeader
          title={
            <Box display="flex" alignItems="center">
              {onBack && (
                <IconButton onClick={onBack} sx={{ mr: 1 }}>
                  <ArrowBack />
                </IconButton>
              )}
              <Typography variant="h6">
                {simulation ? `Backtest: ${simulation.name}` : 'New Backtest'}
              </Typography>
            </Box>
          }
          action={
            !backtestResults && !isRunning && (
              <Box>
                <Button
                  color="inherit"
                  onClick={onCancel}
                  startIcon={<Cancel />}
                  disabled={loading}
                  sx={{ mr: 1 }}
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  variant="contained"
                  type="submit"
                  startIcon={loading ? <CircularProgress size={20} /> : <PlayArrow />}
                  disabled={loading || !formik.isValid || isRunning}
                >
                  {loading ? 'Starting...' : 'Run Backtest'}
                </Button>
              </Box>
            )
          }
        />
        
        <Divider />
        
        <CardContent>
          <Collapse in={!!error}>
            <Alert 
              severity="error" 
              onClose={() => setError(null)}
              sx={{ mb: 3 }}
            >
              {error}
            </Alert>
          </Collapse>
          
          {!backtestResults && !isRunning && renderTabs()}
          {renderTabContent()}
        </CardContent>
        
        {!backtestResults && !isRunning && (
          <Box p={2} bgcolor="background.default" borderTop={1} borderColor="divider">
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={onCancel}
                disabled={loading}
                startIcon={<Cancel />}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading || !formik.isValid || isRunning}
                startIcon={loading ? <CircularProgress size={20} /> : <PlayArrow />}
              >
                {loading ? 'Starting...' : 'Run Backtest'}
              </Button>
            </Stack>
          </Box>
        )}
      </Card>
    </form>
  );
};

export default BacktestForm;
