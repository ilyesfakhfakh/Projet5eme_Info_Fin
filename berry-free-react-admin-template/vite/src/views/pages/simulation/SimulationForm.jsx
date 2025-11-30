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
  InputLabel,
  MenuItem,
  Paper,
  Select,
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
  InputAdornment,
  FormLabel,
  RadioGroup,
  Radio,
  Slider,
  FormGroup,
  Checkbox,
  Chip,
  Stack,
} from '@mui/material';
import { Save, Cancel, ArrowBack, InfoOutlined } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, subDays, startOfToday } from 'date-fns';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const SimulationForm = ({ 
  simulation = null, 
  strategyTemplates = [],
  onCancel, 
  onSubmitSuccess,
  onBack,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  
  // Default form values
  const initialValues = {
    name: simulation?.name || '',
    description: simulation?.description || '',
    symbol: simulation?.symbol || 'BTC/USD',
    timeframe: simulation?.timeframe || '1h',
    strategy: simulation?.strategy || '',
    initialCapital: simulation?.initialCapital || 10000,
    startDate: simulation?.startDate ? new Date(simulation.startDate) : subDays(startOfToday(), 30),
    endDate: simulation?.endDate ? new Date(simulation.endDate) : startOfToday(),
    parameters: simulation?.parameters || {},
    isPublic: simulation?.isPublic || false,
    notifications: simulation?.notifications || {
      email: false,
      push: true,
      onCompletion: true,
      onError: true,
    },
  };

  // Form validation schema
  const validationSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    symbol: Yup.string().required('Symbol is required'),
    timeframe: Yup.string().required('Timeframe is required'),
    strategy: Yup.string().required('Strategy is required'),
    initialCapital: Yup.number()
      .min(1, 'Initial capital must be greater than 0')
      .required('Initial capital is required'),
    startDate: Yup.date()
      .required('Start date is required')
      .max(Yup.ref('endDate'), 'Start date must be before end date'),
    endDate: Yup.date()
      .required('End date is required')
      .min(Yup.ref('startDate'), 'End date must be after start date'),
  });

  const formik = useFormik({
    initialValues,
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError(null);
        
        // In a real app, you would call your API here
        // const result = simulation?.id 
        //   ? await updateSimulation(simulation.id, values)
        //   : await createSimulation(values);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock response
        const result = {
          ...values,
          id: simulation?.id || `sim-${Math.random().toString(36).substr(2, 8)}`,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        if (onSubmitSuccess) {
          onSubmitSuccess(result);
        }
      } catch (err) {
        console.error('Error saving simulation:', err);
        setError(err.message || 'Failed to save simulation. Please try again.');
      } finally {
        setLoading(false);
      }
    },
  });

  // Handle strategy selection
  useEffect(() => {
    if (formik.values.strategy) {
      const strategy = strategyTemplates.find(
        (s) => s.id === formik.values.strategy
      );
      setSelectedStrategy(strategy || null);
      
      // Initialize default parameters if this is a new simulation
      if (strategy && !simulation) {
        const defaultParams = {};
        strategy.parameters.forEach((param) => {
          defaultParams[param.name] = param.default;
        });
        formik.setFieldValue('parameters', defaultParams);
      }
    } else {
      setSelectedStrategy(null);
    }
  }, [formik.values.strategy, strategyTemplates]);

  // Handle parameter changes
  const handleParamChange = (paramName, value) => {
    formik.setFieldValue(`parameters.${paramName}`, value);
  };

  // Render form field based on parameter type
  const renderParameterField = (param) => {
    const value = formik.values.parameters[param.name] ?? param.default;
    
    switch (param.type) {
      case 'number':
        return (
          <TextField
            fullWidth
            type="number"
            name={`parameters.${param.name}`}
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
            error={
              formik.touched.parameters?.[param.name] && 
              Boolean(formik.errors.parameters?.[param.name])
            }
            helperText={
              formik.touched.parameters?.[param.name] && 
              formik.errors.parameters?.[param.name]
            }
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
              name={`parameters.${param.name}`}
              value={value}
              onChange={(e) => handleParamChange(param.name, e.target.value)}
              onBlur={formik.handleBlur}
              error={
                formik.touched.parameters?.[param.name] && 
                Boolean(formik.errors.parameters?.[param.name])
              }
            >
              {param.options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {formik.touched.parameters?.[param.name] && 
              formik.errors.parameters?.[param.name] && (
                <FormHelperText error>
                  {formik.errors.parameters[param.name]}
                </FormHelperText>
            )}
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
        
      case 'multiselect':
        return (
          <FormControl fullWidth>
            <Select
              multiple
              name={`parameters.${param.name}`}
              value={value || []}
              onChange={(e) => handleParamChange(param.name, e.target.value)}
              onBlur={formik.handleBlur}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
              error={
                formik.touched.parameters?.[param.name] && 
                Boolean(formik.errors.parameters?.[param.name])
              }
            >
              {param.options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Checkbox checked={value?.includes(option.value) || false} />
                  <ListItemText primary={option.label} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
        
      default:
        return (
          <TextField
            fullWidth
            name={`parameters.${param.name}`}
            value={value || ''}
            onChange={(e) => handleParamChange(param.name, e.target.value)}
            onBlur={formik.handleBlur}
            error={
              formik.touched.parameters?.[param.name] && 
              Boolean(formik.errors.parameters?.[param.name])
            }
            helperText={
              (formik.touched.parameters?.[param.name] && 
                formik.errors.parameters?.[param.name]) ||
              param.description
            }
          />
        );
    }
  };

  // Render the form tabs
  const renderTabs = () => {
    return (
      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        indicatorColor="primary"
        textColor="primary"
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2 }}
      >
        <Tab label="General" />
        <Tab label="Strategy Parameters" disabled={!selectedStrategy} />
        <Tab label="Advanced" />
      </Tabs>
    );
  };

  // Render the form content based on the active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // General tab
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="name"
                name="name"
                label="Simulation Name"
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
                <InputLabel id="strategy-label">Strategy *</InputLabel>
                <Select
                  labelId="strategy-label"
                  id="strategy"
                  name="strategy"
                  value={formik.values.strategy}
                  label="Strategy"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.strategy && Boolean(formik.errors.strategy)}
                  required
                >
                  <MenuItem value="">
                    <em>Select a strategy</em>
                  </MenuItem>
                  {strategyTemplates.map((strategy) => (
                    <MenuItem key={strategy.id} value={strategy.id}>
                      {strategy.name}
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.strategy && formik.errors.strategy && (
                  <FormHelperText error>{formik.errors.strategy}</FormHelperText>
                )}
              </FormControl>
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
                  {['BTC/USD', 'ETH/USD', 'XRP/USD', 'ADA/USD', 'SOL/USD', 'DOT/USD'].map((pair) => (
                    <MenuItem key={pair} value={pair}>
                      {pair}
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
                  {['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'].map((tf) => (
                    <MenuItem key={tf} value={tf}>
                      {tf}
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.timeframe && formik.errors.timeframe && (
                  <FormHelperText error>{formik.errors.timeframe}</FormHelperText>
                )}
              </FormControl>
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
            
            <Grid item xs={12}>
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
        if (!selectedStrategy) {
          return (
            <Box 
              display="flex" 
              justifyContent="center" 
              alignItems="center" 
              minHeight="200px"
              color="text.secondary"
            >
              <Typography>Select a strategy to configure parameters</Typography>
            </Box>
          );
        }
        
        return (
          <Grid container spacing={3}>
            {selectedStrategy.parameters && selectedStrategy.parameters.length > 0 ? (
              selectedStrategy.parameters.map((param) => (
                <Grid item xs={12} md={6} key={param.name}>
                  <FormControl fullWidth>
                    <InputLabel id={`${param.name}-label`}>
                      {param.label || param.name}
                    </InputLabel>
                    {renderParameterField(param)}
                    {param.description && (
                      <FormHelperText>{param.description}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Typography color="textSecondary">
                  No parameters to configure for this strategy.
                </Typography>
              </Grid>
            )}
          </Grid>
        );
        
      case 2: // Advanced tab
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Visibility</FormLabel>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formik.values.isPublic}
                        onChange={formik.handleChange}
                        name="isPublic"
                        color="primary"
                      />
                    }
                    label="Make this simulation public"
                  />
                  <FormHelperText>
                    {formik.values.isPublic
                      ? 'This simulation will be visible to other users.'
                      : 'This simulation is private and only visible to you.'}
                  </FormHelperText>
                </FormGroup>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Notifications</FormLabel>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formik.values.notifications.email}
                        onChange={(e) =>
                          formik.setFieldValue(
                            'notifications.email',
                            e.target.checked
                          )
                        }
                        name="notifications.email"
                        color="primary"
                      />
                    }
                    label="Email notifications"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formik.values.notifications.push}
                        onChange={(e) =>
                          formik.setFieldValue(
                            'notifications.push',
                            e.target.checked
                          )
                        }
                        name="notifications.push"
                        color="primary"
                      />
                    }
                    label="Push notifications"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formik.values.notifications.onCompletion}
                        onChange={(e) =>
                          formik.setFieldValue(
                            'notifications.onCompletion',
                            e.target.checked
                          )
                        }
                        name="notifications.onCompletion"
                        color="primary"
                      />
                    }
                    label="Notify on completion"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formik.values.notifications.onError}
                        onChange={(e) =>
                          formik.setFieldValue(
                            'notifications.onError',
                            e.target.checked
                          )
                        }
                        name="notifications.onError"
                        color="primary"
                      />
                    }
                    label="Notify on error"
                  />
                </FormGroup>
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
                {simulation ? 'Edit Simulation' : 'Create New Simulation'}
              </Typography>
            </Box>
          }
          action={
            <Box>
              <Button
                color="inherit"
                onClick={onCancel}
                startIcon={<Cancel />}
                sx={{ mr: 1 }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                color="primary"
                variant="contained"
                type="submit"
                startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                disabled={loading || !formik.isValid || !formik.dirty}
              >
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </Box>
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
          
          {renderTabs()}
          {renderTabContent()}
          
          {selectedStrategy && selectedStrategy.description && (
            <Box mt={3} p={2} bgcolor="action.hover" borderRadius={1}>
              <Box display="flex" alignItems="center" mb={1}>
                <InfoOutlined color="primary" sx={{ mr: 1 }} />
                <Typography variant="subtitle2">Strategy Overview</Typography>
              </Box>
              <Typography variant="body2">
                {selectedStrategy.description}
              </Typography>
            </Box>
          )}
        </CardContent>
        
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
              disabled={loading || !formik.isValid || !formik.dirty}
              startIcon={loading ? <CircularProgress size={20} /> : <Save />}
            >
              {loading ? 'Saving...' : 'Save Simulation'}
            </Button>
          </Stack>
        </Box>
      </Card>
    </form>
  );
};

export default SimulationForm;
