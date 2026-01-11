import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  Alert,
  alpha
} from '@mui/material';
import { TrendingUp, TrendingDown, ShowChart, TableChart } from '@mui/icons-material';
import { useMarketData } from '../../../hooks/useSocket';
import RealTimeChart from '../../../components/RealTimeChart';
import RealTimeIndicator from '../../../components/RealTimeIndicator';
import { assetsApi } from 'api';

const RealTimeMarket = () => {
  const { marketData, realtimeUpdates, isConnected, requestHistoricalData } = useMarketData();
  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'charts'
  const [updateCount, setUpdateCount] = useState(0);
  const [period, setPeriod] = useState('1D');

  useEffect(() => {
    fetchAssets();
  }, []);

  useEffect(() => {
    if (realtimeUpdates && realtimeUpdates.length > 0) {
      setUpdateCount((prev) => prev + 1);
    }
  }, [realtimeUpdates]);

  useEffect(() => {
    if (selectedAsset && isConnected) {
      loadHistoricalData(selectedAsset.asset_id, period);
    }
  }, [selectedAsset, period, isConnected]);

  const fetchAssets = async () => {
    try {
      const response = await assetsApi.getAll();
      setAssets(response || []);
      if (response && response.length > 0 && !selectedAsset) {
        setSelectedAsset(response[0]);
      }
    } catch (err) {
      console.error('Error fetching assets:', err);
    }
  };

  const loadHistoricalData = async (assetId, timePeriod) => {
    try {
      const data = await requestHistoricalData(assetId, timePeriod);
      setHistoricalData(data);
    } catch (error) {
      console.error('Erreur lors du chargement des données historiques:', error);
    }
  };

  const getAssetInfo = (assetId) => {
    return assets.find((a) => a.asset_id === assetId);
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const formatVolume = (num) => {
    if (num === null || num === undefined) return '-';
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K`;
    }
    return num.toLocaleString();
  };

  // Fusionner les données temps réel avec les données existantes
  const getCurrentMarketData = () => {
    if (!realtimeUpdates || realtimeUpdates.length === 0) {
      return marketData;
    }
    return realtimeUpdates;
  };

  const currentData = getCurrentMarketData();

  // Calculer les statistiques du marché
  const marketStats = {
    total: currentData.length,
    gainers: currentData.filter((d) => parseFloat(d.change_percent) >= 0).length,
    losers: currentData.filter((d) => parseFloat(d.change_percent) < 0).length,
    avgChange:
      currentData.length > 0
        ? currentData.reduce((acc, d) => acc + parseFloat(d.change_percent || 0), 0) / currentData.length
        : 0
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Marché en Temps Réel</Typography>
        <RealTimeIndicator isConnected={isConnected} updateCount={updateCount} />
      </Box>

      {!isConnected && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Connexion au serveur temps réel en cours... Les données ne sont pas mises à jour automatiquement.
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Assets Actifs
              </Typography>
              <Typography variant="h4">{marketStats.total}</Typography>
              <Chip label="LIVE" size="small" color="success" sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              backgroundColor: (theme) => alpha(theme.palette.success.main, 0.1),
              borderLeft: 4,
              borderColor: 'success.main'
            }}
          >
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                En Hausse
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp color="success" />
                <Typography variant="h4" color="success.main">
                  {marketStats.gainers}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              backgroundColor: (theme) => alpha(theme.palette.error.main, 0.1),
              borderLeft: 4,
              borderColor: 'error.main'
            }}
          >
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                En Baisse
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingDown color="error" />
                <Typography variant="h4" color="error.main">
                  {marketStats.losers}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Variation Moyenne
              </Typography>
              <Typography variant="h4" color={marketStats.avgChange >= 0 ? 'success.main' : 'error.main'}>
                {formatNumber(marketStats.avgChange)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(e, newMode) => newMode && setViewMode(newMode)}
          size="small"
        >
          <ToggleButton value="table">
            <TableChart sx={{ mr: 1 }} /> Tableau
          </ToggleButton>
          <ToggleButton value="charts">
            <ShowChart sx={{ mr: 1 }} /> Graphiques
          </ToggleButton>
        </ToggleButtonGroup>

        {viewMode === 'charts' && (
          <ToggleButtonGroup
            value={period}
            exclusive
            onChange={(e, newPeriod) => newPeriod && setPeriod(newPeriod)}
            size="small"
          >
            <ToggleButton value="1H">1H</ToggleButton>
            <ToggleButton value="4H">4H</ToggleButton>
            <ToggleButton value="1D">1D</ToggleButton>
            <ToggleButton value="1W">1W</ToggleButton>
          </ToggleButtonGroup>
        )}
      </Box>

      {viewMode === 'table' ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>Asset</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>Prix</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>Change</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>Change %</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>High</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>Low</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>Volume</strong>
                </TableCell>
                <TableCell>
                  <strong>Actions</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    Chargement des données en temps réel...
                  </TableCell>
                </TableRow>
              ) : (
                currentData.map((data) => {
                  const assetInfo = getAssetInfo(data.asset_id);
                  const changePercent = parseFloat(data.change_percent) || 0;
                  const isPositive = changePercent >= 0;

                  return (
                    <TableRow
                      key={data.asset_id}
                      hover
                      sx={{
                        animation: 'fadeIn 0.5s ease-in',
                        '@keyframes fadeIn': {
                          from: { opacity: 0.5 },
                          to: { opacity: 1 }
                        }
                      }}
                    >
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {assetInfo?.symbol || data.asset_id}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {assetInfo?.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body1" fontWeight="bold">
                          ${formatNumber(data.close_price || data.price)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color={isPositive ? 'success.main' : 'error.main'}>
                          {isPositive ? '+' : ''}
                          {formatNumber(data.change)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          icon={isPositive ? <TrendingUp /> : <TrendingDown />}
                          label={`${isPositive ? '+' : ''}${formatNumber(changePercent)}%`}
                          color={isPositive ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">${formatNumber(data.high_price)}</TableCell>
                      <TableCell align="right">${formatNumber(data.low_price)}</TableCell>
                      <TableCell align="right">{formatVolume(data.volume)}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          onClick={() => {
                            setSelectedAsset(assetInfo);
                            setViewMode('charts');
                          }}
                          startIcon={<ShowChart />}
                        >
                          Chart
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Sélectionner un Asset
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {assets.map((asset) => (
                    <Chip
                      key={asset.asset_id}
                      label={asset.symbol}
                      onClick={() => setSelectedAsset(asset)}
                      color={selectedAsset?.asset_id === asset.asset_id ? 'primary' : 'default'}
                      variant={selectedAsset?.asset_id === asset.asset_id ? 'filled' : 'outlined'}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {selectedAsset && (
            <Grid item xs={12}>
              <RealTimeChart
                data={historicalData}
                assetName={`${selectedAsset.symbol} - ${selectedAsset.name}`}
                title={`${selectedAsset.symbol} - Analyse Temps Réel`}
                dataKey="close_price"
                showVolume={true}
                height={500}
              />
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
};

export default RealTimeMarket;
