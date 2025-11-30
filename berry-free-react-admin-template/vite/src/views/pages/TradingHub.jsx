import { useState, useEffect } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, Tabs, Tab, Button, TextField, Select,
  MenuItem, FormControl, InputLabel, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, Alert, CircularProgress, Paper, Divider,
  Stack, AppBar, Toolbar, Badge, Dialog, DialogTitle, DialogContent, DialogActions,
  ToggleButton, ToggleButtonGroup
} from '@mui/material';
import {
  Add, Delete, Refresh, PlayArrow, TrendingUp, TrendingDown, AccountBalance,
  Assessment, CleaningServices, RestartAlt, Search, Edit, History, CheckCircle,
  Cancel, SwapHoriz, LibraryBooks, MenuBook, ShowChart, InfoOutlined
} from '@mui/icons-material';

// Order Book API imports
import {
  placeOrder, cancelOrder as cancelOrderBook, getOrderBook, getOrderExecutions,
  getBestBid, getBestAsk, getMarketDepth, getSpread, getTopOfBook, getMarketSnapshot,
  purgeStaleOrders, reopenOrder, cancelExpiredOrders, forceMatchNow
} from '../../api/orderBook';

// Orders Management API imports
import {
  createOrder, getOrders, getOrderById, updateOrder, deleteOrder, replaceOrder,
  cancelAllOrders, getOpenOrders, getOrderHistory, getOrderFillRatio
} from '../../api/orders';

// Portfolios & Assets API imports
import { getPortfolios } from '../../api/portfolios';
import { getAssets } from '../../api/assets';

// Order Executions API imports
import {
  createOrderExecution, getAllOrderExecutions, getOrderExecutionById,
  updateOrderExecution, deleteOrderExecution, getExecutionsInRange,
  getExecutionVWAP, getLastTrade, aggregateExecutionsByOrder
} from '../../api/orderExecutions';

// Trading Strategies API imports
import {
  createTradingStrategy, getAllTradingStrategies, getTradingStrategyById,
  updateTradingStrategy, deleteTradingStrategy, backtestStrategy,
  getStrategyPerformance, activateStrategy, deactivateStrategy, runStrategyOnce
} from '../../api/tradingStrategies';

import MainCard from '../../ui-component/cards/MainCard';

// ===========================|| TRADING HUB - DUAL CONTROLLER ||=========================== //

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const TradingHub = () => {
  // Main navigation: 0 = Order Book, 1 = Orders Management, 2 = Order Executions, 3 = Trading Strategies
  const [mainSection, setMainSection] = useState(0);
  
  // Sub-tabs for each section
  const [orderBookTab, setOrderBookTab] = useState(0);
  const [ordersTab, setOrdersTab] = useState(0);
  const [executionsTab, setExecutionsTab] = useState(0);
  const [strategiesTab, setStrategiesTab] = useState(0);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Dynamic data from database
  const [portfolios, setPortfolios] = useState([]);
  const [assets, setAssets] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState('');
  const [selectedAsset, setSelectedAsset] = useState('');
  
  // Manual input mode
  const [manualPortfolioMode, setManualPortfolioMode] = useState(false);
  const [manualAssetMode, setManualAssetMode] = useState(false);
  const [manualPortfolioId, setManualPortfolioId] = useState('');
  const [manualAssetId, setManualAssetId] = useState('');

  // ========== ORDER BOOK SECTION STATE ==========
  const [orderBook, setOrderBook] = useState({ buyOrders: [], sellOrders: [] });
  const [bestBid, setBestBid] = useState(null);
  const [bestAsk, setBestAsk] = useState(null);
  const [spread, setSpread] = useState(null);
  const [topOfBook, setTopOfBook] = useState(null);
  const [marketSnapshot, setMarketSnapshot] = useState(null);
  const [marketDepth, setMarketDepth] = useState({ buy: [], sell: [] });
  const [executions, setExecutions] = useState([]);
  const [selectedOrderIdExec, setSelectedOrderIdExec] = useState('');
  const [matchResult, setMatchResult] = useState(null);
  const [purgeDate, setPurgeDate] = useState('');
  
  const [newOrderBook, setNewOrderBook] = useState({
    portfolio_id: '',
    asset_id: '',
    order_type: 'LIMIT',
    side: 'BUY',
    quantity: '',
    price: '',
    stop_price: '',
    time_in_force: 'GTC',
    status: 'PENDING',
    creation_date: '',
    execution_date: '',
    executed_quantity: '',
    executed_price: ''
  });

  // ========== ORDERS MANAGEMENT SECTION STATE ==========
  const [allOrders, setAllOrders] = useState([]);
  const [openOrders, setOpenOrders] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [fillRatio, setFillRatio] = useState(null);
  
  const [newOrderMgmt, setNewOrderMgmt] = useState({
    portfolio_id: '',
    asset_id: '',
    order_type: 'LIMIT',
    side: 'BUY',
    quantity: '',
    price: '',
    stop_price: '',
    time_in_force: 'GTC',
    status: 'PENDING',
    creation_date: '',
    execution_date: '',
    executed_quantity: '',
    executed_price: ''
  });

  const [replaceOrderData, setReplaceOrderData] = useState({
    orderId: '',
    quantity: '',
    price: ''
  });

  const [historyFilters, setHistoryFilters] = useState({
    from: '',
    to: '',
    status: ''
  });

  const [ordersFilter, setOrdersFilter] = useState({
    portfolio_id: '',
    asset_id: '',
    status: '',
    side: ''
  });

  // ========== ORDER EXECUTIONS SECTION STATE ==========
  const [allExecutions, setAllExecutions] = useState([]);
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [vwapData, setVwapData] = useState(null);
  const [lastTradeData, setLastTradeData] = useState(null);
  const [aggregateData, setAggregateData] = useState(null);
  const [executionsInRange, setExecutionsInRange] = useState([]);
  
  const [newExecution, setNewExecution] = useState({
    order_id: '',
    executed_quantity: '',
    execution_price: '',
    execution_time: '',
    commission: '',
    execution_type: 'MATCH'
  });

  const [executionFilters, setExecutionFilters] = useState({
    order_id: '',
    execution_id: '',
    asset_id: '',
    from_date: '',
    to_date: ''
  });

  // ========== TRADING STRATEGIES SECTION STATE ==========
  const [allStrategies, setAllStrategies] = useState([]);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [backtestResults, setBacktestResults] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [runResults, setRunResults] = useState(null);
  
  const [newStrategy, setNewStrategy] = useState({
    user_id: '',
    strategy_name: '',
    strategy_type: 'MOMENTUM',
    description: '',
    parameters: '{}',
    is_active: false
  });

  const [strategyFilters, setStrategyFilters] = useState({
    user_id: '',
    is_active: '',
    strategy_id: ''
  });

  const [backtestParams, setBacktestParams] = useState({
    from: '',
    to: ''
  });

  // Load portfolios and assets on mount
  useEffect(() => {
    loadPortfoliosAndAssets();
  }, []);

  // Auto-refresh
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [mainSection, orderBookTab, ordersTab, selectedAsset]);

  // Load portfolios and assets from database
  const loadPortfoliosAndAssets = async () => {
    try {
      const [portfoliosData, assetsData] = await Promise.all([
        getPortfolios(),
        getAssets()
      ]);
      setPortfolios(portfoliosData);
      setAssets(assetsData);
      
      // Set default selections if available
      if (portfoliosData.length > 0) {
        setSelectedPortfolio(portfoliosData[0].portfolio_id);
        setNewOrderBook(prev => ({ ...prev, portfolio_id: portfoliosData[0].portfolio_id }));
        setNewOrderMgmt(prev => ({ ...prev, portfolio_id: portfoliosData[0].portfolio_id }));
        setOrdersFilter(prev => ({ ...prev, portfolio_id: portfoliosData[0].portfolio_id }));
      } else {
        // Si aucun portfolio, utiliser un ID par défaut
        const defaultPortfolioId = '11111111-1111-1111-1111-111111111111';
        setSelectedPortfolio(defaultPortfolioId);
        setManualPortfolioId(defaultPortfolioId);
        setNewOrderBook(prev => ({ ...prev, portfolio_id: defaultPortfolioId }));
        setNewOrderMgmt(prev => ({ ...prev, portfolio_id: defaultPortfolioId }));
        setOrdersFilter(prev => ({ ...prev, portfolio_id: defaultPortfolioId }));
        console.log('No portfolios loaded, using default:', defaultPortfolioId);
      }
      
      if (assetsData.length > 0) {
        setSelectedAsset(assetsData[0].asset_id);
      } else {
        // Si aucun asset, utiliser BTC par défaut
        setSelectedAsset('BTC');
        setManualAssetId('BTC');
        console.log('No assets loaded, using default: BTC');
      }
    } catch (err) {
      console.error('Error loading portfolios and assets:', err);
      // En cas d'erreur, utiliser des valeurs par défaut
      const defaultPortfolioId = '11111111-1111-1111-1111-111111111111';
      setSelectedPortfolio(defaultPortfolioId);
      setManualPortfolioId(defaultPortfolioId);
      setSelectedAsset('BTC');
      setManualAssetId('BTC');
      setError('Failed to load portfolios and assets. Using default values (Portfolio: 11111111..., Asset: BTC)');
    }
  };

  const loadData = async () => {
    if (mainSection === 0) {
      // Order Book Section
      if (orderBookTab === 0) await loadOrderBookData();
      else if (orderBookTab === 1) await loadMarketData();
    } else if (mainSection === 1) {
      // Orders Management Section
      if (ordersTab === 0) await loadAllOrders();
      else if (ordersTab === 1) await loadOpenOrders();
      else if (ordersTab === 2) await loadOrderHistory();
    }
  };

  // ========== ORDER BOOK FUNCTIONS ==========
  const loadOrderBookData = async () => {
    try {
      const [obData, bid, ask, spr] = await Promise.all([
        getOrderBook({ asset_id: selectedAsset }),
        getBestBid(selectedAsset),
        getBestAsk(selectedAsset),
        getSpread(selectedAsset)
      ]);
      setOrderBook(obData);
      setBestBid(bid);
      setBestAsk(ask);
      setSpread(spr.spread);
    } catch (err) {
      console.error('Error loading order book:', err);
    }
  };

  const loadMarketData = async () => {
    try {
      const [top, snapshot, depthBuy, depthSell] = await Promise.all([
        getTopOfBook(selectedAsset),
        getMarketSnapshot(selectedAsset),
        getMarketDepth(selectedAsset, 'BUY', 10),
        getMarketDepth(selectedAsset, 'SELL', 10)
      ]);
      setTopOfBook(top);
      setMarketSnapshot(snapshot);
      setMarketDepth({ buy: depthBuy, sell: depthSell });
    } catch (err) {
      console.error('Error loading market data:', err);
    }
  };

  const handlePlaceOrderBook = async () => {
    // Validation des champs requis
    if (!newOrderBook.portfolio_id) {
      setError('Portfolio ID is required. Please enter it in the form.');
      return;
    }
    if (!newOrderBook.asset_id && !selectedAsset) {
      setError('Asset ID is required. Please enter it in the form.');
      return;
    }
    if (!newOrderBook.quantity) {
      setError('Quantity is required.');
      return;
    }
    if (newOrderBook.order_type !== 'MARKET' && !newOrderBook.price) {
      setError('Price is required for non-MARKET orders.');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const orderData = {
        ...newOrderBook,
        portfolio_id: newOrderBook.portfolio_id,
        asset_id: newOrderBook.asset_id || selectedAsset,
        quantity: parseFloat(newOrderBook.quantity),
        price: newOrderBook.order_type === 'MARKET' ? null : parseFloat(newOrderBook.price),
        stop_price: newOrderBook.stop_price ? parseFloat(newOrderBook.stop_price) : null
      };
      
      console.log('Placing order with data:', orderData); // Debug log
      
      const result = await placeOrder(orderData);
      setSuccess(`Order placed! ID: ${result.order?.order_id?.substring(0, 8)}... | Executions: ${result.executions?.length || 0}`);
      setNewOrderBook({
        portfolio_id: selectedPortfolio,
        asset_id: '',
        order_type: 'LIMIT',
        side: 'BUY',
        quantity: '',
        price: '',
        stop_price: '',
        time_in_force: 'GTC',
        status: 'PENDING',
        creation_date: '',
        execution_date: '',
        executed_quantity: '',
        executed_price: ''
      });
      await loadOrderBookData();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadExecutions = async () => {
    if (!selectedOrderIdExec) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getOrderExecutions(selectedOrderIdExec);
      setExecutions(data);
      setSuccess(`Loaded ${data.length} execution(s)`);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForceMatch = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await forceMatchNow();
      setMatchResult(result);
      setSuccess(`Matched ${result.matches || 0} order(s)`);
      await loadOrderBookData();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePurgeStale = async () => {
    if (!purgeDate) {
      setError('Please select a cutoff date');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await purgeStaleOrders(purgeDate);
      setSuccess(`Purged ${result.count} stale order(s)`);
      await loadOrderBookData();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelExpired = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await cancelExpiredOrders();
      setSuccess(`Cancelled ${result.count} expired order(s)`);
      await loadOrderBookData();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  // ========== ORDERS MANAGEMENT FUNCTIONS ==========
  const loadAllOrders = async () => {
    try {
      const data = await getOrders(ordersFilter);
      setAllOrders(data);
    } catch (err) {
      console.error('Error loading orders:', err);
    }
  };

  const loadOpenOrders = async () => {
    try {
      const data = await getOpenOrders(selectedPortfolio, selectedAsset);
      setOpenOrders(data);
    } catch (err) {
      console.error('Error loading open orders:', err);
    }
  };

  const loadOrderHistory = async () => {
    try {
      const data = await getOrderHistory(selectedPortfolio, historyFilters);
      setOrderHistory(data);
    } catch (err) {
      console.error('Error loading order history:', err);
    }
  };

  const handleCreateOrder = async () => {
    // Validation des champs requis
    if (!newOrderMgmt.portfolio_id) {
      setError('Portfolio ID is required. Please enter it in the form.');
      return;
    }
    if (!newOrderMgmt.asset_id) {
      setError('Asset ID is required. Please enter it in the form.');
      return;
    }
    if (!newOrderMgmt.quantity) {
      setError('Quantity is required.');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const orderData = {
        ...newOrderMgmt,
        quantity: parseFloat(newOrderMgmt.quantity),
        price: newOrderMgmt.price ? parseFloat(newOrderMgmt.price) : null,
        stop_price: newOrderMgmt.stop_price ? parseFloat(newOrderMgmt.stop_price) : null
      };
      
      console.log('Creating order with data:', orderData); // Debug log
      
      const result = await createOrder(orderData);
      setSuccess(`Order created! ID: ${result.order_id?.substring(0, 8)}...`);
      setNewOrderMgmt({
        portfolio_id: selectedPortfolio,
        asset_id: '',
        order_type: 'LIMIT',
        side: 'BUY',
        quantity: '',
        price: '',
        stop_price: '',
        time_in_force: 'GTC',
        status: 'PENDING',
        creation_date: '',
        execution_date: '',
        executed_quantity: '',
        executed_price: ''
      });
      await loadAllOrders();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!confirm('Are you sure you want to delete this order?')) return;
    setLoading(true);
    setError(null);
    try {
      await deleteOrder(orderId);
      setSuccess('Order deleted successfully');
      await loadAllOrders();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReplaceOrder = async () => {
    if (!replaceOrderData.orderId) {
      setError('Please enter an Order ID');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const updates = {};
      if (replaceOrderData.quantity) updates.quantity = parseFloat(replaceOrderData.quantity);
      if (replaceOrderData.price) updates.price = parseFloat(replaceOrderData.price);
      
      const result = await replaceOrder(replaceOrderData.orderId, updates);
      setSuccess('Order replaced successfully');
      setReplaceOrderData({ orderId: '', quantity: '', price: '' });
      await loadAllOrders();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAllOrders = async () => {
    if (!confirm('Are you sure you want to cancel all orders?')) return;
    setLoading(true);
    setError(null);
    try {
      const result = await cancelAllOrders(selectedPortfolio, selectedAsset);
      setSuccess(`Cancelled ${result.count} order(s)`);
      await loadAllOrders();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGetFillRatio = async (orderId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getOrderFillRatio(orderId);
      setFillRatio(result);
      setSuccess(`Fill ratio: ${(result.fill_ratio * 100).toFixed(2)}%`);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'warning',
      EXECUTED: 'success',
      PARTIALLY_FILLED: 'info',
      CANCELLED: 'error',
      REJECTED: 'error',
      OPEN: 'info'
    };
    return colors[status] || 'default';
  };

  const getSideColor = (side) => side === 'BUY' ? 'success' : 'error';

  return (
    <MainCard title="Trading Hub">
      {/* Alerts */}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      {/* Main Navigation Bar */}
      <Paper sx={{ mb: 3 }}>
        <ToggleButtonGroup
          value={mainSection}
          exclusive
          onChange={(e, val) => val !== null && setMainSection(val)}
          fullWidth
          size="large"
        >
          <ToggleButton value={0} sx={{ py: 2 }}>
            <MenuBook sx={{ mr: 1 }} />
            Order Book Controller
          </ToggleButton>
          <ToggleButton value={1} sx={{ py: 2 }}>
            <LibraryBooks sx={{ mr: 1 }} />
            Orders Management Controller
          </ToggleButton>
          <ToggleButton value={2} sx={{ py: 2 }}>
            <Assessment sx={{ mr: 1 }} />
            Order Executions Management
          </ToggleButton>
          <ToggleButton value={3} sx={{ py: 2 }}>
            <TrendingUp sx={{ mr: 1 }} />
            Trading Strategies Management
          </ToggleButton>
        </ToggleButtonGroup>
      </Paper>

      {/* Info Card - Portfolio & Asset IDs are now in forms */}
      <Card sx={{ mb: 2, bgcolor: 'info.light' }}>
        <CardContent>
          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoOutlined fontSize="small" />
            <strong>Note:</strong> Portfolio ID and Asset ID can be entered directly in each form below.
          </Typography>
        </CardContent>
      </Card>

      {/* ========== ORDER BOOK CONTROLLER SECTION ========== */}
      {mainSection === 0 && (
        <Box>
          <Tabs value={orderBookTab} onChange={(e, val) => setOrderBookTab(val)} sx={{ mb: 2 }}>
            <Tab label="Order Book" icon={<ShowChart />} iconPosition="start" />
            <Tab label="Market Data" icon={<Assessment />} iconPosition="start" />
            <Tab label="Place Order" icon={<Add />} iconPosition="start" />
            <Tab label="Executions" icon={<CheckCircle />} iconPosition="start" />
            <Tab label="Management" icon={<CleaningServices />} iconPosition="start" />
          </Tabs>

          {/* Tab 0: Order Book */}
          <TabPanel value={orderBookTab} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h4" gutterBottom color="success.main">
                      <TrendingUp /> BUY Orders
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Price</TableCell>
                            <TableCell>Quantity</TableCell>
                            <TableCell>Remaining</TableCell>
                            <TableCell>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {orderBook.buyOrders?.map((order, idx) => (
                            <TableRow key={idx}>
                              <TableCell>${order.price}</TableCell>
                              <TableCell>{order.quantity}</TableCell>
                              <TableCell>{order.remaining_quantity}</TableCell>
                              <TableCell>
                                <Chip label={order.status} color={getStatusColor(order.status)} size="small" />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h4" gutterBottom color="error.main">
                      <TrendingDown /> SELL Orders
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Price</TableCell>
                            <TableCell>Quantity</TableCell>
                            <TableCell>Remaining</TableCell>
                            <TableCell>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {orderBook.sellOrders?.map((order, idx) => (
                            <TableRow key={idx}>
                              <TableCell>${order.price}</TableCell>
                              <TableCell>{order.quantity}</TableCell>
                              <TableCell>{order.remaining_quantity}</TableCell>
                              <TableCell>
                                <Chip label={order.status} color={getStatusColor(order.status)} size="small" />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h4" gutterBottom>Market Info</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Paper sx={{ p: 2, bgcolor: 'success.light' }}>
                          <Typography variant="caption">Best Bid</Typography>
                          <Typography variant="h5">${bestBid?.price || 'N/A'}</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={4}>
                        <Paper sx={{ p: 2, bgcolor: 'error.light' }}>
                          <Typography variant="caption">Best Ask</Typography>
                          <Typography variant="h5">${bestAsk?.price || 'N/A'}</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={4}>
                        <Paper sx={{ p: 2, bgcolor: 'info.light' }}>
                          <Typography variant="caption">Spread</Typography>
                          <Typography variant="h5">${spread || 'N/A'}</Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Tab 1: Market Data */}
          <TabPanel value={orderBookTab} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h4" gutterBottom>Top of Book</Typography>
                    {topOfBook && (
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2">Best Bid</Typography>
                          <Typography>Price: ${topOfBook.best_bid?.price}</Typography>
                          <Typography>Quantity: {topOfBook.best_bid?.quantity}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2">Best Ask</Typography>
                          <Typography>Price: ${topOfBook.best_ask?.price}</Typography>
                          <Typography>Quantity: {topOfBook.best_ask?.quantity}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Divider />
                          <Typography>Spread: ${topOfBook.spread}</Typography>
                          <Typography>Mid Price: ${topOfBook.mid_price}</Typography>
                        </Grid>
                      </Grid>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h4" gutterBottom>Market Snapshot</Typography>
                    {marketSnapshot && (
                      <Grid container spacing={1}>
                        <Grid item xs={6}><Typography variant="caption">Total Buy Orders:</Typography></Grid>
                        <Grid item xs={6}><Typography>{marketSnapshot.total_buy_orders}</Typography></Grid>
                        <Grid item xs={6}><Typography variant="caption">Total Sell Orders:</Typography></Grid>
                        <Grid item xs={6}><Typography>{marketSnapshot.total_sell_orders}</Typography></Grid>
                        <Grid item xs={6}><Typography variant="caption">Total Buy Volume:</Typography></Grid>
                        <Grid item xs={6}><Typography>{marketSnapshot.total_buy_volume}</Typography></Grid>
                        <Grid item xs={6}><Typography variant="caption">Total Sell Volume:</Typography></Grid>
                        <Grid item xs={6}><Typography>{marketSnapshot.total_sell_volume}</Typography></Grid>
                      </Grid>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h4" gutterBottom color="success.main">Market Depth - BUY</Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Price</TableCell>
                            <TableCell>Quantity</TableCell>
                            <TableCell>Orders</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {marketDepth.buy?.map((level, idx) => (
                            <TableRow key={idx}>
                              <TableCell>${level.price}</TableCell>
                              <TableCell>{level.quantity}</TableCell>
                              <TableCell>{level.orders}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h4" gutterBottom color="error.main">Market Depth - SELL</Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Price</TableCell>
                            <TableCell>Quantity</TableCell>
                            <TableCell>Orders</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {marketDepth.sell?.map((level, idx) => (
                            <TableRow key={idx}>
                              <TableCell>${level.price}</TableCell>
                              <TableCell>{level.quantity}</TableCell>
                              <TableCell>{level.orders}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Tab 2: Place Order */}
          <TabPanel value={orderBookTab} index={2}>
            <Card>
              <CardContent>
                <Typography variant="h4" gutterBottom>Place New Order</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Portfolio ID"
                      value={newOrderBook.portfolio_id}
                      onChange={(e) => setNewOrderBook({ ...newOrderBook, portfolio_id: e.target.value })}
                      placeholder="Enter Portfolio UUID (e.g., 11111111-1111-1111-1111-111111111111)"
                      helperText="Paste or type Portfolio UUID"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Asset ID"
                      value={newOrderBook.asset_id || selectedAsset}
                      onChange={(e) => setNewOrderBook({ ...newOrderBook, asset_id: e.target.value })}
                      placeholder="Enter Asset ID or Symbol (e.g., BTC, ETH, AAPL)"
                      helperText="Type symbol or paste Asset UUID"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Order Type</InputLabel>
                      <Select
                        value={newOrderBook.order_type}
                        onChange={(e) => setNewOrderBook({ ...newOrderBook, order_type: e.target.value })}
                        label="Order Type"
                      >
                        <MenuItem value="LIMIT">LIMIT</MenuItem>
                        <MenuItem value="MARKET">MARKET</MenuItem>
                        <MenuItem value="STOP">STOP</MenuItem>
                        <MenuItem value="STOP_LIMIT">STOP LIMIT</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Side</InputLabel>
                      <Select
                        value={newOrderBook.side}
                        onChange={(e) => setNewOrderBook({ ...newOrderBook, side: e.target.value })}
                        label="Side"
                      >
                        <MenuItem value="BUY">BUY</MenuItem>
                        <MenuItem value="SELL">SELL</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Quantity"
                      type="number"
                      value={newOrderBook.quantity}
                      onChange={(e) => setNewOrderBook({ ...newOrderBook, quantity: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Price"
                      type="number"
                      value={newOrderBook.price}
                      onChange={(e) => setNewOrderBook({ ...newOrderBook, price: e.target.value })}
                      disabled={newOrderBook.order_type === 'MARKET'}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Stop Price"
                      type="number"
                      value={newOrderBook.stop_price}
                      onChange={(e) => setNewOrderBook({ ...newOrderBook, stop_price: e.target.value })}
                      disabled={!['STOP', 'STOP_LIMIT'].includes(newOrderBook.order_type)}
                      helperText="For STOP and STOP_LIMIT orders"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Time In Force</InputLabel>
                      <Select
                        value={newOrderBook.time_in_force}
                        onChange={(e) => setNewOrderBook({ ...newOrderBook, time_in_force: e.target.value })}
                        label="Time In Force"
                      >
                        <MenuItem value="GTC">GTC (Good Till Cancel)</MenuItem>
                        <MenuItem value="DAY">DAY</MenuItem>
                        <MenuItem value="IOC">IOC (Immediate or Cancel)</MenuItem>
                        <MenuItem value="FOK">FOK (Fill or Kill)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      color={newOrderBook.side === 'BUY' ? 'success' : 'error'}
                      onClick={handlePlaceOrderBook}
                      disabled={loading}
                      fullWidth
                      size="large"
                      startIcon={loading ? <CircularProgress size={20} /> : <Add />}
                    >
                      Place {newOrderBook.side} Order
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </TabPanel>

          {/* Tab 3: Executions */}
          <TabPanel value={orderBookTab} index={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" gutterBottom>Order Executions</Typography>
                <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                  <TextField
                    label="Order ID"
                    value={selectedOrderIdExec}
                    onChange={(e) => setSelectedOrderIdExec(e.target.value)}
                    fullWidth
                  />
                  <Button
                    variant="contained"
                    onClick={handleLoadExecutions}
                    disabled={loading || !selectedOrderIdExec}
                    startIcon={<Search />}
                  >
                    Load
                  </Button>
                </Stack>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Execution ID</TableCell>
                        <TableCell>Quantity</TableCell>
                        <TableCell>Price</TableCell>
                        <TableCell>Commission</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Time</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {executions.map((exec) => (
                        <TableRow key={exec.execution_id}>
                          <TableCell>{exec.execution_id?.substring(0, 8)}...</TableCell>
                          <TableCell>{exec.executed_quantity}</TableCell>
                          <TableCell>${exec.execution_price}</TableCell>
                          <TableCell>${exec.commission}</TableCell>
                          <TableCell>
                            <Chip label={exec.execution_type} size="small" />
                          </TableCell>
                          <TableCell>{new Date(exec.execution_time).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </TabPanel>

          {/* Tab 4: Management */}
          <TabPanel value={orderBookTab} index={4}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h4" gutterBottom>Force Matching</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Manually trigger the order matching engine
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleForceMatch}
                      disabled={loading}
                      fullWidth
                      startIcon={<PlayArrow />}
                    >
                      Force Match Now
                    </Button>
                    {matchResult && (
                      <Box sx={{ mt: 2 }}>
                        <Typography>Matches: {matchResult.matches}</Typography>
                        <Typography>Executed Orders: {matchResult.executedOrders}</Typography>
                        <Typography>Volume: ${matchResult.volume}</Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h4" gutterBottom>Cancel Expired</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Cancel orders based on Time-In-Force
                    </Typography>
                    <Button
                      variant="contained"
                      color="warning"
                      onClick={handleCancelExpired}
                      disabled={loading}
                      fullWidth
                      startIcon={<Cancel />}
                    >
                      Cancel Expired Orders
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h4" gutterBottom>Purge Stale Orders</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Remove orders created before a specific date
                    </Typography>
                    <Stack direction="row" spacing={2}>
                      <TextField
                        type="date"
                        label="Cutoff Date"
                        value={purgeDate}
                        onChange={(e) => setPurgeDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                      />
                      <Button
                        variant="contained"
                        color="error"
                        onClick={handlePurgeStale}
                        disabled={loading || !purgeDate}
                        startIcon={<CleaningServices />}
                      >
                        Purge
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>
        </Box>
      )}

      {/* ========== ORDERS MANAGEMENT CONTROLLER SECTION ========== */}
      {mainSection === 1 && (
        <Box>
          <Tabs value={ordersTab} onChange={(e, val) => setOrdersTab(val)} sx={{ mb: 2 }}>
            <Tab label="Create Order" icon={<Add />} iconPosition="start" />
            <Tab label="All Orders" icon={<LibraryBooks />} iconPosition="start" />
            <Tab label="Open Orders" icon={<ShowChart />} iconPosition="start" />
            <Tab label="Order History" icon={<History />} iconPosition="start" />
            <Tab label="Replace Order" icon={<SwapHoriz />} iconPosition="start" />
            <Tab label="Fill Ratio" icon={<Assessment />} iconPosition="start" />
          </Tabs>

          {/* Tab 0: Create Order */}
          <TabPanel value={ordersTab} index={0}>
            <Card>
              <CardContent>
                <Typography variant="h4" gutterBottom>Create New Order (Orders Controller)</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  This uses the orders.controller.js endpoint with validation
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Portfolio ID"
                      value={newOrderMgmt.portfolio_id}
                      onChange={(e) => setNewOrderMgmt({ ...newOrderMgmt, portfolio_id: e.target.value })}
                      placeholder="Enter Portfolio UUID (e.g., 11111111-1111-1111-1111-111111111111)"
                      helperText="Paste or type Portfolio UUID"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Asset ID"
                      value={newOrderMgmt.asset_id}
                      onChange={(e) => setNewOrderMgmt({ ...newOrderMgmt, asset_id: e.target.value })}
                      placeholder="Enter Asset ID or Symbol (e.g., BTC, ETH, AAPL)"
                      helperText="Type symbol or paste Asset UUID"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Order Type</InputLabel>
                      <Select
                        value={newOrderMgmt.order_type}
                        onChange={(e) => setNewOrderMgmt({ ...newOrderMgmt, order_type: e.target.value })}
                        label="Order Type"
                      >
                        <MenuItem value="LIMIT">LIMIT</MenuItem>
                        <MenuItem value="MARKET">MARKET</MenuItem>
                        <MenuItem value="STOP">STOP</MenuItem>
                        <MenuItem value="STOP_LIMIT">STOP LIMIT</MenuItem>
                        <MenuItem value="TRAILING_STOP">TRAILING STOP</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Side</InputLabel>
                      <Select
                        value={newOrderMgmt.side}
                        onChange={(e) => setNewOrderMgmt({ ...newOrderMgmt, side: e.target.value })}
                        label="Side"
                      >
                        <MenuItem value="BUY">BUY</MenuItem>
                        <MenuItem value="SELL">SELL</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Quantity"
                      type="number"
                      value={newOrderMgmt.quantity}
                      onChange={(e) => setNewOrderMgmt({ ...newOrderMgmt, quantity: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Price"
                      type="number"
                      value={newOrderMgmt.price}
                      onChange={(e) => setNewOrderMgmt({ ...newOrderMgmt, price: e.target.value })}
                      disabled={newOrderMgmt.order_type === 'MARKET'}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Stop Price"
                      type="number"
                      value={newOrderMgmt.stop_price}
                      onChange={(e) => setNewOrderMgmt({ ...newOrderMgmt, stop_price: e.target.value })}
                      disabled={!['STOP', 'STOP_LIMIT', 'TRAILING_STOP'].includes(newOrderMgmt.order_type)}
                      helperText="For STOP orders"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Time In Force</InputLabel>
                      <Select
                        value={newOrderMgmt.time_in_force}
                        onChange={(e) => setNewOrderMgmt({ ...newOrderMgmt, time_in_force: e.target.value })}
                        label="Time In Force"
                      >
                        <MenuItem value="DAY">DAY</MenuItem>
                        <MenuItem value="GTC">GTC</MenuItem>
                        <MenuItem value="IOC">IOC</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleCreateOrder}
                      disabled={loading}
                      fullWidth
                      size="large"
                      startIcon={loading ? <CircularProgress size={20} /> : <Add />}
                    >
                      Create Order
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </TabPanel>

          {/* Tab 1: All Orders */}
          <TabPanel value={ordersTab} index={1}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="h4">All Orders</Typography>
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleCancelAllOrders}
                      startIcon={<Delete />}
                    >
                      Cancel All
                    </Button>
                    <Button variant="outlined" onClick={loadAllOrders} startIcon={<Refresh />}>
                      Refresh
                    </Button>
                  </Stack>
                </Stack>

                {/* Filters */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={3}>
                    <TextField
                      fullWidth
                      label="Asset ID"
                      value={ordersFilter.asset_id}
                      onChange={(e) => setOrdersFilter({ ...ordersFilter, asset_id: e.target.value })}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={ordersFilter.status}
                        onChange={(e) => setOrdersFilter({ ...ordersFilter, status: e.target.value })}
                        label="Status"
                      >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="PENDING">PENDING</MenuItem>
                        <MenuItem value="EXECUTED">EXECUTED</MenuItem>
                        <MenuItem value="CANCELLED">CANCELLED</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Side</InputLabel>
                      <Select
                        value={ordersFilter.side}
                        onChange={(e) => setOrdersFilter({ ...ordersFilter, side: e.target.value })}
                        label="Side"
                      >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="BUY">BUY</MenuItem>
                        <MenuItem value="SELL">SELL</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={3}>
                    <Button variant="contained" onClick={loadAllOrders} fullWidth>
                      Apply Filters
                    </Button>
                  </Grid>
                </Grid>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Order ID</TableCell>
                        <TableCell>Asset</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Side</TableCell>
                        <TableCell>Quantity</TableCell>
                        <TableCell>Price</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {allOrders.map((order) => (
                        <TableRow key={order.order_id}>
                          <TableCell>{order.order_id?.substring(0, 8)}...</TableCell>
                          <TableCell>{order.asset_id}</TableCell>
                          <TableCell>{order.order_type}</TableCell>
                          <TableCell>
                            <Chip label={order.side} color={getSideColor(order.side)} size="small" />
                          </TableCell>
                          <TableCell>{order.quantity}</TableCell>
                          <TableCell>${order.price}</TableCell>
                          <TableCell>
                            <Chip label={order.status} color={getStatusColor(order.status)} size="small" />
                          </TableCell>
                          <TableCell>
                            <IconButton size="small" onClick={() => handleDeleteOrder(order.order_id)} color="error">
                              <Delete />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </TabPanel>

          {/* Tab 2: Open Orders */}
          <TabPanel value={ordersTab} index={2}>
            <Card>
              <CardContent>
                <Typography variant="h4" gutterBottom>Open Orders (PENDING & PARTIALLY_FILLED)</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Shows only active orders from orderService.getOpenOrders()
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Order ID</TableCell>
                        <TableCell>Asset</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Side</TableCell>
                        <TableCell>Quantity</TableCell>
                        <TableCell>Executed</TableCell>
                        <TableCell>Price</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Created</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {openOrders.map((order) => (
                        <TableRow key={order.order_id}>
                          <TableCell>{order.order_id?.substring(0, 8)}...</TableCell>
                          <TableCell>
                            {order.asset?.asset_name || order.asset_id}
                          </TableCell>
                          <TableCell>{order.order_type}</TableCell>
                          <TableCell>
                            <Chip label={order.side} color={getSideColor(order.side)} size="small" />
                          </TableCell>
                          <TableCell>{order.quantity}</TableCell>
                          <TableCell>{order.executed_quantity || 0}</TableCell>
                          <TableCell>${order.price}</TableCell>
                          <TableCell>
                            <Chip label={order.status} color={getStatusColor(order.status)} size="small" />
                          </TableCell>
                          <TableCell>{new Date(order.createdAt).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </TabPanel>

          {/* Tab 3: Order History */}
          <TabPanel value={ordersTab} index={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" gutterBottom>Order History</Typography>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      type="date"
                      label="From"
                      value={historyFilters.from}
                      onChange={(e) => setHistoryFilters({ ...historyFilters, from: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      type="date"
                      label="To"
                      value={historyFilters.to}
                      onChange={(e) => setHistoryFilters({ ...historyFilters, to: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={historyFilters.status}
                        onChange={(e) => setHistoryFilters({ ...historyFilters, status: e.target.value })}
                        label="Status"
                      >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="PENDING">PENDING</MenuItem>
                        <MenuItem value="EXECUTED">EXECUTED</MenuItem>
                        <MenuItem value="CANCELLED">CANCELLED</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <Button variant="contained" onClick={loadOrderHistory} fullWidth>
                      Load History
                    </Button>
                  </Grid>
                </Grid>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Order ID</TableCell>
                        <TableCell>Asset</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Side</TableCell>
                        <TableCell>Quantity</TableCell>
                        <TableCell>Price</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Executions</TableCell>
                        <TableCell>Created</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orderHistory.map((order) => (
                        <TableRow key={order.order_id}>
                          <TableCell>{order.order_id?.substring(0, 8)}...</TableCell>
                          <TableCell>{order.asset?.asset_name || order.asset_id}</TableCell>
                          <TableCell>{order.order_type}</TableCell>
                          <TableCell>
                            <Chip label={order.side} color={getSideColor(order.side)} size="small" />
                          </TableCell>
                          <TableCell>{order.quantity}</TableCell>
                          <TableCell>${order.price}</TableCell>
                          <TableCell>
                            <Chip label={order.status} color={getStatusColor(order.status)} size="small" />
                          </TableCell>
                          <TableCell>
                            <Badge badgeContent={order.executions?.length || 0} color="primary">
                              <CheckCircle fontSize="small" />
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(order.createdAt).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </TabPanel>

          {/* Tab 4: Replace Order */}
          <TabPanel value={ordersTab} index={4}>
            <Card>
              <CardContent>
                <Typography variant="h4" gutterBottom>Replace Order</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Modify quantity or price of an existing order (uses PUT /orders/:id/replace)
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Order ID to Replace"
                      value={replaceOrderData.orderId}
                      onChange={(e) => setReplaceOrderData({ ...replaceOrderData, orderId: e.target.value })}
                      helperText="Enter the full order ID"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="New Quantity (optional)"
                      type="number"
                      value={replaceOrderData.quantity}
                      onChange={(e) => setReplaceOrderData({ ...replaceOrderData, quantity: e.target.value })}
                      helperText="Leave empty to keep current"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="New Price (optional)"
                      type="number"
                      value={replaceOrderData.price}
                      onChange={(e) => setReplaceOrderData({ ...replaceOrderData, price: e.target.value })}
                      helperText="Leave empty to keep current"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleReplaceOrder}
                      disabled={loading || !replaceOrderData.orderId}
                      fullWidth
                      size="large"
                      startIcon={<SwapHoriz />}
                    >
                      Replace Order
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </TabPanel>

          {/* Tab 5: Fill Ratio */}
          <TabPanel value={ordersTab} index={5}>
            <Card>
              <CardContent>
                <Typography variant="h4" gutterBottom>Compute Fill Ratio</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Calculate what percentage of an order has been executed
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label="Order ID"
                    helperText="Enter an order ID to compute fill ratio"
                  />
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Order ID</TableCell>
                          <TableCell>Quantity</TableCell>
                          <TableCell>Executed</TableCell>
                          <TableCell>Fill Ratio</TableCell>
                          <TableCell>Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {allOrders.slice(0, 10).map((order) => (
                          <TableRow key={order.order_id}>
                            <TableCell>{order.order_id?.substring(0, 8)}...</TableCell>
                            <TableCell>{order.quantity}</TableCell>
                            <TableCell>{order.executed_quantity || 0}</TableCell>
                            <TableCell>
                              {order.quantity > 0
                                ? `${((order.executed_quantity || 0) / order.quantity * 100).toFixed(2)}%`
                                : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="small"
                                onClick={() => handleGetFillRatio(order.order_id)}
                                startIcon={<Assessment />}
                              >
                                Check API
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  {fillRatio && (
                    <Alert severity="info">
                      Order {fillRatio.order_id?.substring(0, 8)}... has a fill ratio of{' '}
                      {(fillRatio.fill_ratio * 100).toFixed(2)}%
                    </Alert>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </TabPanel>
        </Box>
      )}

      {/* ========== ORDER EXECUTIONS MANAGEMENT SECTION ========== */}
      {mainSection === 2 && (
        <Box>
          <Tabs value={executionsTab} onChange={(e, val) => setExecutionsTab(val)} sx={{ mb: 2 }}>
            <Tab label="Create Execution" icon={<Add />} iconPosition="start" />
            <Tab label="All Executions" icon={<Assessment />} iconPosition="start" />
            <Tab label="Execution by ID" icon={<Search />} iconPosition="start" />
            <Tab label="VWAP" icon={<TrendingUp />} iconPosition="start" />
            <Tab label="Last Trade" icon={<ShowChart />} iconPosition="start" />
            <Tab label="Aggregate" icon={<AccountBalance />} iconPosition="start" />
          </Tabs>

          {/* TAB 0: Create Execution */}
          <TabPanel value={executionsTab} index={0}>
            <Card>
              <CardContent>
                <Typography variant="h4" gutterBottom>Create New Execution</Typography>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label="Order ID"
                    value={newExecution.order_id}
                    onChange={(e) => setNewExecution({...newExecution, order_id: e.target.value})}
                    placeholder="Enter order UUID"
                    helperText="UUID of the order this execution belongs to"
                  />
                  <TextField
                    fullWidth
                    label="Executed Quantity"
                    type="number"
                    value={newExecution.executed_quantity}
                    onChange={(e) => setNewExecution({...newExecution, executed_quantity: e.target.value})}
                  />
                  <TextField
                    fullWidth
                    label="Execution Price"
                    type="number"
                    value={newExecution.execution_price}
                    onChange={(e) => setNewExecution({...newExecution, execution_price: e.target.value})}
                  />
                  <TextField
                    fullWidth
                    label="Commission"
                    type="number"
                    value={newExecution.commission}
                    onChange={(e) => setNewExecution({...newExecution, commission: e.target.value})}
                    helperText="Optional commission amount"
                  />
                  <FormControl fullWidth>
                    <InputLabel>Execution Type</InputLabel>
                    <Select
                      value={newExecution.execution_type}
                      onChange={(e) => setNewExecution({...newExecution, execution_type: e.target.value})}
                      label="Execution Type"
                    >
                      <MenuItem value="MATCH">MATCH</MenuItem>
                      <MenuItem value="MANUAL">MANUAL</MenuItem>
                      <MenuItem value="SYSTEM">SYSTEM</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    fullWidth
                    label="Execution Time"
                    type="datetime-local"
                    value={newExecution.execution_time}
                    onChange={(e) => setNewExecution({...newExecution, execution_time: e.target.value})}
                    InputLabelProps={{ shrink: true }}
                  />
                  <Button 
                    variant="contained" 
                    startIcon={<Add />}
                    onClick={async () => {
                      try {
                        setLoading(true);
                        const result = await createOrderExecution({
                          ...newExecution,
                          executed_quantity: parseFloat(newExecution.executed_quantity),
                          execution_price: parseFloat(newExecution.execution_price),
                          commission: newExecution.commission ? parseFloat(newExecution.commission) : 0
                        });
                        setSuccess(`Execution created! ID: ${result.execution_id?.substring(0, 8)}...`);
                        setNewExecution({
                          order_id: '',
                          executed_quantity: '',
                          execution_price: '',
                          execution_time: '',
                          commission: '',
                          execution_type: 'MATCH'
                        });
                      } catch (err) {
                        setError(err.response?.data?.message || err.message);
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    Create Execution
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </TabPanel>

          {/* TAB 1: All Executions */}
          <TabPanel value={executionsTab} index={1}>
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <TextField
                      label="Filter by Order ID"
                      value={executionFilters.order_id}
                      onChange={(e) => setExecutionFilters({...executionFilters, order_id: e.target.value})}
                      placeholder="Optional order UUID filter"
                    />
                    <Button 
                      variant="contained"
                      startIcon={<Refresh />}
                      onClick={async () => {
                        try {
                          setLoading(true);
                          const filters = {};
                          if (executionFilters.order_id) filters.order_id = executionFilters.order_id;
                          const result = await getAllOrderExecutions(filters);
                          setAllExecutions(result);
                          setSuccess(`Loaded ${result.length} executions`);
                        } catch (err) {
                          setError(err.response?.data?.message || err.message);
                        } finally {
                          setLoading(false);
                        }
                      }}
                    >
                      Load Executions
                    </Button>
                  </Stack>

                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Execution ID</TableCell>
                          <TableCell>Order ID</TableCell>
                          <TableCell>Quantity</TableCell>
                          <TableCell>Price</TableCell>
                          <TableCell>Commission</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Time</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {allExecutions.map((exec) => (
                          <TableRow key={exec.execution_id}>
                            <TableCell>{exec.execution_id?.substring(0, 8)}...</TableCell>
                            <TableCell>{exec.order_id?.substring(0, 8)}...</TableCell>
                            <TableCell>{exec.executed_quantity}</TableCell>
                            <TableCell>${exec.execution_price}</TableCell>
                            <TableCell>${exec.commission || 0}</TableCell>
                            <TableCell>
                              <Chip label={exec.execution_type} size="small" />
                            </TableCell>
                            <TableCell>{new Date(exec.execution_time).toLocaleString()}</TableCell>
                            <TableCell>
                              <IconButton
                                onClick={async () => {
                                  if (window.confirm('Delete this execution?')) {
                                    try {
                                      await deleteOrderExecution(exec.execution_id);
                                      setSuccess('Execution deleted');
                                      const result = await getAllOrderExecutions();
                                      setAllExecutions(result);
                                    } catch (err) {
                                      setError(err.response?.data?.message || err.message);
                                    }
                                  }
                                }}
                              >
                                <Delete />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  {allExecutions.length === 0 && (
                    <Alert severity="info">No executions found. Click "Load Executions" to fetch data.</Alert>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </TabPanel>

          {/* TAB 2: Execution by ID */}
          <TabPanel value={executionsTab} index={2}>
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="h4" gutterBottom>Search Execution by ID</Typography>
                  <TextField
                    fullWidth
                    label="Execution ID"
                    value={executionFilters.execution_id}
                    onChange={(e) => setExecutionFilters({...executionFilters, execution_id: e.target.value})}
                    placeholder="Enter execution UUID"
                  />
                  <Button
                    variant="contained"
                    startIcon={<Search />}
                    onClick={async () => {
                      try {
                        setLoading(true);
                        const result = await getOrderExecutionById(executionFilters.execution_id);
                        setSelectedExecution(result);
                        setSuccess('Execution loaded');
                      } catch (err) {
                        setError(err.response?.data?.message || err.message);
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    Get Execution
                  </Button>

                  {selectedExecution && (
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h5" gutterBottom>Execution Details</Typography>
                        <Divider sx={{ my: 2 }} />
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography><strong>Execution ID:</strong></Typography>
                            <Typography variant="body2">{selectedExecution.execution_id}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography><strong>Order ID:</strong></Typography>
                            <Typography variant="body2">{selectedExecution.order_id}</Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography><strong>Quantity:</strong></Typography>
                            <Typography variant="h6">{selectedExecution.executed_quantity}</Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography><strong>Price:</strong></Typography>
                            <Typography variant="h6" color="primary">${selectedExecution.execution_price}</Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography><strong>Commission:</strong></Typography>
                            <Typography variant="h6">${selectedExecution.commission || 0}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography><strong>Type:</strong></Typography>
                            <Chip label={selectedExecution.execution_type} />
                          </Grid>
                          <Grid item xs={6}>
                            <Typography><strong>Time:</strong></Typography>
                            <Typography>{new Date(selectedExecution.execution_time).toLocaleString()}</Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </TabPanel>

          {/* TAB 3: VWAP */}
          <TabPanel value={executionsTab} index={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" gutterBottom>Calculate VWAP</Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Volume Weighted Average Price - Calculate the average execution price weighted by volume
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label="Asset ID"
                    value={executionFilters.asset_id}
                    onChange={(e) => setExecutionFilters({...executionFilters, asset_id: e.target.value})}
                    placeholder="e.g., BTC, ETH, AAPL"
                  />
                  <TextField
                    fullWidth
                    label="From Date"
                    type="datetime-local"
                    value={executionFilters.from_date}
                    onChange={(e) => setExecutionFilters({...executionFilters, from_date: e.target.value})}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    fullWidth
                    label="To Date"
                    type="datetime-local"
                    value={executionFilters.to_date}
                    onChange={(e) => setExecutionFilters({...executionFilters, to_date: e.target.value})}
                    InputLabelProps={{ shrink: true }}
                  />
                  <Button
                    variant="contained"
                    startIcon={<TrendingUp />}
                    onClick={async () => {
                      try {
                        setLoading(true);
                        const result = await getExecutionVWAP(
                          executionFilters.asset_id,
                          executionFilters.from_date,
                          executionFilters.to_date
                        );
                        setVwapData(result);
                        setSuccess(`VWAP calculated: $${result.vwap}`);
                      } catch (err) {
                        setError(err.response?.data?.message || err.message);
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    Calculate VWAP
                  </Button>

                  {vwapData && (
                    <Card variant="outlined" sx={{ bgcolor: 'primary.light', p: 2 }}>
                      <CardContent>
                        <Typography variant="h3" color="primary" gutterBottom>
                          ${vwapData.vwap}
                        </Typography>
                        <Typography variant="h6">VWAP for {vwapData.assetId}</Typography>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="body2">
                          Period: {new Date(vwapData.from).toLocaleString()} - {new Date(vwapData.to).toLocaleString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </TabPanel>

          {/* TAB 4: Last Trade */}
          <TabPanel value={executionsTab} index={4}>
            <Card>
              <CardContent>
                <Typography variant="h4" gutterBottom>Last Trade</Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Get the most recent execution for an asset
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label="Asset ID"
                    value={executionFilters.asset_id}
                    onChange={(e) => setExecutionFilters({...executionFilters, asset_id: e.target.value})}
                    placeholder="e.g., BTC, ETH, AAPL"
                  />
                  <Button
                    variant="contained"
                    startIcon={<ShowChart />}
                    onClick={async () => {
                      try {
                        setLoading(true);
                        const result = await getLastTrade(executionFilters.asset_id);
                        setLastTradeData(result);
                        setSuccess('Last trade loaded');
                      } catch (err) {
                        setError(err.response?.data?.message || err.message);
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    Get Last Trade
                  </Button>

                  {lastTradeData && (
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h5" gutterBottom>Last Trade</Typography>
                        <Divider sx={{ my: 2 }} />
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <Typography variant="h3" color="primary">
                              ${lastTradeData.execution_price}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography><strong>Quantity:</strong></Typography>
                            <Typography variant="h6">{lastTradeData.executed_quantity}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography><strong>Commission:</strong></Typography>
                            <Typography variant="h6">${lastTradeData.commission || 0}</Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography><strong>Time:</strong></Typography>
                            <Typography>{new Date(lastTradeData.execution_time).toLocaleString()}</Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography><strong>Type:</strong></Typography>
                            <Chip label={lastTradeData.execution_type} />
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </TabPanel>

          {/* TAB 5: Aggregate by Order */}
          <TabPanel value={executionsTab} index={5}>
            <Card>
              <CardContent>
                <Typography variant="h4" gutterBottom>Aggregate Executions by Order</Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Get aggregated statistics for all executions of a specific order
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label="Order ID"
                    value={executionFilters.order_id}
                    onChange={(e) => setExecutionFilters({...executionFilters, order_id: e.target.value})}
                    placeholder="Enter order UUID"
                  />
                  <Button
                    variant="contained"
                    startIcon={<AccountBalance />}
                    onClick={async () => {
                      try {
                        setLoading(true);
                        const result = await aggregateExecutionsByOrder(executionFilters.order_id);
                        setAggregateData(result);
                        setSuccess('Aggregate data loaded');
                      } catch (err) {
                        setError(err.response?.data?.message || err.message);
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    Get Aggregate
                  </Button>

                  {aggregateData && (
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h5" gutterBottom>Aggregate Statistics</Typography>
                        <Typography variant="body2" sx={{ mb: 2 }}>Order: {aggregateData.orderId?.substring(0, 8)}...</Typography>
                        <Divider sx={{ my: 2 }} />
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography><strong>Total Executed:</strong></Typography>
                            <Typography variant="h6">{aggregateData.totalExecutedQuantity || 0}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography><strong>Avg Price:</strong></Typography>
                            <Typography variant="h6" color="primary">
                              ${aggregateData.avgExecutionPrice || 0}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography><strong>Total Commission:</strong></Typography>
                            <Typography variant="h6">${aggregateData.totalCommission || 0}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography><strong>Execution Count:</strong></Typography>
                            <Typography variant="h6">{aggregateData.executionCount || 0}</Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </TabPanel>
        </Box>
      )}

      {/* ========== TRADING STRATEGIES MANAGEMENT SECTION ========== */}
      {mainSection === 3 && (
        <Box>
          <Tabs value={strategiesTab} onChange={(e, val) => setStrategiesTab(val)} sx={{ mb: 2 }}>
            <Tab label="Create Strategy" icon={<Add />} iconPosition="start" />
            <Tab label="All Strategies" icon={<Assessment />} iconPosition="start" />
            <Tab label="Strategy by ID" icon={<Search />} iconPosition="start" />
            <Tab label="Backtest" icon={<History />} iconPosition="start" />
            <Tab label="Performance" icon={<TrendingUp />} iconPosition="start" />
            <Tab label="Run Strategy" icon={<PlayArrow />} iconPosition="start" />
          </Tabs>

          {/* TAB 0: Create Strategy */}
          <TabPanel value={strategiesTab} index={0}>
            <Card>
              <CardContent>
                <Typography variant="h4" gutterBottom>Create New Trading Strategy</Typography>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label="User ID"
                    value={newStrategy.user_id}
                    onChange={(e) => setNewStrategy({...newStrategy, user_id: e.target.value})}
                    placeholder="Enter user UUID"
                    helperText="Owner of this strategy"
                  />
                  <TextField
                    fullWidth
                    label="Strategy Name"
                    value={newStrategy.strategy_name}
                    onChange={(e) => setNewStrategy({...newStrategy, strategy_name: e.target.value})}
                    placeholder="e.g., BTC Momentum Strategy"
                  />
                  <FormControl fullWidth>
                    <InputLabel>Strategy Type</InputLabel>
                    <Select
                      value={newStrategy.strategy_type}
                      onChange={(e) => setNewStrategy({...newStrategy, strategy_type: e.target.value})}
                      label="Strategy Type"
                    >
                      <MenuItem value="MOMENTUM">MOMENTUM</MenuItem>
                      <MenuItem value="MEAN_REVERSION">MEAN REVERSION</MenuItem>
                      <MenuItem value="BREAKOUT">BREAKOUT</MenuItem>
                      <MenuItem value="ARBITRAGE">ARBITRAGE</MenuItem>
                      <MenuItem value="MARKET_MAKING">MARKET MAKING</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    fullWidth
                    label="Description"
                    value={newStrategy.description}
                    onChange={(e) => setNewStrategy({...newStrategy, description: e.target.value})}
                    multiline
                    rows={3}
                    placeholder="Describe your strategy..."
                  />
                  <TextField
                    fullWidth
                    label="Parameters (JSON)"
                    value={newStrategy.parameters}
                    onChange={(e) => setNewStrategy({...newStrategy, parameters: e.target.value})}
                    multiline
                    rows={5}
                    placeholder='{"asset_id": "btc", "threshold": 0.02, "risk_per_trade": 0.02}'
                    helperText="Strategy configuration in JSON format"
                  />
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={newStrategy.is_active}
                      onChange={(e) => setNewStrategy({...newStrategy, is_active: e.target.value})}
                      label="Status"
                    >
                      <MenuItem value={false}>Inactive</MenuItem>
                      <MenuItem value={true}>Active</MenuItem>
                    </Select>
                  </FormControl>
                  <Button 
                    variant="contained" 
                    startIcon={<Add />}
                    onClick={async () => {
                      try {
                        setLoading(true);
                        let params = {};
                        try {
                          params = JSON.parse(newStrategy.parameters);
                        } catch (e) {
                          setError('Invalid JSON in parameters');
                          setLoading(false);
                          return;
                        }
                        
                        const result = await createTradingStrategy({
                          ...newStrategy,
                          parameters: params
                        });
                        setSuccess(`Strategy created! ID: ${result.strategy_id?.substring(0, 8)}...`);
                        setNewStrategy({
                          user_id: '',
                          strategy_name: '',
                          strategy_type: 'MOMENTUM',
                          description: '',
                          parameters: '{}',
                          is_active: false
                        });
                      } catch (err) {
                        setError(err.response?.data?.message || err.message);
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    Create Strategy
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </TabPanel>

          {/* TAB 1: All Strategies */}
          <TabPanel value={strategiesTab} index={1}>
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <TextField
                      label="Filter by User ID"
                      value={strategyFilters.user_id}
                      onChange={(e) => setStrategyFilters({...strategyFilters, user_id: e.target.value})}
                      placeholder="Optional user UUID"
                    />
                    <FormControl sx={{ minWidth: 150 }}>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={strategyFilters.is_active}
                        onChange={(e) => setStrategyFilters({...strategyFilters, is_active: e.target.value})}
                        label="Status"
                      >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="true">Active</MenuItem>
                        <MenuItem value="false">Inactive</MenuItem>
                      </Select>
                    </FormControl>
                    <Button 
                      variant="contained"
                      startIcon={<Refresh />}
                      onClick={async () => {
                        try {
                          setLoading(true);
                          const filters = {};
                          if (strategyFilters.user_id) filters.user_id = strategyFilters.user_id;
                          if (strategyFilters.is_active) filters.is_active = strategyFilters.is_active;
                          const result = await getAllTradingStrategies(filters);
                          setAllStrategies(result);
                          setSuccess(`Loaded ${result.length} strategies`);
                        } catch (err) {
                          setError(err.response?.data?.message || err.message);
                        } finally {
                          setLoading(false);
                        }
                      }}
                    >
                      Load Strategies
                    </Button>
                  </Stack>

                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Strategy ID</TableCell>
                          <TableCell>Name</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>User ID</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Created</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {allStrategies.map((strategy) => (
                          <TableRow key={strategy.strategy_id}>
                            <TableCell>{strategy.strategy_id?.substring(0, 8)}...</TableCell>
                            <TableCell>{strategy.strategy_name}</TableCell>
                            <TableCell>
                              <Chip label={strategy.strategy_type || 'N/A'} size="small" />
                            </TableCell>
                            <TableCell>{strategy.user_id?.substring(0, 8)}...</TableCell>
                            <TableCell>
                              <Chip 
                                label={strategy.is_active ? 'ACTIVE' : 'INACTIVE'}
                                color={strategy.is_active ? 'success' : 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{new Date(strategy.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={1}>
                                <IconButton
                                  size="small"
                                  onClick={async () => {
                                    try {
                                      if (strategy.is_active) {
                                        await deactivateStrategy(strategy.strategy_id);
                                        setSuccess('Strategy deactivated');
                                      } else {
                                        await activateStrategy(strategy.strategy_id);
                                        setSuccess('Strategy activated');
                                      }
                                      const result = await getAllTradingStrategies();
                                      setAllStrategies(result);
                                    } catch (err) {
                                      setError(err.response?.data?.message || err.message);
                                    }
                                  }}
                                  title={strategy.is_active ? 'Deactivate' : 'Activate'}
                                >
                                  {strategy.is_active ? <Cancel /> : <CheckCircle />}
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={async () => {
                                    if (window.confirm('Delete this strategy?')) {
                                      try {
                                        await deleteTradingStrategy(strategy.strategy_id);
                                        setSuccess('Strategy deleted');
                                        const result = await getAllTradingStrategies();
                                        setAllStrategies(result);
                                      } catch (err) {
                                        setError(err.response?.data?.message || err.message);
                                      }
                                    }
                                  }}
                                >
                                  <Delete />
                                </IconButton>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  {allStrategies.length === 0 && (
                    <Alert severity="info">No strategies found. Click "Load Strategies" to fetch data.</Alert>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </TabPanel>

          {/* TAB 2: Strategy by ID */}
          <TabPanel value={strategiesTab} index={2}>
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="h4" gutterBottom>Search Strategy by ID</Typography>
                  <TextField
                    fullWidth
                    label="Strategy ID"
                    value={strategyFilters.strategy_id}
                    onChange={(e) => setStrategyFilters({...strategyFilters, strategy_id: e.target.value})}
                    placeholder="Enter strategy UUID"
                  />
                  <Button
                    variant="contained"
                    startIcon={<Search />}
                    onClick={async () => {
                      try {
                        setLoading(true);
                        const result = await getTradingStrategyById(strategyFilters.strategy_id);
                        setSelectedStrategy(result);
                        setSuccess('Strategy loaded');
                      } catch (err) {
                        setError(err.response?.data?.message || err.message);
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    Get Strategy
                  </Button>

                  {selectedStrategy && (
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h5" gutterBottom>Strategy Details</Typography>
                        <Divider sx={{ my: 2 }} />
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <Typography><strong>Strategy ID:</strong></Typography>
                            <Typography variant="body2">{selectedStrategy.strategy_id}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography><strong>Name:</strong></Typography>
                            <Typography variant="h6">{selectedStrategy.strategy_name}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography><strong>Type:</strong></Typography>
                            <Chip label={selectedStrategy.strategy_type || 'N/A'} />
                          </Grid>
                          <Grid item xs={6}>
                            <Typography><strong>User ID:</strong></Typography>
                            <Typography variant="body2">{selectedStrategy.user_id}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography><strong>Status:</strong></Typography>
                            <Chip 
                              label={selectedStrategy.is_active ? 'ACTIVE' : 'INACTIVE'}
                              color={selectedStrategy.is_active ? 'success' : 'default'}
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <Typography><strong>Description:</strong></Typography>
                            <Typography>{selectedStrategy.description || 'No description'}</Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography><strong>Parameters:</strong></Typography>
                            <TextField
                              fullWidth
                              multiline
                              rows={5}
                              value={JSON.stringify(selectedStrategy.parameters || {}, null, 2)}
                              InputProps={{ readOnly: true }}
                              variant="outlined"
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <Typography><strong>Created:</strong></Typography>
                            <Typography>{new Date(selectedStrategy.createdAt).toLocaleString()}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography><strong>Updated:</strong></Typography>
                            <Typography>{new Date(selectedStrategy.updatedAt).toLocaleString()}</Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </TabPanel>

          {/* TAB 3: Backtest */}
          <TabPanel value={strategiesTab} index={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" gutterBottom>Backtest Strategy</Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Test your strategy against historical data
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label="Strategy ID"
                    value={strategyFilters.strategy_id}
                    onChange={(e) => setStrategyFilters({...strategyFilters, strategy_id: e.target.value})}
                    placeholder="Enter strategy UUID"
                  />
                  <TextField
                    fullWidth
                    label="From Date"
                    type="date"
                    value={backtestParams.from}
                    onChange={(e) => setBacktestParams({...backtestParams, from: e.target.value})}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    fullWidth
                    label="To Date"
                    type="date"
                    value={backtestParams.to}
                    onChange={(e) => setBacktestParams({...backtestParams, to: e.target.value})}
                    InputLabelProps={{ shrink: true }}
                  />
                  <Button
                    variant="contained"
                    startIcon={<History />}
                    onClick={async () => {
                      try {
                        setLoading(true);
                        const result = await backtestStrategy(
                          strategyFilters.strategy_id,
                          backtestParams
                        );
                        setBacktestResults(result);
                        setSuccess('Backtest completed');
                      } catch (err) {
                        setError(err.response?.data?.message || err.message);
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    Run Backtest
                  </Button>

                  {backtestResults && (
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h5" gutterBottom>Backtest Results</Typography>
                        <Divider sx={{ my: 2 }} />
                        
                        <Typography variant="h6" sx={{ mt: 2 }}>Metrics</Typography>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                          <Grid item xs={3}>
                            <Typography variant="body2">Total Orders</Typography>
                            <Typography variant="h6">{backtestResults.metrics?.totalOrders || 0}</Typography>
                          </Grid>
                          <Grid item xs={3}>
                            <Typography variant="body2">Executed</Typography>
                            <Typography variant="h6">{backtestResults.metrics?.executedOrders || 0}</Typography>
                          </Grid>
                          <Grid item xs={3}>
                            <Typography variant="body2">Execution Rate</Typography>
                            <Typography variant="h6" color="primary">
                              {backtestResults.metrics?.executionRate || 0}%
                            </Typography>
                          </Grid>
                          <Grid item xs={3}>
                            <Typography variant="body2">Win Rate</Typography>
                            <Typography variant="h6" color="success.main">
                              {backtestResults.metrics?.winRate || 0}%
                            </Typography>
                          </Grid>
                        </Grid>

                        <Typography variant="h6" sx={{ mt: 3 }}>Performance</Typography>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                          <Grid item xs={4}>
                            <Typography variant="body2">Profit/Loss</Typography>
                            <Typography 
                              variant="h5" 
                              color={backtestResults.performance?.profitLoss >= 0 ? 'success.main' : 'error.main'}
                            >
                              ${backtestResults.performance?.profitLoss || 0}
                            </Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography variant="body2">P/L %</Typography>
                            <Typography 
                              variant="h5"
                              color={backtestResults.performance?.profitLossPercent >= 0 ? 'success.main' : 'error.main'}
                            >
                              {backtestResults.performance?.profitLossPercent || 0}%
                            </Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography variant="body2">Total Volume</Typography>
                            <Typography variant="h6">
                              {backtestResults.volume?.totalVolume || 0}
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </TabPanel>

          {/* TAB 4: Performance */}
          <TabPanel value={strategiesTab} index={4}>
            <Card>
              <CardContent>
                <Typography variant="h4" gutterBottom>Strategy Performance</Typography>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label="Strategy ID"
                    value={strategyFilters.strategy_id}
                    onChange={(e) => setStrategyFilters({...strategyFilters, strategy_id: e.target.value})}
                    placeholder="Enter strategy UUID"
                  />
                  <Button
                    variant="contained"
                    startIcon={<TrendingUp />}
                    onClick={async () => {
                      try {
                        setLoading(true);
                        const result = await getStrategyPerformance(strategyFilters.strategy_id);
                        setPerformanceData(result);
                        setSuccess('Performance data loaded');
                      } catch (err) {
                        setError(err.response?.data?.message || err.message);
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    Get Performance
                  </Button>

                  {performanceData && (
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h5" gutterBottom>Performance Summary</Typography>
                        <Divider sx={{ my: 2 }} />
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography><strong>Total Return:</strong></Typography>
                            <Typography variant="h5" color="primary">
                              {performanceData.summary?.totalReturn || 0}%
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography><strong>Max Drawdown:</strong></Typography>
                            <Typography variant="h5" color="error">
                              {performanceData.summary?.maxDrawdown || 0}%
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography><strong>Sharpe Ratio:</strong></Typography>
                            <Typography variant="h6">
                              {performanceData.summary?.sharpeRatio || 0}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography><strong>Win Rate:</strong></Typography>
                            <Typography variant="h6" color="success.main">
                              {performanceData.summary?.winRate || 0}%
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </TabPanel>

          {/* TAB 5: Run Strategy */}
          <TabPanel value={strategiesTab} index={5}>
            <Card>
              <CardContent>
                <Typography variant="h4" gutterBottom>Run Strategy Once</Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Execute the strategy to generate trading signals and create orders
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label="Strategy ID"
                    value={strategyFilters.strategy_id}
                    onChange={(e) => setStrategyFilters({...strategyFilters, strategy_id: e.target.value})}
                    placeholder="Enter strategy UUID"
                  />
                  <Alert severity="warning">
                    <strong>Warning:</strong> This will create real orders if signals are generated. Make sure the strategy is properly configured.
                  </Alert>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<PlayArrow />}
                    onClick={async () => {
                      if (!window.confirm('Are you sure you want to run this strategy? This may create real orders.')) {
                        return;
                      }
                      try {
                        setLoading(true);
                        const result = await runStrategyOnce(strategyFilters.strategy_id);
                        setRunResults(result);
                        setSuccess(result.message || 'Strategy executed successfully');
                      } catch (err) {
                        setError(err.response?.data?.message || err.message);
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    Run Strategy Now
                  </Button>

                  {runResults && (
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h5" gutterBottom>Execution Results</Typography>
                        <Divider sx={{ my: 2 }} />
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography><strong>Strategy ID:</strong></Typography>
                            <Typography>{runResults.strategyId?.substring(0, 8)}...</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography><strong>Timestamp:</strong></Typography>
                            <Typography>{new Date(runResults.timestamp).toLocaleString()}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography><strong>Current Price:</strong></Typography>
                            <Typography variant="h6" color="primary">
                              ${runResults.currentPrice}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography><strong>Signals Generated:</strong></Typography>
                            <Typography variant="h6">
                              {runResults.signals?.length || 0}
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography><strong>Orders Created:</strong></Typography>
                            <Typography variant="h6" color="success.main">
                              {runResults.orders?.length || 0}
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography><strong>Message:</strong></Typography>
                            <Typography>{runResults.message}</Typography>
                          </Grid>
                        </Grid>

                        {runResults.orders && runResults.orders.length > 0 && (
                          <>
                            <Typography variant="h6" sx={{ mt: 3 }}>Created Orders</Typography>
                            <TableContainer sx={{ mt: 1 }}>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Order ID</TableCell>
                                    <TableCell>Side</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Quantity</TableCell>
                                    <TableCell>Price</TableCell>
                                    <TableCell>Status</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {runResults.orders.map((order) => (
                                    <TableRow key={order.order_id}>
                                      <TableCell>{order.order_id?.substring(0, 8)}...</TableCell>
                                      <TableCell>
                                        <Chip label={order.side} size="small" color={order.side === 'BUY' ? 'success' : 'error'} />
                                      </TableCell>
                                      <TableCell>{order.order_type}</TableCell>
                                      <TableCell>{order.quantity}</TableCell>
                                      <TableCell>${order.price || 'MARKET'}</TableCell>
                                      <TableCell>
                                        <Chip label={order.status} size="small" />
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </TabPanel>
        </Box>
      )}
    </MainCard>
  );
};

export default TradingHub;
