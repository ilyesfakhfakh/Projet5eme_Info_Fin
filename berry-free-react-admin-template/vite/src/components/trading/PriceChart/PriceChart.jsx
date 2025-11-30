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

    // Create chart instance
    chart.current = createChart(chartContainerRef.current, {
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
      },
    });

    // Add candlestick series
    candleSeries.current = chart.current.addCandlestickSeries({
      upColor: theme.palette.success.main,
      downColor: theme.palette.error.main,
      borderVisible: false,
      wickUpColor: theme.palette.success.main,
      wickDownColor: theme.palette.error.main,
    });

    // Add volume series
    volumeSeries.current = chart.current.addHistogramSeries({
      color: theme.palette.primary.main,
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    // Handle window resize
    const handleResize = () => {
      if (chart.current && chartContainerRef.current) {
        chart.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chart.current) {
        chart.current.remove();
        chart.current = null;
      }
    };
  }, [theme]);

  // Update chart data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await getPriceData(symbol, timeframe);
        setPriceData(data);
        
        if (candleSeries.current) {
          candleSeries.current.setData(data);
        }
        
        // Prepare volume data
        const volumeData = data.map(d => ({
          time: d.time,
          value: d.volume,
          color: d.close >= d.open 
            ? theme.palette.success.main 
            : theme.palette.error.main,
        }));
        
        if (volumeSeries.current) {
          volumeSeries.current.setData(volumeData);
        }
        
        if (chart.current && data.length > 0) {
          chart.current.timeScale().fitContent();
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching price data:', err);
        setError('Failed to load price data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [symbol, timeframe, theme]);

  // Handle container resize
  useEffect(() => {
    if (chart.current && dimensions) {
      chart.current.resize(dimensions.width, 400);
    }
  }, [dimensions]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={400}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3} color="error.main">
        <Typography>{error}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box mb={2}>
        <Typography variant="h6" gutterBottom>
          {symbol} Price Chart ({timeframe})
        </Typography>
      </Box>
      <div 
        ref={chartContainerRef} 
        style={{ 
          width: '100%', 
          height: 400,
          backgroundColor: theme.palette.background.paper,
          borderRadius: theme.shape.borderRadius,
          overflow: 'hidden',
        }} 
      />
    </Box>
  );
};

export default PriceChart;
