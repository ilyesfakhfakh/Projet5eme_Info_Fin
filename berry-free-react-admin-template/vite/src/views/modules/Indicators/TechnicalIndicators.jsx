import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Calculate as CalculateIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  ShowChart as ShowChartIcon,
  Edit as EditIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import MainCard from 'ui-component/cards/MainCard';
import * as technicalIndicatorAPI from 'api/technicalIndicators';

const TechnicalIndicatorsPage = () => {
  // === State Management ===
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Main data
  const [indicators, setIndicators] = useState([]);
  const [selectedIndicator, setSelectedIndicator] = useState(null);
  const [assets, setAssets] = useState([]);

  // Form states for Create Indicator
  const [newIndicator, setNewIndicator] = useState({
    asset_id: '',
    indicator_type: '',
    period: 14,
    parameters: {}
  });

  // Search states
  const [searchId, setSearchId] = useState('');
  const [searchAssetId, setSearchAssetId] = useState('');
  const [searchType, setSearchType] = useState('');

  // Calculate states
  const [calculateData, setCalculateData] = useState({
    indicatorId: '',
    assetId: '',
    period: ''
  });

  // Signal states
  const [signalData, setSignalData] = useState({
    indicatorValue: '',
    indicatorType: ''
  });
  const [signalResult, setSignalResult] = useState(null);

  // Trend states
  const [trendData, setTrendData] = useState({
    indicatorId: '',
    assetId: ''
  });
  const [trendResult, setTrendResult] = useState(null);

  // Combine states
  const [combineData, setCombineData] = useState({
    primaryId: '',
    secondaryId: '',
    assetId: ''
  });
  const [combineResult, setCombineResult] = useState(null);

  // Performance states
  const [performanceData, setPerformanceData] = useState({
    indicatorId: '',
    assetId: '',
    startDate: '',
    endDate: ''
  });
  const [performanceResult, setPerformanceResult] = useState(null);

  // Values states
  const [indicatorValues, setIndicatorValues] = useState([]);

  // === Helper Functions ===
  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleError = (err) => {
    console.error(err);
    setError(err.message || 'Une erreur est survenue');
    setSuccess(null);
  };

  const handleSuccess = (message) => {
    setSuccess(message);
    setError(null);
  };

  // === API Calls ===

  // Load all indicators
  const loadIndicators = async () => {
    try {
      setLoading(true);
      clearMessages();
      const data = await technicalIndicatorAPI.getTechnicalIndicators();
      setIndicators(data);
      handleSuccess('Indicateurs chargés avec succès');
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  // Create indicator
  const handleCreateIndicator = async () => {
    try {
      setLoading(true);
      clearMessages();
      await technicalIndicatorAPI.createTechnicalIndicator(newIndicator);
      handleSuccess('Indicateur créé avec succès');
      setNewIndicator({
        asset_id: '',
        indicator_type: '',
        period: 14,
        parameters: {}
      });
      loadIndicators();
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  // Delete indicator
  const handleDeleteIndicator = async (indicatorId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet indicateur?')) return;
    
    try {
      setLoading(true);
      clearMessages();
      await technicalIndicatorAPI.deleteTechnicalIndicator(indicatorId);
      handleSuccess('Indicateur supprimé avec succès');
      loadIndicators();
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate indicator
  const handleCalculateIndicator = async (indicatorId) => {
    try {
      setLoading(true);
      clearMessages();
      const result = await technicalIndicatorAPI.calculateTechnicalIndicator(indicatorId);
      handleSuccess('Indicateur calculé avec succès');
      return result;
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  // Search by ID
  const handleSearchById = async () => {
    if (!searchId) {
      setError('Veuillez entrer un ID');
      return;
    }
    
    try {
      setLoading(true);
      clearMessages();
      const data = await technicalIndicatorAPI.getTechnicalIndicatorById(searchId);
      setSelectedIndicator(data);
      handleSuccess('Indicateur trouvé');
    } catch (err) {
      handleError(err);
      setSelectedIndicator(null);
    } finally {
      setLoading(false);
    }
  };

  // Search by Asset
  const handleSearchByAsset = async () => {
    if (!searchAssetId) {
      setError('Veuillez entrer un Asset ID');
      return;
    }
    
    try {
      setLoading(true);
      clearMessages();
      const data = await technicalIndicatorAPI.getTechnicalIndicatorsByAsset(searchAssetId);
      setIndicators(data);
      handleSuccess(`${data.length} indicateur(s) trouvé(s)`);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  // Search by Type
  const handleSearchByType = async () => {
    if (!searchType) {
      setError('Veuillez sélectionner un type');
      return;
    }
    
    try {
      setLoading(true);
      clearMessages();
      const data = await technicalIndicatorAPI.getTechnicalIndicatorsByType(searchType);
      setIndicators(data);
      handleSuccess(`${data.length} indicateur(s) trouvé(s)`);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate for asset
  const handleCalculateForAsset = async () => {
    try {
      setLoading(true);
      clearMessages();
      const result = await technicalIndicatorAPI.calculateIndicatorForAsset(
        calculateData.indicatorId,
        calculateData.assetId,
        calculateData.period
      );
      handleSuccess('Calcul effectué avec succès');
      console.log('Calculate result:', result);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  // Generate signal
  const handleGenerateSignal = async () => {
    try {
      setLoading(true);
      clearMessages();
      const result = await technicalIndicatorAPI.generateSignal(
        signalData.indicatorValue,
        signalData.indicatorType
      );
      setSignalResult(result);
      handleSuccess('Signal généré avec succès');
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  // Detect trend
  const handleDetectTrend = async () => {
    try {
      setLoading(true);
      clearMessages();
      const result = await technicalIndicatorAPI.detectTrend(
        trendData.indicatorId,
        trendData.assetId
      );
      setTrendResult(result);
      handleSuccess('Tendance détectée avec succès');
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  // Combine indicators
  const handleCombineIndicators = async () => {
    try {
      setLoading(true);
      clearMessages();
      const result = await technicalIndicatorAPI.combineIndicators(
        combineData.primaryId,
        combineData.secondaryId,
        combineData.assetId
      );
      setCombineResult(result);
      handleSuccess('Indicateurs combinés avec succès');
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  // Evaluate performance
  const handleEvaluatePerformance = async () => {
    try {
      setLoading(true);
      clearMessages();
      const result = await technicalIndicatorAPI.evaluatePerformance(
        performanceData.indicatorId,
        performanceData.assetId,
        performanceData.startDate,
        performanceData.endDate
      );
      setPerformanceResult(result);
      handleSuccess('Performance évaluée avec succès');
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  // Get indicator values
  const handleGetIndicatorValues = async (indicatorId) => {
    try {
      setLoading(true);
      clearMessages();
      const data = await technicalIndicatorAPI.getTechnicalIndicatorValues(indicatorId);
      setIndicatorValues(data);
      handleSuccess('Valeurs chargées avec succès');
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  // Batch recalculate
  const handleBatchRecalculate = async () => {
    if (!window.confirm('Recalculer tous les indicateurs? Cela peut prendre du temps.')) return;
    
    try {
      setLoading(true);
      clearMessages();
      await technicalIndicatorAPI.batchRecalculateIndicators();
      handleSuccess('Tous les indicateurs recalculés avec succès');
      loadIndicators();
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  // === Effects ===
  useEffect(() => {
    loadIndicators();
  }, []);

  // === Render Functions ===

  // Tab 1: Create Indicator
  const renderCreateTab = () => (
    <Card>
      <CardContent>
        <Typography variant="h4" gutterBottom>
          Créer un Nouvel Indicateur Technique
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Asset ID"
              value={newIndicator.asset_id}
              onChange={(e) => setNewIndicator({ ...newIndicator, asset_id: e.target.value })}
              placeholder="btc-001"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Type d'Indicateur</InputLabel>
              <Select
                value={newIndicator.indicator_type}
                onChange={(e) => setNewIndicator({ ...newIndicator, indicator_type: e.target.value })}
              >
                <MenuItem value="SMA">SMA (Simple Moving Average)</MenuItem>
                <MenuItem value="EMA">EMA (Exponential Moving Average)</MenuItem>
                <MenuItem value="RSI">RSI (Relative Strength Index)</MenuItem>
                <MenuItem value="MACD">MACD</MenuItem>
                <MenuItem value="BOLLINGER">Bollinger Bands</MenuItem>
                <MenuItem value="STOCHASTIC">Stochastic Oscillator</MenuItem>
                <MenuItem value="ATR">ATR (Average True Range)</MenuItem>
                <MenuItem value="ADX">ADX (Average Directional Index)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Période"
              value={newIndicator.period}
              onChange={(e) => setNewIndicator({ ...newIndicator, period: parseInt(e.target.value) })}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Paramètres (JSON)"
              value={JSON.stringify(newIndicator.parameters)}
              onChange={(e) => {
                try {
                  setNewIndicator({ ...newIndicator, parameters: JSON.parse(e.target.value) });
                } catch (err) {
                  // Invalid JSON, ignore
                }
              }}
              placeholder='{"key": "value"}'
            />
          </Grid>
          
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateIndicator}
              disabled={loading || !newIndicator.asset_id || !newIndicator.indicator_type}
              startIcon={<AddIcon />}
            >
              Créer l'Indicateur
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  // Tab 2: List All Indicators
  const renderListTab = () => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4">
            Tous les Indicateurs ({indicators.length})
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              onClick={loadIndicators}
              startIcon={<RefreshIcon />}
            >
              Rafraîchir
            </Button>
            <Button
              variant="contained"
              color="warning"
              onClick={handleBatchRecalculate}
              startIcon={<CalculateIcon />}
            >
              Tout Recalculer
            </Button>
          </Stack>
        </Box>
        
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Asset ID</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Période</TableCell>
                <TableCell>Dernière Calcul</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {indicators.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Aucun indicateur trouvé
                  </TableCell>
                </TableRow>
              ) : (
                indicators.map((indicator) => (
                  <TableRow key={indicator.indicator_id || indicator.id}>
                    <TableCell>{indicator.indicator_id || indicator.id}</TableCell>
                    <TableCell>{indicator.asset_id}</TableCell>
                    <TableCell>
                      <Chip label={indicator.indicator_type || indicator.type} color="primary" size="small" />
                    </TableCell>
                    <TableCell>{indicator.period}</TableCell>
                    <TableCell>
                      {indicator.last_calculation_date 
                        ? new Date(indicator.last_calculation_date).toLocaleString()
                        : 'Jamais'}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleCalculateIndicator(indicator.indicator_id || indicator.id)}
                        title="Calculer"
                      >
                        <CalculateIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="info"
                        onClick={() => handleGetIndicatorValues(indicator.indicator_id || indicator.id)}
                        title="Voir valeurs"
                      >
                        <ShowChartIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteIndicator(indicator.indicator_id || indicator.id)}
                        title="Supprimer"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  // Tab 3: Search Indicators
  const renderSearchTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Recherche par ID
            </Typography>
            <TextField
              fullWidth
              label="Indicator ID"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              margin="normal"
            />
            <Button
              fullWidth
              variant="contained"
              onClick={handleSearchById}
              disabled={loading || !searchId}
              sx={{ mt: 2 }}
            >
              Rechercher
            </Button>
            
            {selectedIndicator && (
              <Box mt={3}>
                <Typography variant="subtitle2" color="textSecondary">
                  Résultat:
                </Typography>
                <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
                  {JSON.stringify(selectedIndicator, null, 2)}
                </pre>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Recherche par Asset
            </Typography>
            <TextField
              fullWidth
              label="Asset ID"
              value={searchAssetId}
              onChange={(e) => setSearchAssetId(e.target.value)}
              margin="normal"
              placeholder="btc-001"
            />
            <Button
              fullWidth
              variant="contained"
              onClick={handleSearchByAsset}
              disabled={loading || !searchAssetId}
              sx={{ mt: 2 }}
            >
              Rechercher
            </Button>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Recherche par Type
            </Typography>
            <FormControl fullWidth margin="normal">
              <InputLabel>Type d'Indicateur</InputLabel>
              <Select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
              >
                <MenuItem value="SMA">SMA</MenuItem>
                <MenuItem value="EMA">EMA</MenuItem>
                <MenuItem value="RSI">RSI</MenuItem>
                <MenuItem value="MACD">MACD</MenuItem>
                <MenuItem value="BOLLINGER">Bollinger</MenuItem>
                <MenuItem value="STOCHASTIC">Stochastic</MenuItem>
                <MenuItem value="ATR">ATR</MenuItem>
                <MenuItem value="ADX">ADX</MenuItem>
              </Select>
            </FormControl>
            <Button
              fullWidth
              variant="contained"
              onClick={handleSearchByType}
              disabled={loading || !searchType}
              sx={{ mt: 2 }}
            >
              Rechercher
            </Button>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Tab 4: Calculate & Values
  const renderCalculateTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Calculer pour Asset/Période
            </Typography>
            <TextField
              fullWidth
              label="Indicator ID"
              value={calculateData.indicatorId}
              onChange={(e) => setCalculateData({ ...calculateData, indicatorId: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Asset ID"
              value={calculateData.assetId}
              onChange={(e) => setCalculateData({ ...calculateData, assetId: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Période"
              value={calculateData.period}
              onChange={(e) => setCalculateData({ ...calculateData, period: e.target.value })}
              margin="normal"
            />
            <Button
              fullWidth
              variant="contained"
              onClick={handleCalculateForAsset}
              disabled={loading}
              sx={{ mt: 2 }}
              startIcon={<CalculateIcon />}
            >
              Calculer
            </Button>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Valeurs d'Indicateur
            </Typography>
            {indicatorValues.length > 0 && (
              <TableContainer component={Paper} sx={{ maxHeight: 400, mt: 2 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Valeur</TableCell>
                      <TableCell>Signal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {indicatorValues.map((value, index) => (
                      <TableRow key={index}>
                        <TableCell>{value.calculation_date || value.date || index}</TableCell>
                        <TableCell>{value.value || value.indicator_value || 'N/A'}</TableCell>
                        <TableCell>
                          {value.signal && (
                            <Chip 
                              label={value.signal} 
                              color={value.signal === 'BUY' ? 'success' : value.signal === 'SELL' ? 'error' : 'default'}
                              size="small"
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Tab 5: Signals & Trends
  const renderSignalsTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Générer Signal
            </Typography>
            <TextField
              fullWidth
              label="Valeur Indicateur"
              type="number"
              value={signalData.indicatorValue}
              onChange={(e) => setSignalData({ ...signalData, indicatorValue: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Type Indicateur"
              value={signalData.indicatorType}
              onChange={(e) => setSignalData({ ...signalData, indicatorType: e.target.value })}
              margin="normal"
              placeholder="RSI"
            />
            <Button
              fullWidth
              variant="contained"
              onClick={handleGenerateSignal}
              disabled={loading}
              sx={{ mt: 2 }}
              startIcon={<TrendingUpIcon />}
            >
              Générer Signal
            </Button>
            
            {signalResult && (
              <Box mt={3}>
                <Alert severity="info">
                  Signal: <strong>{signalResult.data?.signal || 'NEUTRAL'}</strong>
                </Alert>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Détecter Tendance
            </Typography>
            <TextField
              fullWidth
              label="Indicator ID"
              value={trendData.indicatorId}
              onChange={(e) => setTrendData({ ...trendData, indicatorId: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Asset ID"
              value={trendData.assetId}
              onChange={(e) => setTrendData({ ...trendData, assetId: e.target.value })}
              margin="normal"
            />
            <Button
              fullWidth
              variant="contained"
              onClick={handleDetectTrend}
              disabled={loading}
              sx={{ mt: 2 }}
              startIcon={<TrendingUpIcon />}
            >
              Détecter Tendance
            </Button>
            
            {trendResult && (
              <Box mt={3}>
                <Alert severity="info">
                  Tendance: <strong>{trendResult.data?.trend || 'UNKNOWN'}</strong>
                </Alert>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Combiner Indicateurs
            </Typography>
            <TextField
              fullWidth
              label="Primary Indicator ID"
              value={combineData.primaryId}
              onChange={(e) => setCombineData({ ...combineData, primaryId: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Secondary Indicator ID"
              value={combineData.secondaryId}
              onChange={(e) => setCombineData({ ...combineData, secondaryId: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Asset ID"
              value={combineData.assetId}
              onChange={(e) => setCombineData({ ...combineData, assetId: e.target.value })}
              margin="normal"
            />
            <Button
              fullWidth
              variant="contained"
              onClick={handleCombineIndicators}
              disabled={loading}
              sx={{ mt: 2 }}
            >
              Combiner
            </Button>
            
            {combineResult && (
              <Box mt={3}>
                <Alert severity="success">
                  Signal combiné: <strong>{combineResult.data?.signal || 'N/A'}</strong>
                </Alert>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Tab 6: Performance
  const renderPerformanceTab = () => (
    <Card>
      <CardContent>
        <Typography variant="h4" gutterBottom>
          Évaluer la Performance
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Indicator ID"
              value={performanceData.indicatorId}
              onChange={(e) => setPerformanceData({ ...performanceData, indicatorId: e.target.value })}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Asset ID"
              value={performanceData.assetId}
              onChange={(e) => setPerformanceData({ ...performanceData, assetId: e.target.value })}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              type="date"
              label="Date Début"
              value={performanceData.startDate}
              onChange={(e) => setPerformanceData({ ...performanceData, startDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              type="date"
              label="Date Fin"
              value={performanceData.endDate}
              onChange={(e) => setPerformanceData({ ...performanceData, endDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleEvaluatePerformance}
              disabled={loading}
              startIcon={<AssessmentIcon />}
            >
              Évaluer Performance
            </Button>
          </Grid>
        </Grid>
        
        {performanceResult && (
          <Box mt={4}>
            <Typography variant="h5" gutterBottom>
              Résultats de Performance
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6">Win Rate</Typography>
                  <Typography variant="h4" color="primary">
                    {performanceResult.data?.winRate || '0'}%
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6">Total Trades</Typography>
                  <Typography variant="h4">
                    {performanceResult.data?.totalTrades || 0}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6">Profit Factor</Typography>
                  <Typography variant="h4" color="success.main">
                    {performanceResult.data?.profitFactor || '0'}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6">Sharpe Ratio</Typography>
                  <Typography variant="h4">
                    {performanceResult.data?.sharpeRatio || '0'}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  // === Main Render ===
  return (
    <MainCard title="Gestion des Indicateurs Techniques">
      <Box sx={{ width: '100%' }}>
        {/* Messages */}
        {error && (
          <Alert severity="error" onClose={clearMessages} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" onClose={clearMessages} sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
        
        {/* Loading Indicator */}
        {loading && (
          <Box display="flex" justifyContent="center" my={2}>
            <CircularProgress />
          </Box>
        )}
        
        {/* Tabs */}
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
          <Tab label="Créer" />
          <Tab label="Liste" />
          <Tab label="Rechercher" />
          <Tab label="Calculer" />
          <Tab label="Signaux & Tendances" />
          <Tab label="Performance" />
        </Tabs>
        
        {/* Tab Content */}
        <Box sx={{ py: 2 }}>
          {activeTab === 0 && renderCreateTab()}
          {activeTab === 1 && renderListTab()}
          {activeTab === 2 && renderSearchTab()}
          {activeTab === 3 && renderCalculateTab()}
          {activeTab === 4 && renderSignalsTab()}
          {activeTab === 5 && renderPerformanceTab()}
        </Box>
      </Box>
    </MainCard>
  );
};

export default TechnicalIndicatorsPage;
