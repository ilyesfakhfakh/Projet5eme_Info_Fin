import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Divider,
  Chip,
  Button,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
} from '@mui/material';
import { 
  ArrowBack, 
  Refresh, 
  BarChart, 
  ShowChart, 
  Timeline, 
  AttachMoney, 
  TrendingUp, 
  TrendingDown,
  CheckCircle,
  Cancel,
  Info,
  Warning
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { getSimulationById } from 'api/simulationService';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Bar,
  BarChart,
  Cell
} from 'recharts';

const TabPanel = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simulation-tabpanel-${index}`}
      aria-labelledby={`simulation-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const SimulationDetail = () => {
  const theme = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [chartData, setChartData] = useState([]);

  const fetchSimulation = async () => {
    try {
      setLoading(true);
      const data = await getSimulationById(id);
      setSimulation(data);
      
      // Prepare chart data if available
      if (data.equityCurve && data.equityCurve.length > 0) {
        setChartData(data.equityCurve);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching simulation:', err);
      setError('Failed to load simulation details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchSimulation();
    }
  }, [id]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleBack = () => {
    navigate('/simulations');
  };

  const handleRefresh = () => {
    fetchSimulation();
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${value?.toFixed(2)}%`;
  };

  const renderStatusChip = (status) => {
    let icon = null;
    let color = 'default';
    
    switch (status?.toLowerCase()) {
      case 'completed':
        icon = <CheckCircle fontSize="small" sx={{ mr: 0.5 }} />;
        color = 'success';
        break;
      case 'running':
        icon = <CircularProgress size={14} sx={{ mr: 0.5 }} />;
        color = 'info';
        break;
      case 'failed':
        icon = <Cancel fontSize="small" sx={{ mr: 0.5 }} />;
        color = 'error';
        break;
      case 'pending':
        icon = <HourglassEmpty fontSize="small" sx={{ mr: 0.5 }} />;
        color = 'warning';
        break;
      default:
        icon = <Info fontSize="small" sx={{ mr: 0.5 }} />;
    }
    
    return (
      <Chip
        icon={icon}
        label={status?.charAt(0).toUpperCase() + status?.slice(1) || 'N/A'}
        color={color}
        variant="outlined"
        size="small"
      />
    );
  };

  if (loading && !simulation) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" p={3}>
        <Typography color="error" gutterBottom>{error}</Typography>
        <Button 
          variant="outlined" 
          color="primary" 
          onClick={handleRefresh}
          startIcon={<Refresh />}
        >
          Retry
        </Button>
      </Box>
    );
  }

  if (!simulation) {
    return (
      <Box textAlign="center" p={3}>
        <Typography variant="h6" gutterBottom>Simulation not found</Typography>
        <Button 
          variant="outlined" 
          color="primary" 
          onClick={handleBack}
          startIcon={<ArrowBack />}
        >
          Back to Simulations
        </Button>
      </Box>
    );
  }

  const {
    name,
    symbol,
    strategy,
    timeframe,
    status,
    startDate,
    endDate,
    initialCapital,
    finalCapital,
    profitLoss,
    profitLossPercent,
    winRate,
    maxDrawdown,
    sharpeRatio,
    totalTrades,
    winningTrades,
    losingTrades,
    averageWin,
    averageLoss,
    largestWin,
    largestLoss,
    parameters = {},
    trades = [],
  } = simulation;

  const isProfitable = profitLoss >= 0;
  const profitLossColor = isProfitable ? 'success.main' : 'error.main';

  // Prepare metrics for the summary cards
  const summaryMetrics = [
    {
      title: 'Initial Capital',
      value: formatCurrency(initialCapital),
      icon: <AttachMoney color="primary" />,
      color: theme.palette.primary.main,
    },
    {
      title: 'Final Balance',
      value: formatCurrency(finalCapital),
      icon: <AttachMoney color="success" />,
      color: theme.palette.success.main,
    },
    {
      title: 'Profit/Loss',
      value: formatCurrency(profitLoss),
      subValue: formatPercentage(profitLossPercent),
      icon: isProfitable ? <TrendingUp color="success" /> : <TrendingDown color="error" />,
      color: isProfitable ? theme.palette.success.main : theme.palette.error.main,
    },
    {
      title: 'Win Rate',
      value: `${winRate?.toFixed(1)}%`,
      subValue: `${winningTrades || 0}W / ${losingTrades || 0}L`,
      icon: <BarChart color="info" />,
      color: theme.palette.info.main,
    },
  ];

  // Prepare key metrics for the list
  const keyMetrics = [
    { label: 'Max Drawdown', value: `${maxDrawdown?.toFixed(2)}%` },
    { label: 'Sharpe Ratio', value: sharpeRatio?.toFixed(2) },
    { label: 'Total Trades', value: totalTrades || 0 },
    { label: 'Average Win', value: averageWin ? `+${averageWin.toFixed(2)}%` : 'N/A' },
    { label: 'Average Loss', value: averageLoss ? `${averageLoss.toFixed(2)}%` : 'N/A' },
    { label: 'Largest Win', value: largestWin ? `+${largestWin.toFixed(2)}%` : 'N/A' },
    { label: 'Largest Loss', value: largestLoss ? `${largestLoss.toFixed(2)}%` : 'N/A' },
  ];

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={handleBack} sx={{ mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" component="h1">
          {name || 'Simulation Details'}
        </Typography>
        <Box flexGrow={1} />
        <Button 
          variant="outlined" 
          startIcon={<Refresh />}
          onClick={handleRefresh}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
        {summaryMetrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {metric.title}
                    </Typography>
                    <Typography variant="h5" style={{ color: metric.color }}>
                      {metric.value}
                    </Typography>
                    {metric.subValue && (
                      <Typography variant="body2" color="textSecondary">
                        {metric.subValue}
                      </Typography>
                    )}
                  </Box>
                  <Box
                    sx={{
                      backgroundColor: `${metric.color}20`,
                      borderRadius: '50%',
                      width: 48,
                      height: 48,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {React.cloneElement(metric.icon, { style: { fontSize: 24 } })}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Left Column - Details and Parameters */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardHeader 
              title="Simulation Details" 
              titleTypographyProps={{ variant: 'h6' }}
            />
            <Divider />
            <List>
              <ListItem>
                <ListItemIcon>
                  <ShowChart color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Symbol" 
                  secondary={
                    <Chip 
                      label={symbol || 'N/A'} 
                      size="small" 
                      variant="outlined" 
                    />
                  } 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Timeline color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Strategy" 
                  secondary={
                    <Chip 
                      label={strategy || 'Custom Strategy'} 
                      size="small" 
                      variant="outlined" 
                      color="primary"
                    />
                  } 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <BarChart color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Timeframe" 
                  secondary={
                    <Chip 
                      label={timeframe || 'N/A'} 
                      size="small" 
                      variant="outlined" 
                    />
                  } 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Info color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Status" 
                  secondary={renderStatusChip(status)} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Date Range" 
                  secondary={
                    <Box>
                      <div>Start: {startDate ? format(new Date(startDate), 'MMM d, yyyy') : 'N/A'}</div>
                      <div>End: {endDate ? format(new Date(endDate), 'MMM d, yyyy') : 'N/A'}</div>
                    </Box>
                  } 
                />
              </ListItem>
            </List>
          </Card>

          <Card>
            <CardHeader 
              title="Strategy Parameters" 
              titleTypographyProps={{ variant: 'h6' }}
            />
            <Divider />
            <List>
              {Object.keys(parameters).length > 0 ? (
                Object.entries(parameters).map(([key, value]) => (
                  <ListItem key={key}>
                    <ListItemText 
                      primary={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} 
                      secondary={value?.toString() || 'N/A'}
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText 
                    primary="No parameters available" 
                    secondary="This simulation doesn't have any specific parameters."
                  />
                </ListItem>
              )}
            </List>
          </Card>
        </Grid>

        {/* Right Column - Charts and Tabs */}
        <Grid item xs={12} md={8}>
          <Card>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="Equity Curve" icon={<ShowChart />} />
              <Tab label="Trades" icon={<Timeline />} />
              <Tab label="Performance" icon={<BarChart />} />
              <Tab label="Key Metrics" icon={<Info />} />
            </Tabs>
            <Divider />
            
            <TabPanel value={activeTab} index={0}>
              <Box height={400}>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => format(new Date(value), 'MMM d')}
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(value), 'Equity']}
                        labelFormatter={(value) => `Date: ${format(new Date(value), 'PPpp')}`}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="equity"
                        name="Equity"
                        stroke={theme.palette.primary.main}
                        activeDot={{ r: 8 }}
                        dot={false}
                      />
                      {simulation.balance && (
                        <Line
                          type="monotone"
                          dataKey="balance"
                          name="Balance"
                          stroke={theme.palette.success.main}
                          dot={false}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <Box 
                    display="flex" 
                    justifyContent="center" 
                    alignItems="center" 
                    height="100%"
                    color="text.secondary"
                  >
                    <Typography>No chart data available</Typography>
                  </Box>
                )}
              </Box>
            </TabPanel>
            
            <TabPanel value={activeTab} index={1}>
              <Box height={400} overflow="auto">
                {trades && trades.length > 0 ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Side</TableCell>
                          <TableCell>Price</TableCell>
                          <TableCell>Quantity</TableCell>
                          <TableCell>P&L</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {trades.map((trade, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {trade.entryTime ? format(new Date(trade.entryTime), 'MMM d, HH:mm') : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={trade.side?.toUpperCase() || 'N/A'} 
                                size="small" 
                                color={trade.side === 'buy' ? 'success' : 'error'}
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>{formatCurrency(trade.entryPrice)}</TableCell>
                            <TableCell>{trade.quantity?.toFixed(4)}</TableCell>
                            <TableCell 
                              style={{
                                color: trade.pnl >= 0 
                                  ? theme.palette.success.main 
                                  : theme.palette.error.main
                              }}
                            >
                              {formatCurrency(trade.pnl)}
                              {trade.pnlPercent && (
                                <Typography variant="caption" display="block">
                                  {formatPercentage(trade.pnlPercent)}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              {renderStatusChip(trade.status)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Box 
                    display="flex" 
                    justifyContent="center" 
                    alignItems="center" 
                    height="100%"
                    color="text.secondary"
                  >
                    <Typography>No trade data available</Typography>
                  </Box>
                )}
              </Box>
            </TabPanel>
            
            <TabPanel value={activeTab} index={2}>
              <Box height={400}>
                {trades && trades.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        {
                          name: 'Wins',
                          value: winningTrades || 0,
                          color: theme.palette.success.main,
                        },
                        {
                          name: 'Losses',
                          value: losingTrades || 0,
                          color: theme.palette.error.main,
                        },
                        {
                          name: 'Avg Win',
                          value: averageWin || 0,
                          color: theme.palette.success.light,
                        },
                        {
                          name: 'Avg Loss',
                          value: Math.abs(averageLoss) || 0,
                          color: theme.palette.error.light,
                        },
                      ]}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === 'Wins' || name === 'Losses') {
                            return [value, name];
                          }
                          return [`${value}%`, name];
                        }}
                      />
                      <Bar dataKey="value">
                        {[
                          theme.palette.success.main,
                          theme.palette.error.main,
                          theme.palette.success.light,
                          theme.palette.error.light,
                        ].map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box 
                    display="flex" 
                    justifyContent="center" 
                    alignItems="center" 
                    height="100%"
                    color="text.secondary"
                  >
                    <Typography>No performance data available</Typography>
                  </Box>
                )}
              </Box>
            </TabPanel>
            
            <TabPanel value={activeTab} index={3}>
              <Grid container spacing={2}>
                {keyMetrics.map((metric, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 2,
                        height: '100%',
                        borderLeft: `4px solid ${theme.palette.primary.main}`
                      }}
                    >
                      <Typography variant="subtitle2" color="textSecondary">
                        {metric.label}
                      </Typography>
                      <Typography variant="h6">
                        {metric.value}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </TabPanel>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SimulationDetail;
