import { useState, useEffect } from 'react';
import { useAuth } from 'contexts/auth';
import { listPortfolios } from 'api/portfolios';
import {
  createYieldCurve,
  getYieldCurves,
  generateYieldCurve,
  projectCashflows,
  calculateDurationConvexity,
  calculateLiquidityGap,
  calculateInterestRateSensitivity
} from 'api/alm';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import {
  Add as AddIcon,
  PlayArrow as RunIcon,
  Assessment as AnalysisIcon,
  ShowChart as ChartIcon
} from '@mui/icons-material';

// Import ApexCharts
import ReactApexChart from 'react-apexcharts';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`alm-tabpanel-${index}`}
      aria-labelledby={`alm-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AlmPage() {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [portfolios, setPortfolios] = useState([]);
  const [yieldCurves, setYieldCurves] = useState([]);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [yieldCurveForm, setYieldCurveForm] = useState({
    curve_name: '',
    currency: 'EUR',
    curve_type: 'GOVERNMENT',
    maturity_points: [{ maturity: 1, rate: 0.04 }]
  });

  const [calculationForm, setCalculationForm] = useState({
    portfolio_id: '',
    yield_curve_id: ''
  });

  // Chart states
  const [selectedCurve, setSelectedCurve] = useState(null);
  const [chartOptions, setChartOptions] = useState({
    series: [{
      name: 'Yield Rate (%)',
      data: []
    }],
    options: {
      chart: {
        type: 'line',
        height: 350,
        toolbar: {
          show: true
        }
      },
      colors: ['#2196F3'],
      stroke: {
        curve: 'smooth',
        width: 3
      },
      markers: {
        size: 6,
        colors: ['#2196F3'],
        strokeColors: '#fff',
        strokeWidth: 2
      },
      xaxis: {
        title: {
          text: 'Maturity (Years)'
        },
        type: 'numeric',
        labels: {
          formatter: function(value) {
            return value.toString();
          }
        }
      },
      yaxis: {
        title: {
          text: 'Yield Rate (%)'
        },
        labels: {
          formatter: function(value) {
            return value.toFixed(2) + '%';
          }
        }
      },
      tooltip: {
        x: {
          formatter: function(value) {
            return value + ' years';
          }
        },
        y: {
          formatter: function(value) {
            return value.toFixed(2) + '%';
          }
        }
      },
      grid: {
        borderColor: '#e7e7e7',
        row: {
          colors: ['#f3f3f3', 'transparent'],
          opacity: 0.5
        }
      }
    }
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [portfoliosRes, curvesRes] = await Promise.all([
        listPortfolios({ user_id: user?.user_id }),
        getYieldCurves()
      ]);

      // Handle response format like portfolio does
      if (Array.isArray(portfoliosRes)) {
        setPortfolios(portfoliosRes);
      } else if (portfoliosRes && portfoliosRes.data && Array.isArray(portfoliosRes.data)) {
        setPortfolios(portfoliosRes.data);
      } else {
        setPortfolios([]);
      }

      let processedCurves = [];
      if (Array.isArray(curvesRes)) {
        processedCurves = curvesRes;
      } else if (curvesRes && curvesRes.data && Array.isArray(curvesRes.data)) {
        processedCurves = curvesRes.data;
      }

      // Ensure maturity_points are arrays
      processedCurves = processedCurves.map(curve => ({
        ...curve,
        maturity_points: Array.isArray(curve.maturity_points)
          ? curve.maturity_points
          : (typeof curve.maturity_points === 'string'
            ? JSON.parse(curve.maturity_points)
            : [])
      }));

      setYieldCurves(processedCurves);
    } catch (e) {
      console.error('Error loading data:', e);
      setError('Erreur lors du chargement des données');
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setResults(null);
    setError('');
    setSuccess('');
  };

  const handleCreateYieldCurve = async () => {
    // Validate form
    if (!yieldCurveForm.curve_name.trim()) {
      setError('Le nom de la courbe est obligatoire');
      return;
    }

    if (!yieldCurveForm.maturity_points || yieldCurveForm.maturity_points.length === 0) {
      setError('Au moins un point de maturité est requis');
      return;
    }

    setLoading(true);
    setError('');
    try {
      console.log('Creating yield curve with form data:', yieldCurveForm);
      console.log('User ID:', user?.user_id);

      const payload = {
        ...yieldCurveForm,
        ...(user?.user_id && { created_by: user.user_id })
      };
      console.log('Final payload:', payload);

      await createYieldCurve(payload);
      setSuccess('Courbe des taux créée avec succès');
      loadData();
      setYieldCurveForm({
        curve_name: '',
        currency: 'EUR',
        curve_type: 'GOVERNMENT',
        maturity_points: [{ maturity: 1, rate: 0.04 }]
      });
    } catch (e) {
      console.error('Create yield curve error:', e);
      setError(`Erreur: ${e.message}`);
    }
    setLoading(false);
  };

  const handleGenerateYieldCurve = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        currency: 'EUR',
        curve_type: 'GOVERNMENT',
        ...(user?.user_id && { created_by: user.user_id })
      };

      await generateYieldCurve(payload);
      setSuccess('Courbe des taux générée automatiquement avec succès');
      loadData();
    } catch (e) {
      console.error('Generate yield curve error:', e);
      setError(`Erreur: ${e.message}`);
    }
    setLoading(false);
  };

  const handleProjectCashflows = async () => {
    if (!calculationForm.portfolio_id) {
      setError('Veuillez sélectionner un portefeuille');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await projectCashflows({
        portfolio_id: calculationForm.portfolio_id,
        frequency: 'MONTHLY',
        horizon_years: 5,
        ...(user?.user_id && { created_by: user.user_id })
      });
      setResults({ type: 'cashflow', data: result });
      setSuccess('Projection de trésorerie calculée');
    } catch (e) {
      setError(`Erreur: ${e.message}`);
    }
    setLoading(false);
  };

  const handleCalculateDurationConvexity = async () => {
    if (!calculationForm.portfolio_id || !calculationForm.yield_curve_id) {
      setError('Veuillez sélectionner un portefeuille et une courbe des taux');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await calculateDurationConvexity({
        portfolio_id: calculationForm.portfolio_id,
        yield_curve_id: calculationForm.yield_curve_id
      });
      setResults({ type: 'duration', data: result });
      setSuccess('Duration et convexité calculées');
    } catch (e) {
      setError(`Erreur: ${e.message}`);
    }
    setLoading(false);
  };

  const handleCalculateLiquidityGap = async () => {
    if (!calculationForm.portfolio_id) {
      setError('Veuillez sélectionner un portefeuille');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await calculateLiquidityGap({
        portfolio_id: calculationForm.portfolio_id,
        ...(user?.user_id && { created_by: user.user_id })
      });
      setResults({ type: 'liquidity', data: result });
      setSuccess('Gap de liquidité calculé');
    } catch (e) {
      setError(`Erreur: ${e.message}`);
    }
    setLoading(false);
  };

  const handleCalculateSensitivity = async () => {
    if (!calculationForm.portfolio_id || !calculationForm.yield_curve_id) {
      setError('Veuillez sélectionner un portefeuille et une courbe des taux');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await calculateInterestRateSensitivity({
        portfolio_id: calculationForm.portfolio_id,
        yield_curve_id: calculationForm.yield_curve_id,
        scenarios: [
          { scenario_type: 'PARALLEL', shock_bps: 100 },
          { scenario_type: 'PARALLEL', shock_bps: -100 }
        ],
        ...(user?.user_id && { created_by: user.user_id })
      });
      setResults({ type: 'sensitivity', data: result });
      setSuccess('Sensibilité aux taux calculée');
    } catch (e) {
      setError(`Erreur: ${e.message}`);
    }
    setLoading(false);
  };

  const addMaturityPoint = () => {
    setYieldCurveForm({
      ...yieldCurveForm,
      maturity_points: [...yieldCurveForm.maturity_points, { maturity: 1, rate: 0.04 }]
    });
  };

  const updateMaturityPoint = (index, field, value) => {
    const updated = [...yieldCurveForm.maturity_points];
    updated[index][field] = parseFloat(value) || 0;
    setYieldCurveForm({
      ...yieldCurveForm,
      maturity_points: updated
    });
  };

  const removeMaturityPoint = (index) => {
    if (yieldCurveForm.maturity_points.length > 1) {
      setYieldCurveForm({
        ...yieldCurveForm,
        maturity_points: yieldCurveForm.maturity_points.filter((_, i) => i !== index)
      });
    }
  };

  const selectCurveForChart = (curve) => {
    console.log('Selecting curve for chart:', curve);
    setSelectedCurve(curve);
    if (curve && Array.isArray(curve.maturity_points) && curve.maturity_points.length > 0) {
      // Sort maturity points by maturity
      const sortedPoints = [...curve.maturity_points].sort((a, b) => a.maturity - b.maturity);
      console.log('Sorted maturity points:', sortedPoints);

      // Format data for ApexCharts line chart
      const chartData = sortedPoints.map(point => point.rate * 100); // Convert to percentage
      const categories = sortedPoints.map(point => point.maturity);

      console.log('Chart data (rates):', chartData);
      console.log('Categories (maturities):', categories);

      setChartOptions(prevOptions => ({
        ...prevOptions,
        series: [{
          name: `${curve.curve_name} (${curve.currency})`,
          data: chartData
        }],
        options: {
          ...prevOptions.options,
          title: {
            text: `Yield Curve: ${curve.curve_name}`,
            align: 'center',
            style: {
              fontSize: '16px',
              fontWeight: 'bold'
            }
          },
          xaxis: {
            ...prevOptions.options.xaxis,
            categories: categories,
            title: {
              text: 'Maturity (Years)'
            }
          }
        }
      }));
    } else {
      console.log('No maturity points found or invalid format for curve:', curve);
      console.log('maturity_points type:', typeof curve?.maturity_points);
      console.log('maturity_points value:', curve?.maturity_points);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        ALM - Gestion Actif/Passif
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="alm tabs">
          <Tab label="Courbes des Taux" />
          <Tab label="Projections Trésorerie" />
          <Tab label="Duration & Convexité" />
          <Tab label="Gap de Liquidité" />
          <Tab label="Sensibilité Taux" />
        </Tabs>
      </Box>

      {/* Yield Curves Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Créer une Courbe des Taux" />
              <CardContent>
                <Stack spacing={2}>
                  <TextField
                    label="Nom de la courbe"
                    value={yieldCurveForm.curve_name}
                    onChange={(e) => setYieldCurveForm({...yieldCurveForm, curve_name: e.target.value})}
                    fullWidth
                  />
                  <FormControl fullWidth>
                    <InputLabel>Devise</InputLabel>
                    <Select
                      value={yieldCurveForm.currency}
                      onChange={(e) => setYieldCurveForm({...yieldCurveForm, currency: e.target.value})}
                    >
                      <MenuItem value="EUR">EUR</MenuItem>
                      <MenuItem value="USD">USD</MenuItem>
                      <MenuItem value="GBP">GBP</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={yieldCurveForm.curve_type}
                      onChange={(e) => setYieldCurveForm({...yieldCurveForm, curve_type: e.target.value})}
                    >
                      <MenuItem value="GOVERNMENT">Gouvernement</MenuItem>
                      <MenuItem value="CORPORATE">Entreprise</MenuItem>
                      <MenuItem value="SWAP">Swap</MenuItem>
                    </Select>
                  </FormControl>

                  <Typography variant="h6">Points de maturité</Typography>
                  {yieldCurveForm.maturity_points.map((point, index) => (
                    <Stack key={index} direction="row" spacing={1} alignItems="center">
                      <TextField
                        label="Maturité (années)"
                        type="number"
                        value={point.maturity}
                        onChange={(e) => updateMaturityPoint(index, 'maturity', e.target.value)}
                        size="small"
                      />
                      <TextField
                        label="Taux (%)"
                        type="number"
                        step="0.001"
                        value={point.rate}
                        onChange={(e) => updateMaturityPoint(index, 'rate', e.target.value)}
                        size="small"
                      />
                      <IconButton
                        onClick={() => removeMaturityPoint(index)}
                        disabled={yieldCurveForm.maturity_points.length <= 1}
                        color="error"
                        size="small"
                      >
                        ×
                      </IconButton>
                    </Stack>
                  ))}
                  <Button onClick={addMaturityPoint} startIcon={<AddIcon />} variant="outlined">
                    Ajouter un point
                  </Button>
                  <Stack direction="row" spacing={1}>
                    <Button
                      onClick={handleGenerateYieldCurve}
                      variant="contained"
                      color="secondary"
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} /> : <RunIcon />}
                      sx={{ flex: 1 }}
                    >
                      Générer Auto
                    </Button>
                    <Button
                      onClick={handleCreateYieldCurve}
                      variant="outlined"
                      disabled={loading || !yieldCurveForm.curve_name.trim()}
                      startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
                      sx={{ flex: 1 }}
                    >
                      Créer Manuel
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            {/* Chart Visualization */}
            {selectedCurve && (
              <Card sx={{ mb: 2 }}>
                <CardHeader title={`Visualisation: ${selectedCurve.curve_name}`} />
                <CardContent>
                  <ReactApexChart
                    options={chartOptions.options}
                    series={chartOptions.series}
                    type="line"
                    height={300}
                  />

                  {/* Debug info */}
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Debug: {selectedCurve.maturity_points?.length || 0} points loaded
                  </Typography>

                  {/* Simple table fallback */}
                  <TableContainer component={Paper} sx={{ mt: 2, maxHeight: 200 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Maturity (Years)</TableCell>
                          <TableCell align="right">Rate (%)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Array.isArray(selectedCurve.maturity_points) &&
                          selectedCurve.maturity_points
                            .sort((a, b) => a.maturity - b.maturity)
                            .map((point, index) => (
                              <TableRow key={index}>
                                <TableCell>{point.maturity}</TableCell>
                                <TableCell align="right">{(point.rate * 100).toFixed(2)}%</TableCell>
                              </TableRow>
                            ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader title="Courbes Existantes" />
              <CardContent>
                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Nom</TableCell>
                        <TableCell>Devise</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Points</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {yieldCurves.map((curve) => (
                        <TableRow key={curve.yield_curve_id}>
                          <TableCell>{curve.curve_name}</TableCell>
                          <TableCell>{curve.currency}</TableCell>
                          <TableCell>{curve.curve_type}</TableCell>
                          <TableCell>{curve.maturity_points?.length || 0}</TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={() => selectCurveForChart(curve)}
                              color="primary"
                              title="Visualiser la courbe"
                            >
                              <ChartIcon />
                            </IconButton>
                          </TableCell>
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

      {/* Cashflow Projections Tab */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title="Paramètres" />
              <CardContent>
                <Stack spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel>Portefeuille</InputLabel>
                    <Select
                      value={calculationForm.portfolio_id}
                      onChange={(e) => setCalculationForm({...calculationForm, portfolio_id: e.target.value})}
                    >
                      {portfolios.map((portfolio) => (
                        <MenuItem key={portfolio.portfolio_id} value={portfolio.portfolio_id}>
                          {portfolio.portfolio_name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    onClick={handleProjectCashflows}
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <RunIcon />}
                  >
                    Calculer les projections
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            {results?.type === 'cashflow' && (
              <Card>
                <CardHeader title="Résultats des Projections" />
                <CardContent>
                  <Typography variant="h6">Actifs: €{results.data.details?.assets?.reduce((a,b) => a+b, 0)?.toFixed(2) || '0'}</Typography>
                  <Typography variant="h6">Passifs: €{results.data.details?.liabilities?.reduce((a,b) => a+b, 0)?.toFixed(2) || '0'}</Typography>
                  <Typography variant="h6">Trésorerie Nette: €{results.data.projection?.net_cashflow?.toFixed(2) || '0'}</Typography>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </TabPanel>

      {/* Duration & Convexity Tab */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title="Paramètres" />
              <CardContent>
                <Stack spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel>Portefeuille</InputLabel>
                    <Select
                      value={calculationForm.portfolio_id}
                      onChange={(e) => setCalculationForm({...calculationForm, portfolio_id: e.target.value})}
                    >
                      {portfolios.map((portfolio) => (
                        <MenuItem key={portfolio.portfolio_id} value={portfolio.portfolio_id}>
                          {portfolio.portfolio_name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel>Courbe des taux</InputLabel>
                    <Select
                      value={calculationForm.yield_curve_id}
                      onChange={(e) => setCalculationForm({...calculationForm, yield_curve_id: e.target.value})}
                    >
                      {yieldCurves.map((curve) => (
                        <MenuItem key={curve.yield_curve_id} value={curve.yield_curve_id}>
                          {curve.curve_name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    onClick={handleCalculateDurationConvexity}
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <AnalysisIcon />}
                  >
                    Calculer Duration & Convexité
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            {results?.type === 'duration' && (
              <Card>
                <CardHeader title="Résultats Duration & Convexité" />
                <CardContent>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Position</TableCell>
                          <TableCell align="right">Duration Macaulay</TableCell>
                          <TableCell align="right">Duration Modifiée</TableCell>
                          <TableCell align="right">Convexité</TableCell>
                          <TableCell align="right">DV01</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {results.data.positions?.map((pos) => (
                          <TableRow key={pos.position_id}>
                            <TableCell>{pos.position_id}</TableCell>
                            <TableCell align="right">{pos.macaulay_duration?.toFixed(4) || 'N/A'}</TableCell>
                            <TableCell align="right">{pos.modified_duration?.toFixed(4) || 'N/A'}</TableCell>
                            <TableCell align="right">{pos.convexity?.toFixed(4) || 'N/A'}</TableCell>
                            <TableCell align="right">{pos.dv01?.toFixed(4) || 'N/A'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </TabPanel>

      {/* Liquidity Gap Tab */}
      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title="Paramètres" />
              <CardContent>
                <Stack spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel>Portefeuille</InputLabel>
                    <Select
                      value={calculationForm.portfolio_id}
                      onChange={(e) => setCalculationForm({...calculationForm, portfolio_id: e.target.value})}
                    >
                      {portfolios.map((portfolio) => (
                        <MenuItem key={portfolio.portfolio_id} value={portfolio.portfolio_id}>
                          {portfolio.portfolio_name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    onClick={handleCalculateLiquidityGap}
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <AnalysisIcon />}
                  >
                    Calculer le Gap de Liquidité
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            {results?.type === 'liquidity' && (
              <Card>
                <CardHeader title="Résultats du Gap de Liquidité" />
                <CardContent>
                  <Typography variant="h6">Gap Total: €{results.data.liquidity_gap?.total_gap?.toFixed(2) || '0'}</Typography>
                  <TableContainer component={Paper} sx={{ mt: 2 }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Période</TableCell>
                          <TableCell align="right">Gap (€)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>0-1 mois</TableCell>
                          <TableCell align="right">{results.data.liquidity_gap?.bucket_0_1m?.toFixed(2) || '0'}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>1-3 mois</TableCell>
                          <TableCell align="right">{results.data.liquidity_gap?.bucket_1_3m?.toFixed(2) || '0'}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>3-12 mois</TableCell>
                          <TableCell align="right">{results.data.liquidity_gap?.bucket_3_12m?.toFixed(2) || '0'}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </TabPanel>

      {/* Interest Rate Sensitivity Tab */}
      <TabPanel value={tabValue} index={4}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title="Paramètres" />
              <CardContent>
                <Stack spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel>Portefeuille</InputLabel>
                    <Select
                      value={calculationForm.portfolio_id}
                      onChange={(e) => setCalculationForm({...calculationForm, portfolio_id: e.target.value})}
                    >
                      {portfolios.map((portfolio) => (
                        <MenuItem key={portfolio.portfolio_id} value={portfolio.portfolio_id}>
                          {portfolio.portfolio_name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel>Courbe des taux</InputLabel>
                    <Select
                      value={calculationForm.yield_curve_id}
                      onChange={(e) => setCalculationForm({...calculationForm, yield_curve_id: e.target.value})}
                    >
                      {yieldCurves.map((curve) => (
                        <MenuItem key={curve.yield_curve_id} value={curve.yield_curve_id}>
                          {curve.curve_name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    onClick={handleCalculateSensitivity}
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <AnalysisIcon />}
                  >
                    Analyser la Sensibilité
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            {results?.type === 'sensitivity' && (
              <Card>
                <CardHeader title="Résultats de Sensibilité aux Taux" />
                <CardContent>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Scénario</TableCell>
                          <TableCell align="right">Choc (bps)</TableCell>
                          <TableCell align="right">ΔPV Actifs</TableCell>
                          <TableCell align="right">ΔPV Passifs</TableCell>
                          <TableCell align="right">ΔPV Net</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {results.data.sensitivities?.map((sens, index) => (
                          <TableRow key={index}>
                            <TableCell>{sens.sensitivity?.scenario_type}</TableCell>
                            <TableCell align="right">{sens.sensitivity?.shock_bps}</TableCell>
                            <TableCell align="right">€{sens.details?.assets_pv_change?.toFixed(2) || '0'}</TableCell>
                            <TableCell align="right">€{sens.details?.liabilities_pv_change?.toFixed(2) || '0'}</TableCell>
                            <TableCell align="right">€{sens.details?.net_pv_change?.toFixed(2) || '0'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
}