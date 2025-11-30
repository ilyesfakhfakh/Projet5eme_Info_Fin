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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Calculate as CalculateIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  ShowChart as ShowChartIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import MainCard from 'ui-component/cards/MainCard';
import { http } from 'api/http';

const TechnicalIndicatorsPage = () => {
  // === State Management ===
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [indicators, setIndicators] = useState([]);
  const [newIndicator, setNewIndicator] = useState({
    asset_id: '',
    indicator_type: '',
    period: 12,
    value: null,
    parameters: {}
  });
  
  // Search states
  const [searchId, setSearchId] = useState('');
  const [selectedIndicator, setSelectedIndicator] = useState(null);
  const [searchAssetId, setSearchAssetId] = useState('');
  const [searchType, setSearchType] = useState('');
  
  // Calculate states
  const [calculateId, setCalculateId] = useState('');
  const [indicatorValues, setIndicatorValues] = useState([]);
  
  // Signal states
  const [signalValue, setSignalValue] = useState('');
  const [signalType, setSignalType] = useState('');
  const [signalResult, setSignalResult] = useState(null);
  
  // Performance states
  const [perfIndicatorId, setPerfIndicatorId] = useState('');
  const [perfAssetId, setPerfAssetId] = useState('');
  const [perfStartDate, setPerfStartDate] = useState('');
  const [perfEndDate, setPerfEndDate] = useState('');
  const [performanceResult, setPerformanceResult] = useState(null);
  
  // Indicator Values states
  const [indicatorValues2, setIndicatorValues2] = useState([]);
  const [newValue, setNewValue] = useState({
    indicator_id: '',
    timestamp: '',
    value: '',
    signal: 'HOLD'
  });
  const [searchValueId, setSearchValueId] = useState('');
  const [searchValueIndicatorId, setSearchValueIndicatorId] = useState('');
  const [searchValueSignal, setSearchValueSignal] = useState('');
  const [selectedValue, setSelectedValue] = useState(null);
  const [valueStartDate, setValueStartDate] = useState('');
  const [valueEndDate, setValueEndDate] = useState('');
  
  // Price states
  const [priceAssetId, setPriceAssetId] = useState('');
  const [currentPrice, setCurrentPrice] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [priceFrom, setPriceFrom] = useState('');
  const [priceTo, setPriceTo] = useState('');
  const [priceInterval, setPriceInterval] = useState('1h');
  const [vwapData, setVwapData] = useState(null);
  const [ohlcvData, setOhlcvData] = useState([]);
  const [tickerData, setTickerData] = useState(null);
  const [generateInterval, setGenerateInterval] = useState('1h');
  const [generateHours, setGenerateHours] = useState(24);
  
  // Calculator states
  const [calcPrices, setCalcPrices] = useState('');
  const [calcPeriod, setCalcPeriod] = useState(14);
  const [calcResult, setCalcResult] = useState(null);
  const [calcType, setCalcType] = useState('SMA');
  const [macdFast, setMacdFast] = useState(12);
  const [macdSlow, setMacdSlow] = useState(26);
  const [macdSignal, setMacdSignal] = useState(9);
  const [bbStdDev, setBbStdDev] = useState(2);
  const [signalIndicatorType, setSignalIndicatorType] = useState('RSI');
  const [signalCurrentValue, setSignalCurrentValue] = useState('');
  const [signalPreviousValue, setSignalPreviousValue] = useState('');
  const [calcSignalResult, setCalcSignalResult] = useState(null);
  const [examples, setExamples] = useState(null);

  // === Helper Functions ===
  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  // === API Calls ===
  const loadIndicators = async () => {
    try {
      setLoading(true);
      clearMessages();
      const data = await http.get('/technical-indicator/technical-indicators');
      setIndicators(data);
      setSuccess('Indicateurs chargés avec succès');
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIndicator = async () => {
    try {
      setLoading(true);
      clearMessages();
      await http.post('/technical-indicator/technical-indicators', newIndicator);
      setSuccess('Indicateur créé avec succès');
      setNewIndicator({
        asset_id: '',
        indicator_type: '',
        period: 14,
        value: null,
        parameters: {}
      });
      loadIndicators();
    } catch (err) {
      setError(err.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIndicator = async (indicatorId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet indicateur?')) return;
    
    try {
      setLoading(true);
      clearMessages();
      await http.del(`/technical-indicator/technical-indicators/${indicatorId}`);
      setSuccess('Indicateur supprimé avec succès');
      loadIndicators();
    } catch (err) {
      setError(err.message || 'Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  // Search functions
  const handleSearchById = async () => {
    if (!searchId) {
      setError('Veuillez entrer un ID');
      return;
    }
    try {
      setLoading(true);
      clearMessages();
      const data = await http.get(`/technical-indicator/technical-indicators/${searchId}`);
      setSelectedIndicator(data);
      setSuccess('Indicateur trouvé');
    } catch (err) {
      setError(err.message || 'Indicateur introuvable');
      setSelectedIndicator(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchByAsset = async () => {
    if (!searchAssetId) {
      setError('Veuillez entrer un Asset ID');
      return;
    }
    try {
      setLoading(true);
      clearMessages();
      const data = await http.get(`/technical-indicator/technical-indicators/asset/${searchAssetId}`);
      setIndicators(data);
      setSuccess(`${data.length} indicateur(s) trouvé(s)`);
    } catch (err) {
      setError(err.message || 'Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchByType = async () => {
    if (!searchType) {
      setError('Veuillez sélectionner un type');
      return;
    }
    try {
      setLoading(true);
      clearMessages();
      const data = await http.get(`/technical-indicator/technical-indicators/type/${searchType}`);
      setIndicators(data);
      setSuccess(`${data.length} indicateur(s) trouvé(s)`);
    } catch (err) {
      setError(err.message || 'Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  // Calculate functions
  const handleCalculateIndicator = async () => {
    if (!calculateId) {
      setError('Veuillez entrer un ID d\'indicateur');
      return;
    }
    try {
      setLoading(true);
      clearMessages();
      await http.post(`/technical-indicator/technical-indicators/${calculateId}/calculate`);
      setSuccess('Indicateur calculé avec succès');
    } catch (err) {
      const errorMsg = err.message || 'Erreur lors du calcul';
      setError(`${errorMsg}. Note: Cette fonction nécessite des données de prix historiques pour l'asset. Utilisez plutôt "Voir Valeurs" pour récupérer les valeurs existantes.`);
    } finally {
      setLoading(false);
    }
  };

  const handleGetIndicatorValues = async () => {
    if (!calculateId) {
      setError('Veuillez entrer un ID d\'indicateur');
      return;
    }
    try {
      setLoading(true);
      clearMessages();
      const data = await http.get(`/technical-indicator/technical-indicators/${calculateId}/values`);
      console.log('📊 Valeurs récupérées:', data);
      
      if (Array.isArray(data)) {
        setIndicatorValues(data);
        if (data.length === 0) {
          setSuccess('Requête réussie mais aucune valeur trouvée. L\'indicateur n\'a peut-être pas encore été calculé.');
        } else {
          setSuccess(`${data.length} valeur(s) chargée(s) avec succès`);
        }
      } else {
        setIndicatorValues([]);
        setSuccess('Données reçues mais format inattendu');
      }
    } catch (err) {
      setError(err.message || 'Erreur lors de la récupération des valeurs');
      setIndicatorValues([]);
    } finally {
      setLoading(false);
    }
  };

  // Signal functions
  const handleGenerateSignal = async () => {
    if (!signalValue || !signalType) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    try {
      setLoading(true);
      clearMessages();
      const result = await http.get(`/technical-indicator/signal/${signalValue}/${signalType}`);
      setSignalResult(result);
      setSuccess('Signal généré avec succès');
    } catch (err) {
      setError(err.message || 'Erreur lors de la génération du signal');
    } finally {
      setLoading(false);
    }
  };

  // Performance functions
  const handleEvaluatePerformance = async () => {
    if (!perfIndicatorId || !perfAssetId || !perfStartDate || !perfEndDate) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    try {
      setLoading(true);
      clearMessages();
      const result = await http.get(`/technical-indicator/${perfIndicatorId}/performance/${perfAssetId}`, {
        params: { startDate: perfStartDate, endDate: perfEndDate }
      });
      setPerformanceResult(result);
      setSuccess('Performance évaluée avec succès');
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'évaluation');
    } finally {
      setLoading(false);
    }
  };

  // Indicator Values functions
  const loadIndicatorValues = async () => {
    try {
      setLoading(true);
      clearMessages();
      const data = await http.get('/indicator-value');
      setIndicatorValues2(data);
      setSuccess(`${data.length} valeur(s) chargée(s)`);
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateValue = async () => {
    if (!newValue.indicator_id || !newValue.timestamp || !newValue.value) {
      setError('Veuillez remplir tous les champs requis');
      return;
    }
    try {
      setLoading(true);
      clearMessages();
      await http.post('/indicator-value', newValue);
      setSuccess('Valeur créée avec succès');
      setNewValue({ indicator_id: '', timestamp: '', value: '', signal: 'HOLD' });
      loadIndicatorValues();
    } catch (err) {
      setError(err.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteValue = async (valueId) => {
    if (!window.confirm('Supprimer cette valeur?')) return;
    try {
      setLoading(true);
      clearMessages();
      await http.del(`/indicator-value/${valueId}`);
      setSuccess('Valeur supprimée');
      loadIndicatorValues();
    } catch (err) {
      setError(err.message || 'Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchValueById = async () => {
    if (!searchValueId) {
      setError('Veuillez entrer un ID');
      return;
    }
    try {
      setLoading(true);
      clearMessages();
      const data = await http.get(`/indicator-value/${searchValueId}`);
      setSelectedValue(data);
      setSuccess('Valeur trouvée');
    } catch (err) {
      setError(err.message || 'Valeur introuvable');
      setSelectedValue(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchByIndicatorId = async () => {
    if (!searchValueIndicatorId) {
      setError('Veuillez entrer un Indicator ID');
      return;
    }
    try {
      setLoading(true);
      clearMessages();
      const data = await http.get(`/indicator-value/indicator/${searchValueIndicatorId}`);
      setIndicatorValues2(data);
      setSuccess(`${data.length} valeur(s) trouvée(s)`);
    } catch (err) {
      setError(err.message || 'Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchBySignal = async () => {
    if (!searchValueSignal) {
      setError('Veuillez sélectionner un signal');
      return;
    }
    try {
      setLoading(true);
      clearMessages();
      const data = await http.get(`/indicator-value/signal/${searchValueSignal}`);
      setIndicatorValues2(data);
      setSuccess(`${data.length} valeur(s) avec signal ${searchValueSignal}`);
    } catch (err) {
      setError(err.message || 'Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const handleGetLatestValue = async () => {
    if (!searchValueIndicatorId) {
      setError('Veuillez entrer un Indicator ID');
      return;
    }
    try {
      setLoading(true);
      clearMessages();
      const data = await http.get(`/indicator-value/indicator/${searchValueIndicatorId}/latest`);
      setSelectedValue(data);
      setSuccess('Dernière valeur récupérée');
    } catch (err) {
      setError(err.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const handleGetValuesByDateRange = async () => {
    if (!searchValueIndicatorId || !valueStartDate || !valueEndDate) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    try {
      setLoading(true);
      clearMessages();
      const data = await http.get(`/indicator-value/indicator/${searchValueIndicatorId}/range`, {
        params: { startDate: valueStartDate, endDate: valueEndDate }
      });
      setIndicatorValues2(data);
      setSuccess(`${data.length} valeur(s) trouvée(s) dans la période`);
    } catch (err) {
      setError(err.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  // Price functions
  const handleGetCurrentPrice = async () => {
    if (!priceAssetId) {
      setError('Veuillez entrer un Asset ID');
      return;
    }
    try {
      setLoading(true);
      clearMessages();
      const data = await http.get(`/price/${priceAssetId}/current`);
      setCurrentPrice(data);
      setSuccess('Prix actuel récupéré');
    } catch (err) {
      setError(err.message || 'Erreur lors de la récupération');
    } finally {
      setLoading(false);
    }
  };

  const handleGetPriceHistory = async () => {
    if (!priceAssetId) {
      setError('Veuillez entrer un Asset ID');
      return;
    }
    try {
      setLoading(true);
      clearMessages();
      const params = { interval: priceInterval };
      if (priceFrom) params.from = priceFrom;
      if (priceTo) params.to = priceTo;
      const data = await http.get(`/price/${priceAssetId}/history`, { params });
      setPriceHistory(data);
      setSuccess(`${data.length} prix récupérés`);
    } catch (err) {
      setError(err.message || 'Erreur lors de la récupération');
    } finally {
      setLoading(false);
    }
  };

  const handleGetVWAP = async () => {
    if (!priceAssetId) {
      setError('Veuillez entrer un Asset ID');
      return;
    }
    try {
      setLoading(true);
      clearMessages();
      const data = await http.get(`/price/${priceAssetId}/vwap`, {
        params: { period: priceInterval }
      });
      setVwapData(data);
      setSuccess('VWAP calculé');
    } catch (err) {
      setError(err.message || 'Erreur lors du calcul');
    } finally {
      setLoading(false);
    }
  };

  const handleGetOHLCV = async () => {
    if (!priceAssetId) {
      setError('Veuillez entrer un Asset ID');
      return;
    }
    try {
      setLoading(true);
      clearMessages();
      const params = { interval: priceInterval, limit: 100 };
      if (priceFrom) params.from = priceFrom;
      if (priceTo) params.to = priceTo;
      const data = await http.get(`/price/${priceAssetId}/ohlcv`, { params });
      setOhlcvData(data);
      setSuccess(`${data.length} données OHLCV récupérées`);
    } catch (err) {
      setError(err.message || 'Erreur lors de la récupération');
    } finally {
      setLoading(false);
    }
  };

  const handleGetTicker = async () => {
    if (!priceAssetId) {
      setError('Veuillez entrer un Asset ID');
      return;
    }
    try {
      setLoading(true);
      clearMessages();
      const data = await http.get(`/price/${priceAssetId}/ticker`);
      setTickerData(data);
      setSuccess('Ticker 24h récupéré');
    } catch (err) {
      setError(err.message || 'Erreur lors de la récupération');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateOHLCV = async () => {
    if (!priceAssetId) {
      setError('Veuillez entrer un Asset ID');
      return;
    }
    try {
      setLoading(true);
      clearMessages();
      await http.post(`/price/${priceAssetId}/ohlcv/generate`, {
        interval: generateInterval,
        hoursBack: generateHours
      });
      setSuccess(`OHLCV généré pour ${generateHours}h`);
    } catch (err) {
      setError(err.message || 'Erreur lors de la génération');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAllOHLCV = async () => {
    if (!window.confirm('Générer OHLCV pour tous les assets? Cette opération peut prendre du temps.')) return;
    try {
      setLoading(true);
      clearMessages();
      const result = await http.post('/price/ohlcv/generate-all', {
        interval: generateInterval,
        hoursBack: generateHours
      });
      setSuccess(`OHLCV généré pour tous les assets: ${JSON.stringify(result.results)}`);
    } catch (err) {
      setError(err.message || 'Erreur lors de la génération');
    } finally {
      setLoading(false);
    }
  };

  // Calculator functions
  const parsePrices = (pricesStr) => {
    try {
      return pricesStr.split(',').map(p => parseFloat(p.trim())).filter(p => !isNaN(p));
    } catch {
      return [];
    }
  };

  const handleCalculateSMA = async () => {
    const prices = parsePrices(calcPrices);
    if (prices.length === 0) {
      setError('Veuillez entrer des prix valides (séparés par des virgules)');
      return;
    }
    try {
      setLoading(true);
      clearMessages();
      const data = await http.post('/calculator/sma', { prices, period: calcPeriod });
      setCalcResult(data.data);
      setSuccess(`SMA calculé: ${data.data.count} valeurs`);
    } catch (err) {
      setError(err.message || 'Erreur lors du calcul');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateEMA = async () => {
    const prices = parsePrices(calcPrices);
    if (prices.length === 0) {
      setError('Veuillez entrer des prix valides');
      return;
    }
    try {
      setLoading(true);
      clearMessages();
      const data = await http.post('/calculator/ema', { prices, period: calcPeriod });
      setCalcResult(data.data);
      setSuccess(`EMA calculé: ${data.data.count} valeurs`);
    } catch (err) {
      setError(err.message || 'Erreur lors du calcul');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateRSI = async () => {
    const prices = parsePrices(calcPrices);
    if (prices.length === 0) {
      setError('Veuillez entrer des prix valides');
      return;
    }
    try {
      setLoading(true);
      clearMessages();
      const data = await http.post('/calculator/rsi', { prices, period: calcPeriod });
      setCalcResult(data.data);
      setSuccess(`RSI calculé: ${data.data.latest}`);
    } catch (err) {
      setError(err.message || 'Erreur lors du calcul');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateMACD = async () => {
    const prices = parsePrices(calcPrices);
    if (prices.length === 0) {
      setError('Veuillez entrer des prix valides');
      return;
    }
    try {
      setLoading(true);
      clearMessages();
      const data = await http.post('/calculator/macd', { 
        prices, 
        fastPeriod: macdFast, 
        slowPeriod: macdSlow, 
        signalPeriod: macdSignal 
      });
      setCalcResult(data.data);
      setSuccess('MACD calculé avec succès');
    } catch (err) {
      setError(err.message || 'Erreur lors du calcul');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateBB = async () => {
    const prices = parsePrices(calcPrices);
    if (prices.length === 0) {
      setError('Veuillez entrer des prix valides');
      return;
    }
    try {
      setLoading(true);
      clearMessages();
      const data = await http.post('/calculator/bollinger-bands', { 
        prices, 
        period: calcPeriod, 
        stdDev: bbStdDev 
      });
      setCalcResult(data.data);
      setSuccess('Bollinger Bands calculé');
    } catch (err) {
      setError(err.message || 'Erreur lors du calcul');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSignalCalc = async () => {
    if (!signalCurrentValue) {
      setError('Veuillez entrer une valeur');
      return;
    }
    try {
      setLoading(true);
      clearMessages();
      const data = await http.post('/calculator/signal', {
        indicatorType: signalIndicatorType,
        currentValue: parseFloat(signalCurrentValue),
        previousValue: signalPreviousValue ? parseFloat(signalPreviousValue) : null
      });
      setCalcSignalResult(data.data);
      setSuccess(`Signal: ${data.data.signal}`);
    } catch (err) {
      setError(err.message || 'Erreur lors de la génération');
    } finally {
      setLoading(false);
    }
  };

  const handleGetExamples = async () => {
    try {
      setLoading(true);
      clearMessages();
      const data = await http.get('/calculator/examples');
      setExamples(data.data);
      setSuccess('Exemples chargés');
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  // === Effects ===
  useEffect(() => {
    loadIndicators();
  }, []);

  // === Render Functions ===
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
              type="number"
              label="Valeur Initiale (Optionnel)"
              value={newIndicator.value || ''}
              onChange={(e) => setNewIndicator({ ...newIndicator, value: e.target.value ? parseFloat(e.target.value) : null })}
              placeholder="Ex: 50.5"
              helperText="Valeur calculée de l'indicateur (optionnel)"
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Paramètres (JSON)"
              value={typeof newIndicator.parameters === 'string' ? newIndicator.parameters : JSON.stringify(newIndicator.parameters, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setNewIndicator({ ...newIndicator, parameters: parsed });
                } catch (err) {
                  // Garder comme string si JSON invalide
                  setNewIndicator({ ...newIndicator, parameters: e.target.value });
                }
              }}
              placeholder='{"overbought": 70, "oversold": 30}'
              helperText="Paramètres spécifiques à l'indicateur en format JSON"
            />
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>💡 Exemples de Paramètres:</Typography>
              <Typography variant="body2" component="div">
                • <strong>RSI:</strong> {`{"overbought": 70, "oversold": 30}`}<br/>
                • <strong>SMA/EMA:</strong> {`{"source": "close"}`}<br/>
                • <strong>MACD:</strong> {`{"fastPeriod": 12, "slowPeriod": 26, "signalPeriod": 9}`}<br/>
                • <strong>Bollinger:</strong> {`{"stdDev": 2}`}<br/>
                • <strong>Stochastic:</strong> {`{"k_period": 14, "d_period": 3}`}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateIndicator}
              disabled={loading || !newIndicator.asset_id || !newIndicator.indicator_type}
              startIcon={<AddIcon />}
              size="large"
            >
              Créer l'Indicateur
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderListTab = () => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4">
            Tous les Indicateurs ({indicators.length})
          </Typography>
          <Button
            variant="outlined"
            onClick={loadIndicators}
            startIcon={<RefreshIcon />}
          >
            Rafraîchir
          </Button>
        </Box>
        
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Asset ID</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Période</TableCell>
                <TableCell>Valeur</TableCell>
                <TableCell>Paramètres</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {indicators.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Aucun indicateur trouvé
                  </TableCell>
                </TableRow>
              ) : (
                indicators.map((indicator) => (
                  <TableRow key={indicator.indicator_id || indicator.id}>
                    <TableCell sx={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {(indicator.indicator_id || indicator.id).substring(0, 8)}...
                    </TableCell>
                    <TableCell>{indicator.asset_id}</TableCell>
                    <TableCell>
                      <Chip label={indicator.indicator_type || indicator.type} color="primary" size="small" />
                    </TableCell>
                    <TableCell>{indicator.period}</TableCell>
                    <TableCell>
                      {indicator.value ? (
                        <Chip label={Number(indicator.value).toFixed(2)} color="success" size="small" />
                      ) : (
                        <Typography variant="body2" color="textSecondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ maxWidth: '200px' }}>
                      {indicator.parameters && Object.keys(indicator.parameters).length > 0 ? (
                        <Typography variant="caption" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {JSON.stringify(indicator.parameters)}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="textSecondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>
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

  // Tab 3: Search
  const renderSearchTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>Recherche par ID</Typography>
            <TextField
              fullWidth
              label="Indicator ID"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              margin="normal"
            />
            <Button fullWidth variant="contained" onClick={handleSearchById} disabled={loading} sx={{ mt: 2 }}>
              Rechercher
            </Button>
            {selectedIndicator && (
              <Box mt={3}>
                <Typography variant="subtitle2" color="textSecondary">Résultat:</Typography>
                <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px', overflow: 'auto', fontSize: '12px' }}>
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
            <Typography variant="h5" gutterBottom>Recherche par Asset</Typography>
            <TextField
              fullWidth
              label="Asset ID"
              value={searchAssetId}
              onChange={(e) => setSearchAssetId(e.target.value)}
              margin="normal"
              placeholder="btc-001"
            />
            <Button fullWidth variant="contained" onClick={handleSearchByAsset} disabled={loading} sx={{ mt: 2 }}>
              Rechercher
            </Button>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>Recherche par Type</Typography>
            <FormControl fullWidth margin="normal">
              <InputLabel>Type d'Indicateur</InputLabel>
              <Select value={searchType} onChange={(e) => setSearchType(e.target.value)}>
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
            <Button fullWidth variant="contained" onClick={handleSearchByType} disabled={loading} sx={{ mt: 2 }}>
              Rechercher
            </Button>
          </CardContent>
        </Card>
      </Grid>
      
      {/* Résultats des recherches par Asset et Type */}
      {indicators.length > 0 && (searchAssetId || searchType) && (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Résultats de la Recherche ({indicators.length})
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Asset ID</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Période</TableCell>
                      <TableCell>Valeur</TableCell>
                      <TableCell>Paramètres</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {indicators.map((indicator) => (
                      <TableRow key={indicator.indicator_id || indicator.id}>
                        <TableCell sx={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {(indicator.indicator_id || indicator.id).substring(0, 8)}...
                        </TableCell>
                        <TableCell>{indicator.asset_id}</TableCell>
                        <TableCell>
                          <Chip label={indicator.indicator_type || indicator.type} color="primary" size="small" />
                        </TableCell>
                        <TableCell>{indicator.period}</TableCell>
                        <TableCell>
                          {indicator.value ? (
                            <Chip label={Number(indicator.value).toFixed(2)} color="success" size="small" />
                          ) : (
                            <Typography variant="body2" color="textSecondary">-</Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ maxWidth: '200px' }}>
                          {indicator.parameters && Object.keys(indicator.parameters).length > 0 ? (
                            <Typography variant="caption" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {JSON.stringify(indicator.parameters)}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="textSecondary">-</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );

  // Tab 4: Calculate
  const renderCalculateTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>Calculer Indicateur</Typography>
            <TextField
              fullWidth
              label="Indicator ID"
              value={calculateId}
              onChange={(e) => setCalculateId(e.target.value)}
              margin="normal"
            />
            <Stack direction="row" spacing={2} mt={2}>
              <Button variant="contained" onClick={handleCalculateIndicator} disabled={loading} startIcon={<CalculateIcon />}>
                Calculer
              </Button>
              <Button variant="outlined" onClick={handleGetIndicatorValues} disabled={loading} startIcon={<ShowChartIcon />}>
                Voir Valeurs
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>Valeurs d'Indicateur</Typography>
            {indicatorValues.length > 0 ? (
              <>
                <Alert severity="info" sx={{ mb: 2 }}>
                  {indicatorValues.length} valeur(s) trouvée(s)
                </Alert>
                <TableContainer component={Paper} sx={{ maxHeight: 400, mt: 2 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Index</TableCell>
                        <TableCell>Valeur</TableCell>
                        <TableCell>Signal</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {indicatorValues.map((value, index) => (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <strong>{value.value || value.indicator_value || 'N/A'}</strong>
                          </TableCell>
                          <TableCell>
                            {value.signal && (
                              <Chip label={value.signal} color={value.signal === 'BUY' ? 'success' : value.signal === 'SELL' ? 'error' : 'default'} size="small" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            ) : (
              <Box sx={{ mt: 2, p: 3, bgcolor: '#f5f5f5', borderRadius: 1, textAlign: 'center' }}>
                <ShowChartIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body1" color="textSecondary" gutterBottom>
                  Aucune valeur à afficher
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Entrez un ID d'indicateur ci-dessus et cliquez sur "Voir Valeurs"
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Tab 5: Signals
  const renderSignalsTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>Générer Signal de Trading</Typography>
            <TextField
              fullWidth
              label="Valeur Indicateur"
              type="number"
              value={signalValue}
              onChange={(e) => setSignalValue(e.target.value)}
              margin="normal"
              placeholder="Ex: 75"
            />
            <TextField
              fullWidth
              label="Type Indicateur"
              value={signalType}
              onChange={(e) => setSignalType(e.target.value)}
              margin="normal"
              placeholder="Ex: RSI"
            />
            <Button fullWidth variant="contained" onClick={handleGenerateSignal} disabled={loading} sx={{ mt: 2 }} startIcon={<TrendingUpIcon />}>
              Générer Signal
            </Button>
            
            {signalResult && (
              <Box mt={3}>
                <Alert severity="info">
                  <Typography variant="h6">Signal: <strong>{signalResult.data?.signal || signalResult.signal || 'NEUTRAL'}</strong></Typography>
                  {signalResult.data?.confidence && (
                    <Typography variant="body2">Confiance: {(signalResult.data.confidence * 100).toFixed(1)}%</Typography>
                  )}
                </Alert>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>Guide des Signaux</Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>RSI (Relative Strength Index)</Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                • RSI {'>'} 70: SELL (Suracheté)<br/>
                • RSI {'<'} 30: BUY (Survendu)<br/>
                • 30 ≤ RSI ≤ 70: NEUTRAL
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom>MACD</Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                • MACD {'>'} Signal: BUY<br/>
                • MACD {'<'} Signal: SELL<br/>
                • MACD croise Signal: STRONG Signal
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom>Stochastic</Typography>
              <Typography variant="body2" color="textSecondary">
                • Stochastic {'>'} 80: SELL (Suracheté)<br/>
                • Stochastic {'<'} 20: BUY (Survendu)
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Tab 6: Performance
  const renderPerformanceTab = () => (
    <Card>
      <CardContent>
        <Typography variant="h4" gutterBottom>Évaluer la Performance</Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Indicator ID"
              value={perfIndicatorId}
              onChange={(e) => setPerfIndicatorId(e.target.value)}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Asset ID"
              value={perfAssetId}
              onChange={(e) => setPerfAssetId(e.target.value)}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              type="date"
              label="Date Début"
              value={perfStartDate}
              onChange={(e) => setPerfStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              type="date"
              label="Date Fin"
              value={perfEndDate}
              onChange={(e) => setPerfEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Button variant="contained" color="primary" onClick={handleEvaluatePerformance} disabled={loading} startIcon={<AssessmentIcon />}>
              Évaluer Performance
            </Button>
          </Grid>
        </Grid>
        
        {performanceResult && (
          <Box mt={4}>
            <Typography variant="h5" gutterBottom>Résultats de Performance</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6">Win Rate</Typography>
                  <Typography variant="h4" color="primary">
                    {performanceResult.data?.winRate || performanceResult.winRate || '0'}%
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6">Total Trades</Typography>
                  <Typography variant="h4">
                    {performanceResult.data?.totalTrades || performanceResult.totalTrades || 0}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6">Profit Factor</Typography>
                  <Typography variant="h4" color="success.main">
                    {performanceResult.data?.profitFactor || performanceResult.profitFactor || '0'}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6">Sharpe Ratio</Typography>
                  <Typography variant="h4">
                    {performanceResult.data?.sharpeRatio || performanceResult.sharpeRatio || '0'}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  // Tab 7: Indicator Values
  const renderValuesTab = () => (
    <Grid container spacing={3}>
      {/* Créer une valeur */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>Créer une Valeur</Typography>
            <TextField
              fullWidth
              label="Indicator ID"
              value={newValue.indicator_id}
              onChange={(e) => setNewValue({...newValue, indicator_id: e.target.value})}
              margin="normal"
              placeholder="UUID de l'indicateur"
            />
            <TextField
              fullWidth
              type="datetime-local"
              label="Timestamp"
              value={newValue.timestamp}
              onChange={(e) => setNewValue({...newValue, timestamp: e.target.value})}
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              type="number"
              label="Valeur"
              value={newValue.value}
              onChange={(e) => setNewValue({...newValue, value: e.target.value})}
              margin="normal"
              placeholder="Ex: 65.5"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Signal</InputLabel>
              <Select
                value={newValue.signal}
                onChange={(e) => setNewValue({...newValue, signal: e.target.value})}
              >
                <MenuItem value="BUY">BUY</MenuItem>
                <MenuItem value="SELL">SELL</MenuItem>
                <MenuItem value="HOLD">HOLD</MenuItem>
              </Select>
            </FormControl>
            <Button 
              fullWidth 
              variant="contained" 
              onClick={handleCreateValue} 
              disabled={loading}
              sx={{ mt: 2 }}
            >
              Créer Valeur
            </Button>
          </CardContent>
        </Card>
      </Grid>

      {/* Rechercher */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>Rechercher</Typography>
            <TextField
              fullWidth
              label="Par Value ID"
              value={searchValueId}
              onChange={(e) => setSearchValueId(e.target.value)}
              margin="normal"
            />
            <Button fullWidth variant="contained" onClick={handleSearchValueById} disabled={loading} sx={{ mb: 2 }}>
              Rechercher par ID
            </Button>

            <TextField
              fullWidth
              label="Par Indicator ID"
              value={searchValueIndicatorId}
              onChange={(e) => setSearchValueIndicatorId(e.target.value)}
              margin="normal"
            />
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <Button variant="contained" onClick={handleSearchByIndicatorId} disabled={loading} size="small">
                Toutes
              </Button>
              <Button variant="outlined" onClick={handleGetLatestValue} disabled={loading} size="small">
                Dernière
              </Button>
            </Stack>

            <FormControl fullWidth margin="normal">
              <InputLabel>Par Signal</InputLabel>
              <Select value={searchValueSignal} onChange={(e) => setSearchValueSignal(e.target.value)}>
                <MenuItem value="BUY">BUY</MenuItem>
                <MenuItem value="SELL">SELL</MenuItem>
                <MenuItem value="HOLD">HOLD</MenuItem>
              </Select>
            </FormControl>
            <Button fullWidth variant="contained" onClick={handleSearchBySignal} disabled={loading}>
              Rechercher Signal
            </Button>
          </CardContent>
        </Card>
      </Grid>

      {/* Recherche par dates */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>Recherche par Période</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Indicator ID"
                  value={searchValueIndicatorId}
                  onChange={(e) => setSearchValueIndicatorId(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date Début"
                  value={valueStartDate}
                  onChange={(e) => setValueStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date Fin"
                  value={valueEndDate}
                  onChange={(e) => setValueEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <Button fullWidth variant="contained" onClick={handleGetValuesByDateRange} disabled={loading} sx={{ height: '56px' }}>
                  Rechercher
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Valeur sélectionnée */}
      {selectedValue && (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>Valeur Sélectionnée</Typography>
              <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <Typography variant="subtitle2" color="textSecondary">ID</Typography>
                    <Typography variant="body1">{selectedValue.value_id?.substring(0,8)}...</Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="subtitle2" color="textSecondary">Valeur</Typography>
                    <Typography variant="h6" color="primary">{selectedValue.value}</Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="subtitle2" color="textSecondary">Signal</Typography>
                    <Chip 
                      label={selectedValue.signal} 
                      color={selectedValue.signal === 'BUY' ? 'success' : selectedValue.signal === 'SELL' ? 'error' : 'default'} 
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="subtitle2" color="textSecondary">Timestamp</Typography>
                    <Typography variant="body2">{new Date(selectedValue.timestamp).toLocaleString()}</Typography>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Liste des valeurs */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5">Liste des Valeurs ({indicatorValues2.length})</Typography>
              <Button variant="outlined" onClick={loadIndicatorValues} disabled={loading} startIcon={<RefreshIcon />}>
                Rafraîchir
              </Button>
            </Box>
            
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Indicator ID</TableCell>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Valeur</TableCell>
                    <TableCell>Signal</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {indicatorValues2.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        Aucune valeur trouvée
                      </TableCell>
                    </TableRow>
                  ) : (
                    indicatorValues2.map((val) => (
                      <TableRow key={val.value_id}>
                        <TableCell sx={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {val.value_id?.substring(0,8)}...
                        </TableCell>
                        <TableCell sx={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {val.indicator_id?.substring(0,8)}...
                        </TableCell>
                        <TableCell>{new Date(val.timestamp).toLocaleString()}</TableCell>
                        <TableCell>
                          <strong>{Number(val.value).toFixed(2)}</strong>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={val.signal} 
                            color={val.signal === 'BUY' ? 'success' : val.signal === 'SELL' ? 'error' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" color="error" onClick={() => handleDeleteValue(val.value_id)} title="Supprimer">
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
      </Grid>
    </Grid>
  );

  // Tab 8: Prices
  const renderPricesTab = () => (
    <Grid container spacing={3}>
      {/* Prix Actuel & Ticker */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>Prix Actuel & Ticker 24h</Typography>
            <TextField
              fullWidth
              label="Asset ID"
              value={priceAssetId}
              onChange={(e) => setPriceAssetId(e.target.value)}
              margin="normal"
              placeholder="BTC, ETH, etc."
            />
            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <Button variant="contained" onClick={handleGetCurrentPrice} disabled={loading} fullWidth>
                Prix Actuel
              </Button>
              <Button variant="outlined" onClick={handleGetTicker} disabled={loading} fullWidth>
                Ticker 24h
              </Button>
            </Stack>

            {currentPrice && (
              <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="textSecondary">Prix Actuel</Typography>
                <Typography variant="h4" color="primary">${Number(currentPrice.price).toFixed(2)}</Typography>
                {currentPrice.timestamp && (
                  <Typography variant="caption">{new Date(currentPrice.timestamp).toLocaleString()}</Typography>
                )}
              </Box>
            )}

            {tickerData && (
              <Box sx={{ mt: 2, p: 2, bgcolor: '#f0f8ff', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>Résumé 24h</Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">Prix</Typography>
                    <Typography variant="body1">${Number(tickerData.currentPrice).toFixed(2)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">Variation</Typography>
                    <Typography 
                      variant="body1" 
                      color={tickerData.priceChangePercent24h >= 0 ? 'success.main' : 'error.main'}
                    >
                      {tickerData.priceChangePercent24h?.toFixed(2)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">Haut 24h</Typography>
                    <Typography variant="body2">${Number(tickerData.high24h).toFixed(2)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">Bas 24h</Typography>
                    <Typography variant="body2">${Number(tickerData.low24h).toFixed(2)}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">Volume 24h</Typography>
                    <Typography variant="body2">{Number(tickerData.volume24h).toLocaleString()}</Typography>
                  </Grid>
                </Grid>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* VWAP */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>VWAP (Volume Weighted Average Price)</Typography>
            <TextField
              fullWidth
              label="Asset ID"
              value={priceAssetId}
              onChange={(e) => setPriceAssetId(e.target.value)}
              margin="normal"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Période</InputLabel>
              <Select value={priceInterval} onChange={(e) => setPriceInterval(e.target.value)}>
                <MenuItem value="1m">1 minute</MenuItem>
                <MenuItem value="5m">5 minutes</MenuItem>
                <MenuItem value="15m">15 minutes</MenuItem>
                <MenuItem value="1h">1 heure</MenuItem>
                <MenuItem value="4h">4 heures</MenuItem>
                <MenuItem value="1d">1 jour</MenuItem>
              </Select>
            </FormControl>
            <Button fullWidth variant="contained" onClick={handleGetVWAP} disabled={loading} sx={{ mt: 2 }}>
              Calculer VWAP
            </Button>

            {vwapData && (
              <Box sx={{ mt: 3, p: 2, bgcolor: '#fff3e0', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="textSecondary">VWAP</Typography>
                <Typography variant="h4" color="warning.dark">${Number(vwapData.vwap).toFixed(2)}</Typography>
                <Typography variant="caption">Période: {priceInterval}</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Historique des Prix */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>Historique des Prix</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Asset ID"
                  value={priceAssetId}
                  onChange={(e) => setPriceAssetId(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Intervalle</InputLabel>
                  <Select value={priceInterval} onChange={(e) => setPriceInterval(e.target.value)}>
                    <MenuItem value="1m">1m</MenuItem>
                    <MenuItem value="5m">5m</MenuItem>
                    <MenuItem value="15m">15m</MenuItem>
                    <MenuItem value="1h">1h</MenuItem>
                    <MenuItem value="4h">4h</MenuItem>
                    <MenuItem value="1d">1d</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="De"
                  value={priceFrom}
                  onChange={(e) => setPriceFrom(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="À"
                  value={priceTo}
                  onChange={(e) => setPriceTo(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Button fullWidth variant="contained" onClick={handleGetPriceHistory} disabled={loading} sx={{ height: '56px' }}>
                  Historique
                </Button>
              </Grid>
            </Grid>

            {priceHistory.length > 0 && (
              <TableContainer component={Paper} sx={{ mt: 3, maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Prix</TableCell>
                      <TableCell>Volume</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {priceHistory.map((p, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{new Date(p.timestamp || p.date).toLocaleString()}</TableCell>
                        <TableCell><strong>${Number(p.price || p.close).toFixed(2)}</strong></TableCell>
                        <TableCell>{p.volume ? Number(p.volume).toLocaleString() : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* OHLCV */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>Données OHLCV (Open/High/Low/Close/Volume)</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Asset ID"
                  value={priceAssetId}
                  onChange={(e) => setPriceAssetId(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Intervalle</InputLabel>
                  <Select value={priceInterval} onChange={(e) => setPriceInterval(e.target.value)}>
                    <MenuItem value="1h">1h</MenuItem>
                    <MenuItem value="4h">4h</MenuItem>
                    <MenuItem value="1d">1d</MenuItem>
                    <MenuItem value="1w">1w</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  type="date"
                  label="De"
                  value={priceFrom}
                  onChange={(e) => setPriceFrom(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  type="date"
                  label="À"
                  value={priceTo}
                  onChange={(e) => setPriceTo(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Button fullWidth variant="contained" onClick={handleGetOHLCV} disabled={loading} sx={{ height: '56px' }}>
                  Récupérer OHLCV
                </Button>
              </Grid>
            </Grid>

            {ohlcvData.length > 0 && (
              <TableContainer component={Paper} sx={{ mt: 3, maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Open</TableCell>
                      <TableCell>High</TableCell>
                      <TableCell>Low</TableCell>
                      <TableCell>Close</TableCell>
                      <TableCell>Volume</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ohlcvData.map((candle, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{new Date(candle.timestamp).toLocaleString()}</TableCell>
                        <TableCell>${Number(candle.open).toFixed(2)}</TableCell>
                        <TableCell sx={{ color: 'success.main' }}>${Number(candle.high).toFixed(2)}</TableCell>
                        <TableCell sx={{ color: 'error.main' }}>${Number(candle.low).toFixed(2)}</TableCell>
                        <TableCell><strong>${Number(candle.close).toFixed(2)}</strong></TableCell>
                        <TableCell>{Number(candle.volume).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Générer OHLCV (Admin) */}
      <Grid item xs={12}>
        <Card sx={{ bgcolor: '#fff3cd' }}>
          <CardContent>
            <Typography variant="h5" gutterBottom color="warning.dark">
              ⚠️ Génération OHLCV (Admin)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Génère des données OHLCV historiques pour les tests et l'analyse
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Asset ID"
                  value={priceAssetId}
                  onChange={(e) => setPriceAssetId(e.target.value)}
                  placeholder="Laisser vide pour tous"
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Intervalle</InputLabel>
                  <Select value={generateInterval} onChange={(e) => setGenerateInterval(e.target.value)}>
                    <MenuItem value="1h">1h</MenuItem>
                    <MenuItem value="4h">4h</MenuItem>
                    <MenuItem value="1d">1d</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  type="number"
                  label="Heures Passées"
                  value={generateHours}
                  onChange={(e) => setGenerateHours(parseInt(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <Button 
                  fullWidth 
                  variant="contained" 
                  color="warning"
                  onClick={handleGenerateOHLCV} 
                  disabled={loading || !priceAssetId} 
                  sx={{ height: '56px' }}
                >
                  Générer Un Asset
                </Button>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button 
                  fullWidth 
                  variant="contained" 
                  color="error"
                  onClick={handleGenerateAllOHLCV} 
                  disabled={loading} 
                  sx={{ height: '56px' }}
                >
                  Générer Tous
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Tab 9: Calculator
  const renderCalculatorTab = () => (
    <Grid container spacing={3}>
      {/* Calculs Simples */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>Calculateur d'Indicateurs</Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Entrez vos prix séparés par des virgules (ex: 100,102,101,103,105)
            </Typography>
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Prix (séparés par des virgules)"
              value={calcPrices}
              onChange={(e) => setCalcPrices(e.target.value)}
              placeholder="100, 102, 101, 103, 105, 107, 106, 108, 110"
              sx={{ mb: 2 }}
            />

            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="Période"
                  value={calcPeriod}
                  onChange={(e) => setCalcPeriod(parseInt(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} md={9}>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Button variant="contained" onClick={handleCalculateSMA} disabled={loading}>
                    SMA
                  </Button>
                  <Button variant="contained" onClick={handleCalculateEMA} disabled={loading}>
                    EMA
                  </Button>
                  <Button variant="contained" onClick={handleCalculateRSI} disabled={loading}>
                    RSI
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* MACD */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>MACD</Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Fast"
                  value={macdFast}
                  onChange={(e) => setMacdFast(parseInt(e.target.value))}
                  size="small"
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Slow"
                  value={macdSlow}
                  onChange={(e) => setMacdSlow(parseInt(e.target.value))}
                  size="small"
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Signal"
                  value={macdSignal}
                  onChange={(e) => setMacdSignal(parseInt(e.target.value))}
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <Button fullWidth variant="contained" onClick={handleCalculateMACD} disabled={loading}>
                  Calculer MACD
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Bollinger Bands */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>Bollinger Bands</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Période"
                  value={calcPeriod}
                  onChange={(e) => setCalcPeriod(parseInt(e.target.value))}
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Std Dev"
                  value={bbStdDev}
                  onChange={(e) => setBbStdDev(parseFloat(e.target.value))}
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <Button fullWidth variant="contained" onClick={handleCalculateBB} disabled={loading}>
                  Calculer Bollinger Bands
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Résultats */}
      {calcResult && (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>Résultats: {calcResult.type}</Typography>
              
              {calcResult.type === 'SMA' && (
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Période: {calcResult.period} | Valeurs: {calcResult.count}
                  </Typography>
                  <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1, maxHeight: 200, overflow: 'auto' }}>
                    <Typography variant="body2" component="pre">
                      {JSON.stringify(calcResult.values, null, 2)}
                    </Typography>
                  </Box>
                </Box>
              )}

              {calcResult.type === 'EMA' && (
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Période: {calcResult.period} | Valeurs: {calcResult.count}
                  </Typography>
                  <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1, maxHeight: 200, overflow: 'auto' }}>
                    <Typography variant="body2" component="pre">
                      {JSON.stringify(calcResult.values, null, 2)}
                    </Typography>
                  </Box>
                </Box>
              )}

              {calcResult.type === 'RSI' && (
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Période: {calcResult.period} | Valeurs: {calcResult.count}
                  </Typography>
                  <Box sx={{ mt: 2, p: 2, bgcolor: '#fff3e0', borderRadius: 1 }}>
                    <Typography variant="subtitle2" color="textSecondary">Dernière Valeur RSI</Typography>
                    <Typography variant="h3" color="warning.dark">{calcResult.latest}</Typography>
                    <Chip 
                      label={calcResult.latest < 30 ? 'SURVENDU' : calcResult.latest > 70 ? 'SURACHETÉ' : 'NEUTRE'}
                      color={calcResult.latest < 30 ? 'success' : calcResult.latest > 70 ? 'error' : 'default'}
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </Box>
              )}

              {calcResult.type === 'MACD' && (
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Fast: {calcResult.parameters.fastPeriod} | Slow: {calcResult.parameters.slowPeriod} | Signal: {calcResult.parameters.signalPeriod}
                  </Typography>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={4}>
                      <Paper sx={{ p: 2, bgcolor: '#e3f2fd' }}>
                        <Typography variant="caption" color="textSecondary">MACD</Typography>
                        <Typography variant="h6">{calcResult.latest?.macd?.toFixed(4)}</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={4}>
                      <Paper sx={{ p: 2, bgcolor: '#f3e5f5' }}>
                        <Typography variant="caption" color="textSecondary">Signal</Typography>
                        <Typography variant="h6">{calcResult.latest?.signal?.toFixed(4)}</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={4}>
                      <Paper sx={{ p: 2, bgcolor: '#fff3e0' }}>
                        <Typography variant="caption" color="textSecondary">Histogram</Typography>
                        <Typography variant="h6" color={calcResult.latest?.histogram > 0 ? 'success.main' : 'error.main'}>
                          {calcResult.latest?.histogram?.toFixed(4)}
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {calcResult.type === 'BOLLINGER_BANDS' && (
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Période: {calcResult.parameters.period} | Std Dev: {calcResult.parameters.stdDev}
                  </Typography>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={4}>
                      <Paper sx={{ p: 2, bgcolor: '#ffebee' }}>
                        <Typography variant="caption" color="textSecondary">Upper</Typography>
                        <Typography variant="h6" color="error.main">{calcResult.latest?.upper?.toFixed(2)}</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={4}>
                      <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                        <Typography variant="caption" color="textSecondary">Middle (SMA)</Typography>
                        <Typography variant="h6">{calcResult.latest?.middle?.toFixed(2)}</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={4}>
                      <Paper sx={{ p: 2, bgcolor: '#e8f5e9' }}>
                        <Typography variant="caption" color="textSecondary">Lower</Typography>
                        <Typography variant="h6" color="success.main">{calcResult.latest?.lower?.toFixed(2)}</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Générateur de Signal */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>Générateur de Signal</Typography>
            <FormControl fullWidth margin="normal">
              <InputLabel>Type d'Indicateur</InputLabel>
              <Select value={signalIndicatorType} onChange={(e) => setSignalIndicatorType(e.target.value)}>
                <MenuItem value="RSI">RSI</MenuItem>
                <MenuItem value="SMA">SMA</MenuItem>
                <MenuItem value="EMA">EMA</MenuItem>
                <MenuItem value="MACD">MACD</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              type="number"
              label="Valeur Actuelle"
              value={signalCurrentValue}
              onChange={(e) => setSignalCurrentValue(e.target.value)}
              margin="normal"
            />
            <TextField
              fullWidth
              type="number"
              label="Valeur Précédente (optionnel)"
              value={signalPreviousValue}
              onChange={(e) => setSignalPreviousValue(e.target.value)}
              margin="normal"
            />
            <Button fullWidth variant="contained" onClick={handleGenerateSignalCalc} disabled={loading} sx={{ mt: 2 }}>
              Générer Signal
            </Button>

            {calcSignalResult && (
              <Box sx={{ mt: 3, p: 2, bgcolor: '#f0f8ff', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="textSecondary">Signal Généré</Typography>
                <Chip 
                  label={calcSignalResult.signal}
                  color={calcSignalResult.signal === 'BUY' ? 'success' : calcSignalResult.signal === 'SELL' ? 'error' : 'default'}
                  size="large"
                  sx={{ mt: 1, fontSize: '1.2rem', p: 2 }}
                />
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Type: {calcSignalResult.indicatorType} | Valeur: {calcSignalResult.currentValue}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Exemples */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>Exemples de Calculs</Typography>
            <Button fullWidth variant="outlined" onClick={handleGetExamples} disabled={loading}>
              Charger les Exemples
            </Button>

            {examples && (
              <Box sx={{ mt: 2, maxHeight: 400, overflow: 'auto' }}>
                {Object.entries(examples).map(([key, ex]) => (
                  <Paper key={key} sx={{ p: 2, mb: 2, bgcolor: '#fafafa' }}>
                    <Typography variant="subtitle1" fontWeight="bold">{key.toUpperCase()}</Typography>
                    <Typography variant="body2" color="textSecondary">{ex.description}</Typography>
                    <Typography variant="caption" component="pre" sx={{ mt: 1, display: 'block', whiteSpace: 'pre-wrap' }}>
                      {ex.formula}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
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
          <Tab label="Signaux" />
          <Tab label="Performance" />
          <Tab label="Valeurs" />
          <Tab label="Prix" />
          <Tab label="Calculateur" />
        </Tabs>
        
        {/* Tab Content */}
        <Box sx={{ py: 2 }}>
          {activeTab === 0 && renderCreateTab()}
          {activeTab === 1 && renderListTab()}
          {activeTab === 2 && renderSearchTab()}
          {activeTab === 3 && renderCalculateTab()}
          {activeTab === 4 && renderSignalsTab()}
          {activeTab === 5 && renderPerformanceTab()}
          {activeTab === 6 && renderValuesTab()}
          {activeTab === 7 && renderPricesTab()}
          {activeTab === 8 && renderCalculatorTab()}
        </Box>
      </Box>
    </MainCard>
  );
};

export default TechnicalIndicatorsPage;
