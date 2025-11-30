import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Button, 
  Divider, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  TextField, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Tabs,
  Tab,
  useTheme,
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import { gridSpacing } from 'store/constant';
import MainCard from 'ui-component/cards/MainCard';
import { 
  getSimulationResults,
  getAvailableStrategies,
  saveSimulation,
  getSavedSimulations,
  deleteSimulation
} from 'services/simulationService';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AddIcon from '@mui/icons-material/Add';
import DateRangeIcon from '@mui/icons-material/DateRange';
// import StrategyEditor from '../../../components/simulation/StrategyEditor';
// import ParameterSlider from '../../../components/simulation/ParameterSlider';

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

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

const SimulationPage = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [strategies, setStrategies] = useState([]);
  const [selectedStrategy, setSelectedStrategy] = useState('');
  const [simulationParams, setSimulationParams] = useState({
    initialCapital: 10000,
    startDate: '2023-01-01',
    endDate: '2023-12-31',
    symbol: 'BTC/USD',
    timeframe: '1d',
  });
  const [strategyParams, setStrategyParams] = useState({});
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState({
    strategies: true,
    simulation: false,
  });
  const [savedSimulations, setSavedSimulations] = useState([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [simulationName, setSimulationName] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [simulationToDelete, setSimulationToDelete] = useState(null);

  // Load available strategies and saved simulations
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(prev => ({ ...prev, strategies: true }));
        
        const [strategiesData, savedSims] = await Promise.all([
          getAvailableStrategies(),
          getSavedSimulations()
        ]);
        
        setStrategies(strategiesData);
        setSavedSimulations(savedSims);
        
        // Select first strategy by default
        if (strategiesData.length > 0 && !selectedStrategy) {
          setSelectedStrategy(strategiesData[0].id);
          setStrategyParams(strategiesData[0].defaultParams || {});
        }
      } catch (error) {
        console.error('Error loading simulation data:', error);
      } finally {
        setIsLoading(prev => ({ ...prev, strategies: false }));
      }
    };

    loadData();
  }, []);

  const handleStrategyChange = (event) => {
    const strategyId = event.target.value;
    setSelectedStrategy(strategyId);
    
    // Set default parameters for the selected strategy
    const strategy = strategies.find(s => s.id === strategyId);
    if (strategy) {
      setStrategyParams(strategy.defaultParams || {});
    }
  };

  const handleParamChange = (param, value) => {
    setStrategyParams(prev => ({
      ...prev,
      [param]: value
    }));
  };

  const runSimulation = async () => {
    if (!selectedStrategy) return;
    
    try {
      setIsLoading(prev => ({ ...prev, simulation: true }));
      
      const simulationData = {
        strategy: selectedStrategy,
        params: strategyParams,
        ...simulationParams
      };
      
      const result = await getSimulationResults(simulationData);
      setResults(result);
    } catch (error) {
      console.error('Error running simulation:', error);
    } finally {
      setIsLoading(prev => ({ ...prev, simulation: false }));
    }
  };

  const handleSaveSimulation = async () => {
    if (!simulationName.trim()) return;
    
    try {
      const simulationData = {
        name: simulationName,
        strategy: selectedStrategy,
        params: strategyParams,
        simulationParams,
        results,
        timestamp: new Date().toISOString()
      };
      
      await saveSimulation(simulationData);
      setSavedSimulations(await getSavedSimulations());
      setSaveDialogOpen(false);
      setSimulationName('');
    } catch (error) {
      console.error('Error saving simulation:', error);
    }
  };

  const handleLoadSimulation = (simulation) => {
    setSelectedStrategy(simulation.strategy);
    setStrategyParams(simulation.params);
    setSimulationParams(simulation.simulationParams);
    setResults(simulation.results);
    setTabValue(1); // Switch to results tab
  };

  const handleDeleteSimulation = async () => {
    if (!simulationToDelete) return;
    
    try {
      await deleteSimulation(simulationToDelete.id);
      setSavedSimulations(await getSavedSimulations());
      setDeleteConfirmOpen(false);
      setSimulationToDelete(null);
    } catch (error) {
      console.error('Error deleting simulation:', error);
    }
  };

  const renderStrategyParams = () => {
    if (!selectedStrategy) return null;
    
    const strategy = strategies.find(s => s.id === selectedStrategy);
    if (!strategy) return null;
    
    return (
      <Grid container spacing={2} sx={{ mt: 2 }}>
        {strategy.parameters?.map(param => (
          <Grid item xs={12} sm={6} md={4} key={param.name}>
            {param.type === 'number' ? (
              <ParameterSlider
                label={param.label || param.name}
                value={strategyParams[param.name] || param.defaultValue}
                min={param.min}
                max={param.max}
                step={param.step || 1}
                onChange={(value) => handleParamChange(param.name, value)}
              />
            ) : (
              <TextField
                fullWidth
                label={param.label || param.name}
                type={param.type}
                value={strategyParams[param.name] || param.defaultValue || ''}
                onChange={(e) => handleParamChange(param.name, e.target.value)}
                select={param.type === 'select'}
              >
                {param.options?.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderResults = () => {
    if (!results) return null;
    
    return (
      <Box sx={{ mt: 3 }}>
        <Grid container spacing={gridSpacing}>
          {/* Performance Summary */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>Performance Summary</Typography>
              <Divider sx={{ mb: 2 }} />
              <Box>
                <Typography variant="body2">
                  Initial Capital: <strong>${results.initialCapital?.toLocaleString()}</strong>
                </Typography>
                <Typography variant="body2">
                  Final Balance: <strong>${results.finalBalance?.toLocaleString()}</strong>
                </Typography>
                <Typography variant="body2" color={results.profitLoss >= 0 ? 'success.main' : 'error.main'}>
                  Profit/Loss: <strong>{results.profitLoss >= 0 ? '+' : ''}{results.profitLoss?.toFixed(2)}%</strong>
                </Typography>
                <Typography variant="body2">
                  Total Trades: <strong>{results.totalTrades}</strong>
                </Typography>
                <Typography variant="body2" color={results.winRate >= 50 ? 'success.main' : 'error.main'}>
                  Win Rate: <strong>{results.winRate?.toFixed(1)}%</strong>
                </Typography>
                <Typography variant="body2">
                  Max Drawdown: <strong>{results.maxDrawdown?.toFixed(2)}%</strong>
                </Typography>
                <Typography variant="body2">
                  Sharpe Ratio: <strong>{results.sharpeRatio?.toFixed(2)}</strong>
                </Typography>
              </Box>
            </Paper>
          </Grid>
          
          {/* Equity Curve */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>Equity Curve</Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={results.equityCurve}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="equity" 
                      name="Equity" 
                      stroke={theme.palette.primary.main} 
                      dot={false} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
          
          {/* Trades Table */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Trades</Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<SaveIcon />}
                  onClick={() => setSaveDialogOpen(true)}
                >
                  Save Simulation
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Symbol</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Side</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>P&L</TableCell>
                      <TableCell>P&L %</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {results.trades?.map((trade, index) => (
                      <TableRow key={index}>
                        <TableCell>{new Date(trade.date).toLocaleString()}</TableCell>
                        <TableCell>{trade.symbol}</TableCell>
                        <TableCell>{trade.type}</TableCell>
                        <TableCell>{trade.side}</TableCell>
                        <TableCell>${trade.price?.toFixed(2)}</TableCell>
                        <TableCell>{trade.amount?.toFixed(4)}</TableCell>
                        <TableCell style={{ color: trade.profitLoss >= 0 ? theme.palette.success.main : theme.palette.error.main }}>
                          {trade.profitLoss >= 0 ? '+' : ''}{trade.profitLoss?.toFixed(2)}
                        </TableCell>
                        <TableCell style={{ color: trade.profitLossPercent >= 0 ? theme.palette.success.main : theme.palette.error.main }}>
                          {trade.profitLossPercent >= 0 ? '+' : ''}{trade.profitLossPercent?.toFixed(2)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  return (
    <MainCard title="Trading Simulation">
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={(e, newValue) => setTabValue(newValue)}
            aria-label="simulation tabs"
          >
            <Tab label="New Simulation" />
            <Tab label="Saved Simulations" disabled={savedSimulations.length === 0} />
            <Tab label="Strategy Editor" />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Strategy</InputLabel>
                  <Select
                    value={selectedStrategy}
                    onChange={handleStrategyChange}
                    label="Strategy"
                    disabled={isLoading.strategies || strategies.length === 0}
                  >
                    {strategies.map(strategy => (
                      <MenuItem key={strategy.id} value={strategy.id}>
                        {strategy.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  label="Initial Capital"
                  type="number"
                  size="small"
                  value={simulationParams.initialCapital}
                  onChange={(e) => setSimulationParams(prev => ({
                    ...prev,
                    initialCapital: parseFloat(e.target.value) || 0
                  }))}
                />
              </Grid>
              
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={simulationParams.startDate}
                  onChange={(e) => setSimulationParams(prev => ({
                    ...prev,
                    startDate: e.target.value
                  }))}
                />
              </Grid>
              
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={simulationParams.endDate}
                  onChange={(e) => setSimulationParams(prev => ({
                    ...prev,
                    endDate: e.target.value
                  }))}
                />
              </Grid>
              
              <Grid item xs={12} md={3} sx={{ textAlign: 'right' }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<PlayArrowIcon />}
                  onClick={runSimulation}
                  disabled={!selectedStrategy || isLoading.simulation}
                >
                  {isLoading.simulation ? 'Running...' : 'Run Simulation'}
                </Button>
              </Grid>
            </Grid>
            
            {selectedStrategy && renderStrategyParams()}
            
            {isLoading.simulation && (
              <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress />
              </Box>
            )}
            
            {results && renderResults()}
          </Paper>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Saved Simulations</Typography>
            <Divider sx={{ mb: 2 }} />
            
            {savedSimulations.length === 0 ? (
              <Typography variant="body1" color="textSecondary" align="center" sx={{ py: 4 }}>
                No saved simulations found.
              </Typography>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Strategy</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Return</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {savedSimulations.map((sim, index) => (
                      <TableRow key={index} hover>
                        <TableCell>{sim.name}</TableCell>
                        <TableCell>{sim.strategy}</TableCell>
                        <TableCell>{new Date(sim.timestamp).toLocaleString()}</TableCell>
                        <TableCell style={{ 
                          color: sim.results.profitLoss >= 0 ? theme.palette.success.main : theme.palette.error.main 
                        }}>
                          {sim.results.profitLoss >= 0 ? '+' : ''}{sim.results.profitLoss?.toFixed(2)}%
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Load Simulation">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleLoadSimulation(sim)}
                            >
                              <PlayArrowIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => {
                                setSimulationToDelete(sim);
                                setDeleteConfirmOpen(true);
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5">Strategy Editor - Coming Soon</Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
              Cette fonctionnalité sera disponible prochainement.
            </Typography>
          </Paper>
        </TabPanel>
      </Box>
      
      {/* Save Simulation Dialog */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
        <DialogTitle>Save Simulation</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Simulation Name"
            type="text"
            fullWidth
            value={simulationName}
            onChange={(e) => setSimulationName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveSimulation} 
            color="primary"
            disabled={!simulationName.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteConfirmOpen} 
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the simulation "{simulationToDelete?.name}"?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDeleteSimulation} 
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
};

export default SimulationPage;
