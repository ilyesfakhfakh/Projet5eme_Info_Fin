import { Box, Typography, Paper } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

export default function MarketChart({ data, assetName }) {
  if (!data || data.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="textSecondary">
          Aucune donnée disponible pour le graphique
        </Typography>
      </Paper>
    );
  }

  // Sort data by timestamp
  const sortedData = [...data].sort((a, b) => 
    new Date(a.timestamp) - new Date(b.timestamp)
  );

  // Calculate min and max for scaling
  const prices = sortedData.map(d => d.close_price).filter(p => p != null);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;

  // Chart dimensions
  const chartHeight = 200;
  const chartWidth = 800;
  const padding = 40;

  // Create SVG path for the line chart
  const points = sortedData.map((d, i) => {
    const x = padding + (i / (sortedData.length - 1)) * (chartWidth - 2 * padding);
    const y = chartHeight - padding - ((d.close_price - minPrice) / priceRange) * (chartHeight - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  const latestPrice = sortedData[sortedData.length - 1]?.close_price;
  const firstPrice = sortedData[0]?.close_price;
  const priceChange = latestPrice - firstPrice;
  const priceChangePercent = ((priceChange / firstPrice) * 100).toFixed(2);
  const isPositive = priceChange >= 0;

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">{assetName}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isPositive ? (
            <TrendingUp color="success" />
          ) : (
            <TrendingDown color="error" />
          )}
          <Typography 
            variant="h6" 
            color={isPositive ? 'success.main' : 'error.main'}
          >
            {priceChangePercent}%
          </Typography>
        </Box>
      </Box>

      <svg 
        width="100%" 
        height={chartHeight} 
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        preserveAspectRatio="none"
      >
        {/* Grid lines */}
        <line 
          x1={padding} 
          y1={padding} 
          x2={padding} 
          y2={chartHeight - padding} 
          stroke="#e0e0e0" 
          strokeWidth="1"
        />
        <line 
          x1={padding} 
          y1={chartHeight - padding} 
          x2={chartWidth - padding} 
          y2={chartHeight - padding} 
          stroke="#e0e0e0" 
          strokeWidth="1"
        />

        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = chartHeight - padding - ratio * (chartHeight - 2 * padding);
          const price = (minPrice + ratio * priceRange).toFixed(2);
          return (
            <g key={i}>
              <line 
                x1={padding} 
                y1={y} 
                x2={chartWidth - padding} 
                y2={y} 
                stroke="#f0f0f0" 
                strokeWidth="1"
                strokeDasharray="5,5"
              />
              <text 
                x={padding - 5} 
                y={y + 4} 
                fontSize="10" 
                fill="#666" 
                textAnchor="end"
              >
                ${price}
              </text>
            </g>
          );
        })}

        {/* Area under the line */}
        <polygon
          points={`${padding},${chartHeight - padding} ${points} ${chartWidth - padding},${chartHeight - padding}`}
          fill={isPositive ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)'}
        />

        {/* Line chart */}
        <polyline
          points={points}
          fill="none"
          stroke={isPositive ? '#4caf50' : '#f44336'}
          strokeWidth="2"
        />

        {/* Data points */}
        {sortedData.map((d, i) => {
          const x = padding + (i / (sortedData.length - 1)) * (chartWidth - 2 * padding);
          const y = chartHeight - padding - ((d.close_price - minPrice) / priceRange) * (chartHeight - 2 * padding);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="3"
              fill={isPositive ? '#4caf50' : '#f44336'}
            >
              <title>{`${new Date(d.timestamp).toLocaleDateString()}: $${d.close_price}`}</title>
            </circle>
          );
        })}
      </svg>

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="caption" color="textSecondary">
          {new Date(sortedData[0]?.timestamp).toLocaleDateString()}
        </Typography>
        <Typography variant="caption" color="textSecondary">
          {new Date(sortedData[sortedData.length - 1]?.timestamp).toLocaleDateString()}
        </Typography>
      </Box>
    </Paper>
  );
}
