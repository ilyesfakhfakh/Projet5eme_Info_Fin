import React, { useState, useEffect } from 'react';
import {
  Grid, Typography, Card, CardContent,
  Alert, Button, Box, CircularProgress,
  Chip, Divider, List, ListItem, ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import MainCard from 'ui-component/cards/MainCard';
import { getRiskMetrics, getRiskAlerts, getRiskDashboard } from 'api/risk';

export default function RiskPage() {
  const [riskData, setRiskData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRiskData();
  }, []);

  const loadRiskData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Utiliser un portfolio ID par défaut pour les tests
      const portfolioId = 1;

      console.log('Chargement des données de risque...');

      const [metricsResponse, alertsResponse, dashboardResponse] = await Promise.all([
        getRiskMetrics(portfolioId).catch(err => {
          console.warn('Erreur lors de la récupération des métriques:', err);
          return { data: null };
        }),
        getRiskAlerts(portfolioId).catch(err => {
          console.warn('Erreur lors de la récupération des alertes:', err);
          return { data: [] };
        }),
        getRiskDashboard(portfolioId).catch(err => {
          console.warn('Erreur lors de la récupération du dashboard:', err);
          return { data: null };
        })
      ]);

      setRiskData(metricsResponse.data);
      setAlerts(Array.isArray(alertsResponse.data) ? alertsResponse.data : []);
      setDashboard(dashboardResponse.data);

      console.log('Données de risque chargées:', {
        metrics: metricsResponse.data,
        alerts: alertsResponse.data,
        dashboard: dashboardResponse.data
      });

    } catch (err) {
      console.error('Erreur générale lors du chargement des données:', err);
      setError(err.message || 'Erreur lors du chargement des données de risque');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (alertType) => {
    switch (alertType) {
      case 'VAR_EXCEEDED':
        return 'error';
      case 'VOLATILITY_SPIKE':
        return 'warning';
      case 'DRAWDOWN_LIMIT':
        return 'error';
      case 'SHARPE_RATIO_LOW':
        return 'warning';
      default:
        return 'info';
    }
  };

  const formatValue = (value, decimals = 2) => {
    if (value === null || value === undefined) return 'N/A';
    return typeof value === 'number' ? value.toFixed(decimals) : value;
  };

  if (loading) {
    return (
      <MainCard title="Risk Management">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Chargement des données de risque...
          </Typography>
        </Box>
      </MainCard>
    );
  }

  if (error) {
    return (
      <MainCard title="Risk Management">
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={loadRiskData}>
          Réessayer
        </Button>
      </MainCard>
    );
  }

  return (
    <MainCard title="Risk Management">
      <Grid container spacing={3}>
        {/* Métriques de risque principales */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <AssessmentIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Métriques de Risque</Typography>
              </Box>

              {riskData ? (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box textAlign="center" p={2} border={1} borderColor="divider" borderRadius={1}>
                      <Typography variant="h4" color="primary">
                        {formatValue(riskData.var_95)}%
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        VaR (95%)
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6} md={4}>
                    <Box textAlign="center" p={2} border={1} borderColor="divider" borderRadius={1}>
                      <Typography variant="h4" color="secondary">
                        {formatValue(riskData.sharpe_ratio)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Sharpe Ratio
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6} md={4}>
                    <Box textAlign="center" p={2} border={1} borderColor="divider" borderRadius={1}>
                      <Typography variant="h4" color="error">
                        {formatValue(riskData.max_drawdown)}%
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Max Drawdown
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6} md={4}>
                    <Box textAlign="center" p={2} border={1} borderColor="divider" borderRadius={1}>
                      <Typography variant="h4">
                        {formatValue(riskData.volatility)}%
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Volatilité
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6} md={4}>
                    <Box textAlign="center" p={2} border={1} borderColor="divider" borderRadius={1}>
                      <Typography variant="h4">
                        {formatValue(riskData.beta)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Beta
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              ) : (
                <Alert severity="info">
                  Aucune donnée de métriques disponible. Vérifiez que l'API backend fonctionne.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Alertes de risque */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <WarningIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Alertes Actives</Typography>
              </Box>

              {alerts.length > 0 ? (
                <List dense>
                  {alerts.slice(0, 5).map((alert, index) => (
                    <ListItem key={alert.alert_id || index} divider>
                      <ListItemIcon>
                        <WarningIcon color={getSeverityColor(alert.alert_type)} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Chip
                              label={alert.alert_type?.replace('_', ' ')}
                              size="small"
                              color={getSeverityColor(alert.alert_type)}
                            />
                          </Box>
                        }
                        secondary={alert.message}
                      />
                    </ListItem>
                  ))}
                  {alerts.length > 5 && (
                    <ListItem>
                      <Typography variant="body2" color="textSecondary">
                        ... et {alerts.length - 5} autres alertes
                      </Typography>
                    </ListItem>
                  )}
                </List>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  Aucune alerte active
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Informations du dashboard */}
        {dashboard && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <TimelineIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">Résumé du Portfolio</Typography>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="success.main">
                        {dashboard.total_positions || 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Positions Totales
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4">
                        ${formatValue(dashboard.total_value, 0)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Valeur Totale
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary">
                        {dashboard.risk_score || 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Score de Risque
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4">
                        {dashboard.last_updated ? new Date(dashboard.last_updated).toLocaleDateString() : 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Dernière MAJ
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Actions disponibles */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <SettingsIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Actions Disponibles</Typography>
              </Box>

              <Box display="flex" gap={2} flexWrap="wrap">
                <Button
                  variant="outlined"
                  startIcon={<AssessmentIcon />}
                  onClick={loadRiskData}
                >
                  Actualiser les Données
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<TrendingUpIcon />}
                  disabled
                >
                  Analyse de Scénario
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<SettingsIcon />}
                  disabled
                >
                  Configurer les Limites
                </Button>
              </Box>

              <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                Note: Certaines fonctionnalités nécessitent une configuration supplémentaire du backend.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </MainCard>
  );
}
