import React, { useState, useEffect } from 'react';
import { useAuth } from 'contexts/auth';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Warning,
  Shield,
  Add,
  Edit,
  Delete,
  Refresh,
  PlayArrow
} from '@mui/icons-material';
import MainCard from 'ui-component/cards/MainCard';
import http from '../../../api/http';
import { listPortfolios } from '../../../api/portfolios';

export default function RiskPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [exposureData, setExposureData] = useState(null);
  const [riskMetrics, setRiskMetrics] = useState([]);
  const [limits, setLimits] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [stressScenarios, setStressScenarios] = useState([]);
  const [stressTestResults, setStressTestResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [limitDialog, setLimitDialog] = useState({ open: false, mode: 'create', data: {} });
  const [selectedScenario, setSelectedScenario] = useState('');
  const [runningStressTest, setRunningStressTest] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState('');
  const [portfolios, setPortfolios] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedPortfolio) {
      // Reload metrics when portfolio changes
      loadData();
    }
  }, [selectedPortfolio]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load portfolios first (filtered by user)
      console.log('Loading portfolios for user:', user?.user_id);
      try {
        const portfoliosRes = await listPortfolios({ user_id: user?.user_id });
        console.log('Portfolios response:', portfoliosRes);
        if (portfoliosRes && Array.isArray(portfoliosRes)) {
          console.log('Setting portfolios:', portfoliosRes.length);
          setPortfolios(portfoliosRes);
          // Auto-select first portfolio if none selected
          if (!selectedPortfolio && portfoliosRes.length > 0) {
            setSelectedPortfolio(portfoliosRes[0].portfolio_id);
          }
        } else {
          console.error('Invalid portfolios response format:', portfoliosRes);
        }
      } catch (portfolioError) {
        console.error('Error loading portfolios:', portfolioError);
        // Try fallback direct API call with user filter
        try {
          console.log('Trying fallback portfolio loading...');
          const url = user?.user_id
            ? `http://localhost:3200/api/v1/portfolios?user_id=${user.user_id}`
            : 'http://localhost:3200/api/v1/portfolios';
          const response = await fetch(url);
          if (response.ok) {
            const portfoliosData = await response.json();
            console.log('Fallback portfolios loaded:', portfoliosData.length);
            setPortfolios(portfoliosData);
            if (!selectedPortfolio && portfoliosData.length > 0) {
              setSelectedPortfolio(portfoliosData[0].portfolio_id);
            }
          } else {
            console.error('Fallback API call failed with status:', response.status);
          }
        } catch (fallbackError) {
          console.error('Fallback portfolio loading failed:', fallbackError);
        }
      }

      // Load risk data (requires auth) - load individually to avoid Promise.all failure
      try {
        const riskPromises = [
          http.get('/risk/exposure').catch(err => ({ error: err, endpoint: 'exposure' })),
          selectedPortfolio ? http.get(`/risk/metrics?portfolio_id=${selectedPortfolio}`).catch(err => ({ error: err, endpoint: 'metrics' })) : http.get('/risk/metrics').catch(err => ({ error: err, endpoint: 'metrics' })),
          http.get('/risk/limits').catch(err => ({ error: err, endpoint: 'limits' })),
          http.get('/risk/alerts').catch(err => ({ error: err, endpoint: 'alerts' })),
          http.get('/risk/stress/scenarios').catch(err => ({ error: err, endpoint: 'scenarios' }))
        ];

        const [exposureRes, metricsRes, limitsRes, alertsRes, scenariosRes] = await Promise.all(riskPromises);

        if (exposureRes.success) setExposureData(exposureRes.data);
        if (metricsRes.success) setRiskMetrics(metricsRes.data);
        if (limitsRes.success) setLimits(limitsRes.data);
        if (alertsRes.success) setAlerts(alertsRes.data);
        if (scenariosRes.success) setStressScenarios(scenariosRes.data);

        // Log any failed requests
        [exposureRes, metricsRes, limitsRes, alertsRes, scenariosRes].forEach((res, index) => {
          if (res.error) {
            console.error(`Risk API ${res.endpoint} failed:`, res.error);
          }
        });

      } catch (riskError) {
        console.error('Error in risk data loading:', riskError);
      }
    } catch (error) {
      console.error('Error in loadData:', error);
    }
    setLoading(false);
  };

  const calculateVaR = async () => {
    if (!selectedPortfolio) {
      alert('Please select a portfolio first');
      return;
    }
    try {
      const response = await http.post('/risk/calculate/var', {
        portfolio_id: selectedPortfolio,
        confidence: 0.95,
        time_horizon: 1
      });
      if (response.success) {
        loadData(); // Refresh metrics
      }
    } catch (error) {
      console.error('Error calculating VaR:', error);
    }
  };

  const handleLimitDialog = (mode = 'create', data = {}) => {
    setLimitDialog({ open: true, mode, data });
  };

  const handleLimitSubmit = async () => {
    try {
      const endpoint = limitDialog.mode === 'create' ? '/risk/limits' : `/risk/limits/${limitDialog.data.limit_id}`;
      const method = limitDialog.mode === 'create' ? http.post : http.put;

      const response = await method(endpoint, limitDialog.data);
      if (response.success) {
        setLimitDialog({ open: false, mode: 'create', data: {} });
        loadData();
      }
    } catch (error) {
      console.error('Error saving limit:', error);
    }
  };

  const deleteLimit = async (limitId) => {
    if (window.confirm('Are you sure you want to delete this limit?')) {
      try {
        await http.del(`/risk/limits/${limitId}`);
        loadData();
      } catch (error) {
        console.error('Error deleting limit:', error);
      }
    }
  };

  const acknowledgeAlert = async (alertId) => {
    try {
      await http.put(`/risk/alerts/${alertId}/acknowledge`);
      loadData();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const runStressTest = async () => {
    if (!selectedScenario) {
      alert('Please select a stress scenario first');
      return;
    }
    if (!selectedPortfolio) {
      alert('Please select a portfolio first');
      return;
    }

    setRunningStressTest(true);
    try {
      const response = await http.post('/risk/stress/run', {
        portfolio_id: selectedPortfolio,
        scenario_id: selectedScenario
      });

      if (response.success) {
        // Add the result to our results list
        setStressTestResults(prev => [...prev, {
          ...response.data,
          timestamp: new Date(),
          scenario: stressScenarios.find(s => s.scenario_id === selectedScenario)
        }]);
        loadData(); // Refresh metrics which may include stress test results
      }
    } catch (error) {
      console.error('Error running stress test:', error);
      alert('Failed to run stress test. Please try again.');
    }
    setRunningStressTest(false);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(value || 0);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL': return 'error';
      case 'HIGH': return 'error';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'info';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Risk Management Dashboard</Typography>
        <Box display="flex" gap={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Portfolio</InputLabel>
            <Select
              value={selectedPortfolio}
              onChange={(e) => setSelectedPortfolio(e.target.value)}
              label="Portfolio"
              disabled={loading}
            >
              {portfolios.length === 0 && !loading && (
                <MenuItem disabled>
                  <em>No portfolios available</em>
                </MenuItem>
              )}
              {portfolios.map((portfolio) => (
                <MenuItem key={portfolio.portfolio_id} value={portfolio.portfolio_id}>
                  {portfolio.portfolio_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={loadData}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Overview" />
        <Tab label="Limits Management" />
        <Tab label="Alerts" />
        <Tab label="Stress Testing" />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Exposure Summary */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Portfolio Exposure
                </Typography>
                {exposureData ? (
                  <Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography>Gross Long:</Typography>
                      <Typography color="success.main">{formatCurrency(exposureData.gross_long)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography>Gross Short:</Typography>
                      <Typography color="error.main">{formatCurrency(exposureData.gross_short)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={2}>
                      <Typography fontWeight="bold">Net Exposure:</Typography>
                      <Typography fontWeight="bold" color={exposureData.net >= 0 ? 'success.main' : 'error.main'}>
                        {formatCurrency(exposureData.net)}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Typography>No exposure data available</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Risk Metrics */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Risk Metrics</Typography>
                  <Button variant="outlined" size="small" onClick={calculateVaR}>
                    Calculate VaR
                  </Button>
                </Box>
                {riskMetrics.slice(0, 3).map((metric) => (
                  <Box key={metric.metric_id} display="flex" justifyContent="space-between" mb={1}>
                    <Typography>{metric.metric_type} ({metric.confidence_level * 100}%):</Typography>
                    <Typography color="error.main">{formatCurrency(metric.value)}</Typography>
                  </Box>
                ))}
                {riskMetrics.length === 0 && (
                  <Typography>No risk metrics calculated yet</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Active Alerts */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Active Alerts
                </Typography>
                {alerts.filter(a => a.status === 'ACTIVE').length > 0 ? (
                  alerts.filter(a => a.status === 'ACTIVE').map((alert) => (
                    <Alert
                      key={alert.alert_id}
                      severity={getSeverityColor(alert.severity)}
                      action={
                        <Button color="inherit" size="small" onClick={() => acknowledgeAlert(alert.alert_id)}>
                          Acknowledge
                        </Button>
                      }
                      sx={{ mb: 1 }}
                    >
                      {alert.description || `${alert.alert_type} - Current: ${formatCurrency(alert.current_value)}, Limit: ${formatCurrency(alert.limit_value)}`}
                    </Alert>
                  ))
                ) : (
                  <Typography>No active alerts</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">Risk Limits Management</Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleLimitDialog('create')}
              >
                Add Limit
              </Button>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Instrument</TableCell>
                    <TableCell>Limit Value</TableCell>
                    <TableCell>Time Horizon</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {limits.map((limit) => (
                    <TableRow key={limit.limit_id}>
                      <TableCell>{limit.limit_type}</TableCell>
                      <TableCell>{limit.instrument_type}</TableCell>
                      <TableCell>{formatCurrency(limit.limit_value)}</TableCell>
                      <TableCell>{limit.time_horizon}</TableCell>
                      <TableCell>
                        <Chip
                          label={limit.is_active ? 'Active' : 'Inactive'}
                          color={limit.is_active ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Edit">
                          <IconButton onClick={() => handleLimitDialog('edit', limit)}>
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton onClick={() => deleteLimit(limit.limit_id)}>
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Risk Alerts History
            </Typography>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {alerts.map((alert) => (
                    <TableRow key={alert.alert_id}>
                      <TableCell>{new Date(alert.alert_date).toLocaleDateString()}</TableCell>
                      <TableCell>{alert.alert_type}</TableCell>
                      <TableCell>
                        <Chip
                          label={alert.severity}
                          color={getSeverityColor(alert.severity)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{alert.description || 'Limit breach'}</TableCell>
                      <TableCell>{alert.status}</TableCell>
                      <TableCell>
                        {alert.status === 'ACTIVE' && (
                          <Button size="small" onClick={() => acknowledgeAlert(alert.alert_id)}>
                            Acknowledge
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {activeTab === 3 && (
        <Grid container spacing={3}>
          {/* Available Scenarios */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Available Stress Scenarios
                </Typography>
                <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Scenario</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stressScenarios.map((scenario) => (
                        <TableRow key={scenario.scenario_id}>
                          <TableCell>{scenario.name}</TableCell>
                          <TableCell>{scenario.description}</TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              variant={selectedScenario === scenario.scenario_id ? "contained" : "outlined"}
                              onClick={() => setSelectedScenario(scenario.scenario_id)}
                            >
                              {selectedScenario === scenario.scenario_id ? "Selected" : "Select"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {stressScenarios.length === 0 && (
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                    No stress scenarios available
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Run Stress Test */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Run Stress Test
                </Typography>
                {selectedScenario && (
                  <Box mb={2}>
                    <Typography variant="body2" color="primary">
                      Selected: {stressScenarios.find(s => s.scenario_id === selectedScenario)?.name}
                    </Typography>
                  </Box>
                )}
                <Button
                  variant="contained"
                  fullWidth
                  onClick={runStressTest}
                  disabled={!selectedScenario || runningStressTest}
                  startIcon={runningStressTest ? <Refresh sx={{ animation: 'spin 1s linear infinite' }} /> : <Shield />}
                >
                  {runningStressTest ? 'Running Test...' : 'Run Stress Test'}
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Stress Test Results */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Stress Test Results
                </Typography>
                {stressTestResults.length > 0 ? (
                  <TableContainer component={Paper}>
                    <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Timestamp</TableCell>
                              <TableCell>Scenario</TableCell>
                              <TableCell>P&L Impact</TableCell>
                              <TableCell>Equity P&L</TableCell>
                              <TableCell>Rates P&L</TableCell>
                              <TableCell>FX P&L</TableCell>
                              <TableCell>Time Horizon</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {stressTestResults.map((result, index) => (
                              <TableRow key={index}>
                                <TableCell>{result.timestamp.toLocaleString()}</TableCell>
                                <TableCell>{result.scenario?.name || 'Unknown'}</TableCell>
                                <TableCell>
                                  <Typography color={result.pnl_impact < 0 ? 'error.main' : 'success.main'}>
                                    {formatCurrency(result.pnl_impact)}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography color={result.breakdown?.equity < 0 ? 'error.main' : 'success.main'}>
                                    {formatCurrency(result.breakdown?.equity || 0)}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography color={result.breakdown?.rates < 0 ? 'error.main' : 'success.main'}>
                                    {formatCurrency(result.breakdown?.rates || 0)}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography color={result.breakdown?.fx < 0 ? 'error.main' : 'success.main'}>
                                    {formatCurrency(result.breakdown?.fx || 0)}
                                  </Typography>
                                </TableCell>
                                <TableCell>{result.scenario?.time_horizon_days || result.time_horizon_days || 1} day(s)</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    No stress test results yet. Select a scenario and run a test.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Limit Dialog */}
      <Dialog open={limitDialog.open} onClose={() => setLimitDialog({ open: false, mode: 'create', data: {} })} maxWidth="md" fullWidth>
        <DialogTitle>
          {limitDialog.mode === 'create' ? 'Create Risk Limit' : 'Edit Risk Limit'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Limit Type</InputLabel>
                <Select
                  value={limitDialog.data.limit_type || ''}
                  onChange={(e) => setLimitDialog(prev => ({
                    ...prev,
                    data: { ...prev.data, limit_type: e.target.value }
                  }))}
                >
                  <MenuItem value="EXPOSURE">Exposure</MenuItem>
                  <MenuItem value="VAR">VaR</MenuItem>
                  <MenuItem value="PNL_MAX">Max P&L</MenuItem>
                  <MenuItem value="STRESS_LOSS">Stress Loss</MenuItem>
                  <MenuItem value="DV01">DV01</MenuItem>
                  <MenuItem value="CONVEXITY">Convexity</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Instrument Type</InputLabel>
                <Select
                  value={limitDialog.data.instrument_type || 'ALL'}
                  onChange={(e) => setLimitDialog(prev => ({
                    ...prev,
                    data: { ...prev.data, instrument_type: e.target.value }
                  }))}
                >
                  <MenuItem value="ALL">All Instruments</MenuItem>
                  <MenuItem value="BOND">Bonds</MenuItem>
                  <MenuItem value="EQUITY">Equities</MenuItem>
                  <MenuItem value="DERIVATIVE">Derivatives</MenuItem>
                  <MenuItem value="FX">FX</MenuItem>
                  <MenuItem value="COMMODITY">Commodities</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Limit Value"
                type="number"
                value={limitDialog.data.limit_value || ''}
                onChange={(e) => setLimitDialog(prev => ({
                  ...prev,
                  data: { ...prev.data, limit_value: parseFloat(e.target.value) }
                }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Time Horizon</InputLabel>
                <Select
                  value={limitDialog.data.time_horizon || 'DAILY'}
                  onChange={(e) => setLimitDialog(prev => ({
                    ...prev,
                    data: { ...prev.data, time_horizon: e.target.value }
                  }))}
                >
                  <MenuItem value="INTRADAY">Intraday</MenuItem>
                  <MenuItem value="DAILY">Daily</MenuItem>
                  <MenuItem value="WEEKLY">Weekly</MenuItem>
                  <MenuItem value="MONTHLY">Monthly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Breach Action</InputLabel>
                <Select
                  value={limitDialog.data.breach_action || 'ALERT'}
                  onChange={(e) => setLimitDialog(prev => ({
                    ...prev,
                    data: { ...prev.data, breach_action: e.target.value }
                  }))}
                >
                  <MenuItem value="ALERT">Alert Only</MenuItem>
                  <MenuItem value="RESTRICT">Restrict Trading</MenuItem>
                  <MenuItem value="BLOCK">Block Trading</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLimitDialog({ open: false, mode: 'create', data: {} })}>
            Cancel
          </Button>
          <Button onClick={handleLimitSubmit} variant="contained">
            {limitDialog.mode === 'create' ? 'Create' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
