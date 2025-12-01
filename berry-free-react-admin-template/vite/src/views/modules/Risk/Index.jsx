import React, { useState, useEffect, useRef } from 'react';
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
  Tooltip,
  Badge,
  Snackbar,
  Fab,
  Divider
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
  PlayArrow,
  Notifications,
  Assessment,
  Timeline,
  PieChart,
  BarChart,
  ShowChart,
  Settings,
  CheckCircle,
  Error,
  Info
} from '@mui/icons-material';
import MainCard from 'ui-component/cards/MainCard';
import http from '../../../api/http';
import wsService from '../../../api/websocket';
import { listPortfolios } from '../../../api/portfolios';
import {
  getExposure,
  getRiskMetrics,
  getLimits,
  getAlerts,
  getStressScenarios,
  calculateVaR,
  runRiskAssessment,
  monitorRiskLimits
} from '../../../api/risk';
import {
  ExposureBreakdownChart,
  PnLVsLimitsChart,
  VaRTrendChart,
  StressTestImpactChart,
  RiskMetricsGauge
} from '../../../components/charts/RiskCharts';

export default function RiskPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [exposureData, setExposureData] = useState(null);
  const [exposureBreakdown, setExposureBreakdown] = useState([]);
  const [riskMetrics, setRiskMetrics] = useState([]);
  const [varHistory, setVarHistory] = useState([]);
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
  const [wsConnected, setWsConnected] = useState(false);
  const [realTimeAlerts, setRealTimeAlerts] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const wsInitialized = useRef(false);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!wsInitialized.current && user?.token) {
      wsInitialized.current = true;

      // Get token for WebSocket auth
      const token = localStorage.getItem('auth');
      const parsed = token ? JSON.parse(token) : null;
      const wsToken = parsed?.token;

      wsService.connect(wsToken);

      // Set up WebSocket event listeners
      wsService.on('connected', () => {
        setWsConnected(true);
        console.log('✅ WebSocket connected for risk alerts');
        wsService.subscribeToRiskAlerts(user?.user_id);
      });

      wsService.on('disconnected', () => {
        setWsConnected(false);
        console.log('❌ WebSocket disconnected');
      });

      wsService.on('risk_alert_triggered', (alertData) => {
        console.log('🚨 Real-time risk alert:', alertData);
        setRealTimeAlerts(prev => [alertData, ...prev.slice(0, 9)]); // Keep last 10 alerts
        setSnackbar({
          open: true,
          message: `Risk Alert: ${alertData.description || alertData.alert_type}`,
          severity: alertData.severity === 'CRITICAL' ? 'error' : 'warning'
        });
        // Refresh alerts list
        loadAlerts();
      });

      wsService.on('error', (error) => {
        console.error('WebSocket error:', error);
        setWsConnected(false);
      });
    }

    return () => {
      // Cleanup WebSocket listeners on unmount
      if (wsInitialized.current) {
        wsService.off('connected');
        wsService.off('disconnected');
        wsService.off('risk_alert_triggered');
        wsService.off('error');
      }
    };
  }, [user]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedPortfolio) {
      loadData();
    }
  }, [selectedPortfolio]);

  const loadAlerts = async () => {
    try {
      const alertsRes = await getAlerts({ portfolio_id: selectedPortfolio });
      if (alertsRes.success) {
        setAlerts(alertsRes.data);
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  };

  const processExposureBreakdown = (exposure) => {
    if (!exposure) return [];

    // Mock breakdown by trader/desk/product - in real app this would come from API
    const breakdown = [
      { label: 'Trader A', value: exposure.gross_long * 0.4 },
      { label: 'Trader B', value: exposure.gross_long * 0.35 },
      { label: 'Desk Alpha', value: exposure.gross_long * 0.15 },
      { label: 'Desk Beta', value: exposure.gross_long * 0.1 },
    ];

    return breakdown.filter(item => item.value > 0);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Load portfolios first (filtered by user)
      console.log('🔄 Loading risk dashboard data...');
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
          selectedPortfolio ? getExposure({ portfolio_id: selectedPortfolio }) : getExposure(),
          selectedPortfolio ? getRiskMetrics({ portfolio_id: selectedPortfolio }) : getRiskMetrics(),
          getLimits(),
          getAlerts(),
          getStressScenarios()
        ];

        const [exposureRes, metricsRes, limitsRes, alertsRes, scenariosRes] = await Promise.all(riskPromises);

        console.log('📊 Risk data loaded:');
        console.log('- Exposure:', exposureRes.success ? '✅' : '❌', exposureRes.data);
        console.log('- Metrics:', metricsRes.success ? '✅' : '❌', metricsRes.data?.length || 0, 'records');
        console.log('- Limits:', limitsRes.success ? '✅' : '❌', limitsRes.data?.length || 0, 'records');
        console.log('- Alerts:', alertsRes.success ? '✅' : '❌', alertsRes.data?.length || 0, 'records');
        console.log('- Scenarios:', scenariosRes.success ? '✅' : '❌', scenariosRes.data?.length || 0, 'records');

        if (exposureRes.success) {
          setExposureData(exposureRes.data);
          setExposureBreakdown(processExposureBreakdown(exposureRes.data));
        }
        if (metricsRes.success) {
          setRiskMetrics(metricsRes.data);
          // Generate mock VaR history for chart
          const mockVarHistory = metricsRes.data
            .filter(m => m.metric_type === 'VAR_95')
            .map((metric, index) => ({
              timestamp: new Date(Date.now() - (9 - index) * 3600000).toISOString(), // Last 10 hours
              value: metric.value + (Math.random() - 0.5) * 1000 // Add some variation
            }));
          setVarHistory(mockVarHistory);
        }
        if (limitsRes.success) setLimits(limitsRes.data);
        if (alertsRes.success) setAlerts(alertsRes.data);
        if (scenariosRes.success) setStressScenarios(scenariosRes.data);

        // If we have a selected portfolio but no risk metrics, calculate them automatically
        if (selectedPortfolio && metricsRes.success && (!metricsRes.data || metricsRes.data.length === 0)) {
          console.log('⚠️ No risk metrics found, calculating automatically...');
          try {
            const assessmentResult = await runRiskAssessment({ portfolio_id: selectedPortfolio });
            console.log('✅ Risk assessment completed:', assessmentResult);
            // Reload metrics after calculation
            const newMetricsRes = await getRiskMetrics({ portfolio_id: selectedPortfolio });
            if (newMetricsRes.success) {
              setRiskMetrics(newMetricsRes.data);
              console.log('📊 Risk metrics updated:', newMetricsRes.data?.length || 0, 'records');
            }
          } catch (calcError) {
            console.error('❌ Error auto-calculating risk metrics:', calcError);
          }
        }

        // Run risk monitoring to check for limit breaches and generate alerts
        if (selectedPortfolio) {
          try {
            console.log('🔍 Running risk monitoring for portfolio:', selectedPortfolio);
            const monitorResult = await monitorRiskLimits({ portfolio_id: selectedPortfolio });
            console.log('✅ Risk monitoring completed:', monitorResult);
            // Reload alerts after monitoring
            const newAlertsRes = await getAlerts({ portfolio_id: selectedPortfolio });
            if (newAlertsRes.success) {
              setAlerts(newAlertsRes.data);
              console.log('🚨 Alerts updated:', newAlertsRes.data?.length || 0, 'alerts');
            }
          } catch (monitorError) {
            console.error('❌ Error running risk monitoring:', monitorError);
          }
        }

        // Log any failed requests
        [exposureRes, metricsRes, limitsRes, alertsRes, scenariosRes].forEach((res, index) => {
          if (res.error) {
            console.error(`Risk API ${['exposure', 'metrics', 'limits', 'alerts', 'scenarios'][index]} failed:`, res.error);
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

  const handleCalculateVaR = async () => {
    if (!selectedPortfolio) {
      alert('Please select a portfolio first');
      return;
    }
    try {
      const response = await calculateVaR({
        portfolio_id: selectedPortfolio,
        confidence: 0.95,
        time_horizon: 1
      });
      if (response && response.success) {
        loadData(); // Refresh metrics
      } else {
        console.error('VaR calculation failed:', response);
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
      {/* Header with Connection Status */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h4">Risk Management Dashboard</Typography>
          <Chip
            icon={wsConnected ? <CheckCircle /> : <Error />}
            label={wsConnected ? "Live" : "Offline"}
            color={wsConnected ? "success" : "error"}
            size="small"
            variant="outlined"
          />
          {realTimeAlerts.length > 0 && (
            <Badge badgeContent={realTimeAlerts.length} color="error">
              <Notifications color="action" />
            </Badge>
          )}
        </Box>
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

      {/* Real-time Alerts Banner */}
      {realTimeAlerts.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Recent Risk Alerts:
          </Typography>
          {realTimeAlerts.slice(0, 3).map((alert, index) => (
            <Typography key={index} variant="body2">
              • {alert.description || alert.alert_type} ({new Date(alert.timestamp).toLocaleTimeString()})
            </Typography>
          ))}
        </Alert>
      )}

      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab icon={<Assessment />} label="Dashboard" />
        <Tab icon={<Settings />} label="Limits Management" />
        <Tab icon={<Notifications />} label="Alerts & Monitoring" />
        <Tab icon={<Timeline />} label="Stress Testing" />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Key Risk Metrics Cards */}
          <Grid item xs={12} md={3}>
            <RiskMetricsGauge
              value={riskMetrics.find(m => m.metric_type === 'VAR_95')?.value || 0}
              maxValue={limits.find(l => l.limit_type === 'VAR')?.limit_value || 10000}
              title="VaR (95%)"
              color="warning"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <RiskMetricsGauge
              value={exposureData?.net || 0}
              maxValue={limits.find(l => l.limit_type === 'EXPOSURE')?.limit_value || 100000}
              title="Net Exposure"
              color="primary"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <RiskMetricsGauge
              value={Math.abs(exposureData?.net || 0)}
              maxValue={limits.find(l => l.limit_type === 'PNL_MAX')?.limit_value || 50000}
              title="P&L at Risk"
              color="error"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="success.main" gutterBottom>
                  Portfolio Health
                </Typography>
                <Typography variant="h4" color="success.main">
                  {alerts.filter(a => a.status === 'ACTIVE' && a.severity === 'CRITICAL').length === 0 ? 'Good' : 'At Risk'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {alerts.filter(a => a.status === 'ACTIVE').length} active alerts
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Charts Row */}
          <Grid item xs={12} md={6}>
            <ExposureBreakdownChart data={exposureBreakdown} />
          </Grid>
          <Grid item xs={12} md={6}>
            <VaRTrendChart varData={varHistory} />
          </Grid>

          {/* P&L vs Limits Chart */}
          <Grid item xs={12} md={6}>
            <PnLVsLimitsChart
              pnl={exposureData?.net || 0}
              limits={{ pnlLimit: limits.find(l => l.limit_type === 'PNL_MAX')?.limit_value }}
            />
          </Grid>

          {/* Risk Actions */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Risk Management Actions
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Button
                    variant="outlined"
                    startIcon={<Assessment />}
                    onClick={handleCalculateVaR}
                    disabled={!selectedPortfolio}
                  >
                    Recalculate VaR
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Shield />}
                    onClick={async () => {
                      if (!selectedPortfolio) return;
                      try {
                        await runRiskAssessment({ portfolio_id: selectedPortfolio });
                        loadData();
                      } catch (error) {
                        console.error('Error running risk assessment:', error);
                      }
                    }}
                    disabled={!selectedPortfolio}
                  >
                    Full Risk Assessment
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={async () => {
                      if (!selectedPortfolio) return;
                      try {
                        await monitorRiskLimits({ portfolio_id: selectedPortfolio });
                        loadAlerts();
                      } catch (error) {
                        console.error('Error monitoring limits:', error);
                      }
                    }}
                    disabled={!selectedPortfolio}
                  >
                    Check Limits
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Active Alerts Summary */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Active Risk Alerts</Typography>
                  <Chip
                    label={`${alerts.filter(a => a.status === 'ACTIVE').length} active`}
                    color={alerts.filter(a => a.status === 'ACTIVE').length > 0 ? 'error' : 'success'}
                    size="small"
                  />
                </Box>
                {alerts.filter(a => a.status === 'ACTIVE').length > 0 ? (
                  <Box>
                    {alerts.filter(a => a.status === 'ACTIVE').slice(0, 5).map((alert) => (
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
                        <Typography variant="subtitle2">{alert.alert_type}</Typography>
                        <Typography variant="body2">
                          {alert.description || `Current: ${formatCurrency(alert.current_value)}, Limit: ${formatCurrency(alert.limit_value)}`}
                        </Typography>
                      </Alert>
                    ))}
                    {alerts.filter(a => a.status === 'ACTIVE').length > 5 && (
                      <Button size="small" onClick={() => setActiveTab(2)}>
                        View All Alerts ({alerts.filter(a => a.status === 'ACTIVE').length})
                      </Button>
                    )}
                  </Box>
                ) : (
                  <Typography color="success.main">No active risk alerts</Typography>
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
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Stress Test Scenarios
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  {stressScenarios.map((scenario) => (
                    <Card
                      key={scenario.scenario_id}
                      variant={selectedScenario === scenario.scenario_id ? "outlined" : "elevation"}
                      sx={{
                        cursor: 'pointer',
                        borderColor: selectedScenario === scenario.scenario_id ? 'primary.main' : undefined
                      }}
                      onClick={() => setSelectedScenario(scenario.scenario_id)}
                    >
                      <CardContent sx={{ pb: '16px !important' }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {scenario.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {scenario.description}
                        </Typography>
                        <Typography variant="caption" color="primary">
                          {scenario.time_horizon_days || 1} day horizon
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
                {stressScenarios.length === 0 && (
                  <Typography variant="body2" color="textSecondary">
                    No stress scenarios available
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Run Stress Test & Results Chart */}
          <Grid item xs={12} md={8}>
            <Grid container spacing={2}>
              {/* Run Test Card */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="h6">Execute Stress Test</Typography>
                        {selectedScenario && (
                          <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                            Selected: {stressScenarios.find(s => s.scenario_id === selectedScenario)?.name}
                          </Typography>
                        )}
                      </Box>
                      <Button
                        variant="contained"
                        size="large"
                        onClick={runStressTest}
                        disabled={!selectedScenario || runningStressTest || !selectedPortfolio}
                        startIcon={runningStressTest ? <Refresh sx={{ animation: 'spin 1s linear infinite' }} /> : <PlayArrow />}
                      >
                        {runningStressTest ? 'Running...' : 'Run Stress Test'}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Results Visualization */}
              {stressTestResults.length > 0 && (
                <Grid item xs={12}>
                  <StressTestImpactChart
                    impactData={stressTestResults.map(result => ({
                      scenario: result.scenario?.name || 'Test',
                      equity: result.breakdown?.equity || 0,
                      rates: result.breakdown?.rates || 0,
                      fx: result.breakdown?.fx || 0,
                      total: result.pnl_impact || 0,
                    }))}
                  />
                </Grid>
              )}

              {/* Detailed Results Table */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Detailed Results
                    </Typography>
                    {stressTestResults.length > 0 ? (
                      <TableContainer component={Paper}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Time</TableCell>
                              <TableCell>Scenario</TableCell>
                              <TableCell align="right">Total P&L Impact</TableCell>
                              <TableCell align="right">Equity</TableCell>
                              <TableCell align="right">Rates</TableCell>
                              <TableCell align="right">FX</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {stressTestResults.map((result, index) => (
                              <TableRow key={index}>
                                <TableCell>{result.timestamp.toLocaleString()}</TableCell>
                                <TableCell>{result.scenario?.name || 'Unknown'}</TableCell>
                                <TableCell align="right">
                                  <Typography color={result.pnl_impact < 0 ? 'error.main' : 'success.main'}>
                                    {formatCurrency(result.pnl_impact)}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography color={result.breakdown?.equity < 0 ? 'error.main' : 'success.main'}>
                                    {formatCurrency(result.breakdown?.equity || 0)}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography color={result.breakdown?.rates < 0 ? 'error.main' : 'success.main'}>
                                    {formatCurrency(result.breakdown?.rates || 0)}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography color={result.breakdown?.fx < 0 ? 'error.main' : 'success.main'}>
                                    {formatCurrency(result.breakdown?.fx || 0)}
                                  </Typography>
                                </TableCell>
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

      {/* Real-time Alert Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
