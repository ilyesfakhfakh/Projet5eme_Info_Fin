import React, { useEffect, useRef, useState } from 'react';
import { createChart, CrosshairMode } from 'lightweight-charts';
import { Box, Typography, useTheme, CircularProgress } from '@mui/material';
import { useResizeObserver } from 'hooks';
import { getPriceData } from 'services/tradingService';

const PriceChart = ({ symbol = 'BTC/USD', timeframe = '1h' }) => {
  const theme = useTheme();
  const chartContainerRef = useRef(null);
  const chart = useRef(null);
  const candleSeries = useRef(null);
  const volumeSeries = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [priceData, setPriceData] = useState([]);
  const dimensions = useResizeObserver(chartContainerRef);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clean up previous chart if it exists
    if (chart.current) {
      chart.current.remove();
    }

    // Create new chart
    const newChart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        backgroundColor: theme.palette.background.paper,
        textColor: theme.palette.text.primary,
      },
      grid: {
        vertLines: {
          color: theme.palette.divider,
        },
        horzLines: {
          color: theme.palette.divider,
        },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: theme.palette.divider,
      },
      timeScale: {
        borderColor: theme.palette.divider,
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // Add candlestick series
    candleSeries.current = newChart.addCandlestickSeries({
      upColor: theme.palette.success.main,
      downColor: theme.palette.error.main,
      borderDownColor: theme.palette.error.main,
      borderUpColor: theme.palette.success.main,
      wickDownColor: theme.palette.error.main,
      wickUpColor: theme.palette.success.main,
    });

    // Add volume series
    volumeSeries.current = newChart.addHistogramSeries({
      color: theme.palette.primary.main,
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // set as an overlay by setting a blank priceScaleId
    });

    // Store chart instance
    chart.current = newChart;

    // Handle window resize
    const handleResize = () => {
      if (chart.current && chartContainerRef.current) {
        chart.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chart.current) {
        chart.current.remove();
      }
    };
  }, [theme]);

  // Update chart data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // In a real app, you would fetch this from your API
        // const data = await getPriceData(symbol, timeframe);
        
        // Mock data for demonstration
        const mockData = generateMockData(100);
        setPriceData(mockData);
        
        if (candleSeries.current) {
          candleSeries.current.setData(mockData);
          
          // Set volume data
          const volumeData = mockData.map(d => ({
            time: d.time,
            value: d.volume,
            color: d.open <= d.close 
              ? theme.palette.success.main 
              : theme.palette.error.main,
          }));
          
          volumeSeries.current.setData(volumeData);
          
          // Fit content to view
          if (chart.current) {
            chart.current.timeScale().fitContent();
          }
        }
      } catch (err) {
        console.error('Error fetching price data:', err);
        setError('Failed to load price data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [symbol, timeframe, theme]);

  // Update chart dimensions when container resizes
  useEffect(() => {
    if (chart.current && dimensions) {
      chart.current.resize(dimensions.width, 400);
      chart.current.timeScale().fitContent();
    }
  }, [dimensions]);

  // Generate mock data for demonstration
  const generateMockData = (count) => {
    const result = [];
    let lastClose = 50000;
    let lastVolume = 100;
    let lastTime = Math.floor(Date.now() / 1000) - count * 60 * 60;

    for (let i = 0; i < count; i++) {
      const time = lastTime + i * 60 * 60;
      const open = lastClose;
      const close = open + (Math.random() - 0.5) * 1000;
      const high = Math.max(open, close) + Math.random() * 200;
      const low = Math.min(open, close) - Math.random() * 200;
      const volume = lastVolume + (Math.random() - 0.5) * 50;

      result.push({
        time,
        open,
        high,
        low,
        close,
        volume: Math.max(10, Math.floor(volume)),
      });

      lastClose = close;
      lastVolume = volume;
    }

    return result;
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        borderRadius: 1,
        p: 2,
        boxShadow: theme.shadows[1],
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {symbol} Price Chart ({timeframe})
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {['1h', '4h', '1d', '1w', '1M'].map((tf) => (
            <Box
              key={tf}
              onClick={() => setTimeframe(tf)}
              sx={{
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                bgcolor: timeframe === tf ? 'primary.main' : 'action.hover',
                color: timeframe === tf ? 'primary.contrastText' : 'text.primary',
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'primary.dark',
                  color: 'primary.contrastText',
                },
              }}
            >
              {tf}
            </Box>
          ))}
        </Box>
      </Box>

      {error ? (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'error.main',
          }}
        >
          <Typography>{error}</Typography>
        </Box>
      ) : isLoading ? (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <Box
          ref={chartContainerRef}
          sx={{
            width: '100%',
            height: '100%',
            minHeight: 400,
            position: 'relative',
          }}
        />
      )}
    </Box>
  );
};

export default PriceChart;
