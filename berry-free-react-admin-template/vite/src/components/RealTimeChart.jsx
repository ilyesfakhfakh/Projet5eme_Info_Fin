import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Box, Card, CardContent, Typography, ToggleButtonGroup, ToggleButton, Chip, Paper } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

const RealTimeChart = ({
  data = [],
  assetName = 'Asset',
  dataKey = 'close_price',
  title = 'Prix en Temps Réel',
  showVolume = false,
  height = 400
}) => {
  const [chartType, setChartType] = useState('line');
  const [timeRange, setTimeRange] = useState('all');

  const handleChartTypeChange = (event, newType) => {
    if (newType !== null) {
      setChartType(newType);
    }
  };

  const handleTimeRangeChange = (event, newRange) => {
    if (newRange !== null) {
      setTimeRange(newRange);
    }
  };

  // Filtrer les données selon la plage de temps
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];

    if (timeRange === 'all') return data;

    const now = new Date();
    const ranges = {
      '1H': 60 * 60 * 1000,
      '4H': 4 * 60 * 60 * 1000,
      '1D': 24 * 60 * 60 * 1000,
      '1W': 7 * 24 * 60 * 60 * 1000
    };

    const cutoff = new Date(now.getTime() - ranges[timeRange]);

    return data.filter((item) => {
      const itemDate = new Date(item.timestamp);
      return itemDate >= cutoff;
    });
  }, [data, timeRange]);

  // Calculer les statistiques
  const stats = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return { current: 0, change: 0, changePercent: 0, high: 0, low: 0 };
    }

    const values = filteredData.map((d) => parseFloat(d[dataKey]) || 0);
    const current = values[values.length - 1] || 0;
    const previous = values[0] || 0;
    const change = current - previous;
    const changePercent = previous !== 0 ? (change / previous) * 100 : 0;
    const high = Math.max(...values);
    const low = Math.min(...values);

    return { current, change, changePercent, high, low };
  }, [filteredData, dataKey]);

  // Formater les données pour le chart
  const chartData = useMemo(() => {
    return filteredData.map((item) => ({
      ...item,
      time: new Date(item.timestamp).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      price: parseFloat(item[dataKey]) || 0,
      volume: parseFloat(item.volume) || 0
    }));
  }, [filteredData, dataKey]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 1.5, bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
          <Typography variant="body2" fontWeight="bold">
            {payload[0].payload.time}
          </Typography>
          <Typography variant="body2" color="primary">
            Prix: ${payload[0].value.toFixed(2)}
          </Typography>
          {showVolume && payload[1] && (
            <Typography variant="body2" color="secondary">
              Volume: {payload[1].value.toLocaleString()}
            </Typography>
          )}
        </Paper>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <Typography color="textSecondary">Aucune donnée disponible</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        {/* Header avec stats */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h6" gutterBottom>
                {title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h4" fontWeight="bold">
                  ${stats.current.toFixed(2)}
                </Typography>
                <Chip
                  icon={stats.changePercent >= 0 ? <TrendingUp /> : <TrendingDown />}
                  label={`${stats.changePercent >= 0 ? '+' : ''}${stats.changePercent.toFixed(2)}%`}
                  color={stats.changePercent >= 0 ? 'success' : 'error'}
                  size="small"
                />
              </Box>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" color="textSecondary">
                Haut: ${stats.high.toFixed(2)}
              </Typography>
              <br />
              <Typography variant="caption" color="textSecondary">
                Bas: ${stats.low.toFixed(2)}
              </Typography>
            </Box>
          </Box>

          {/* Controls */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <ToggleButtonGroup value={timeRange} exclusive onChange={handleTimeRangeChange} size="small">
              <ToggleButton value="1H">1H</ToggleButton>
              <ToggleButton value="4H">4H</ToggleButton>
              <ToggleButton value="1D">1D</ToggleButton>
              <ToggleButton value="1W">1W</ToggleButton>
              <ToggleButton value="all">Tout</ToggleButton>
            </ToggleButtonGroup>

            <ToggleButtonGroup value={chartType} exclusive onChange={handleChartTypeChange} size="small">
              <ToggleButton value="line">Ligne</ToggleButton>
              <ToggleButton value="area">Area</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={height}>
          {chartType === 'line' ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12 }} tickFormatter={(value) => `$${value.toFixed(2)}`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#1976d2"
                strokeWidth={2}
                dot={false}
                name="Prix"
                isAnimationActive={true}
              />
            </LineChart>
          ) : (
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1976d2" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#1976d2" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12 }} tickFormatter={(value) => `$${value.toFixed(2)}`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#1976d2"
                strokeWidth={2}
                fill="url(#colorPrice)"
                name="Prix"
                isAnimationActive={true}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default RealTimeChart;
