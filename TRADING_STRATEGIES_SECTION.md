# ✅ Trading Strategies Management Section - Code à Ajouter

## 📍 Où Ajouter Ce Code

À la fin de `TradingHub.jsx`, **avant** la ligne `</MainCard>` et **après** la section Order Executions (ligne ~2090).

---

## 📋 Code Complet de la Section

```jsx
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
                                      // Reload
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
                        
                        {/* Metrics */}
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

                        {/* Performance */}
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

                        {/* Orders Table */}
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
```

---

## 📍 Instructions d'Ajout

1. **Ouvrir** `TradingHub.jsx`
2. **Chercher** la ligne `{/* ========== ORDER EXECUTIONS MANAGEMENT SECTION ========== */}`
3. **Descendre** jusqu'à la fin de cette section (avant `</MainCard>`)
4. **Coller** tout le code ci-dessus
5. **Sauvegarder**
6. **Rafraîchir** le navigateur

---

## ✅ États Déjà Ajoutés

Ces états ont déjà été ajoutés dans TradingHub:
- ✅ `strategiesTab`
- ✅ `allStrategies`
- ✅ `selectedStrategy`
- ✅ `backtestResults`
- ✅ `performanceData`
- ✅ `runResults`
- ✅ `newStrategy`
- ✅ `strategyFilters`
- ✅ `backtestParams`

---

## ✅ Imports Déjà Ajoutés

- ✅ API Trading Strategies importée
- ✅ Navigation avec 4 sections
- ✅ Bouton "Trading Strategies Management"

---

## 🎯 6 Onglets Inclus

1. **Create Strategy** - Formulaire de création
2. **All Strategies** - Liste avec actions (activate/deactivate/delete)
3. **Strategy by ID** - Recherche détaillée
4. **Backtest** - Test sur données historiques
5. **Performance** - Métriques de performance
6. **Run Strategy** - Exécution manuelle

---

## 🚀 Après Ajout

1. **Rafraîchir** (F5)
2. **Cliquer** "Trading Strategies Management"
3. **Voir** les 6 onglets
4. **Créer** une stratégie
5. **Tester** le backtest et l'exécution

**La section sera opérationnelle!** 🎉
