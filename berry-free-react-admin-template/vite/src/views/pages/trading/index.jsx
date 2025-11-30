import React, { useState, useEffect, useCallback } from 'react';
import { Box, Grid, Paper, Typography, useTheme, useMediaQuery } from '@mui/material';
import { gridSpacing } from 'store/constant';
import OrderBook from '../../../components/trading/OrderBook';
import PriceChart from '../../../components/trading/PriceChart';
import OrderForm from '../../../components/trading/OrderForm';
import PositionsTable from '../../../components/trading/PositionsTable';
import TradingHistory from '../../../components/trading/TradingHistory';
import { getOrderBook, getPositions, getTradingHistory, placeOrder } from 'services/tradingService';
import useWebSocket from 'hooks/useWebSocket';

const TradingPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State for the selected trading pair
  const [selectedAsset, setSelectedAsset] = useState('BTC/USD');
  const [timeframe, setTimeframe] = useState('1h');
  
  // State for order book data
  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });
  
  // State for positions
  const [positions, setPositions] = useState([]);
  
  // State for trading history
  const [tradingHistory, setTradingHistory] = useState([]);
  
  // Loading states
  const [isLoading, setIsLoading] = useState({
    orderBook: true,
    positions: true,
    history: true,
  });
  
  // Error states
  const [error, setError] = useState({
    orderBook: null,
    positions: null,
    history: null,
  });

  // Fetch order book data
  const fetchOrderBook = useCallback(async () => {
    try {
      setIsLoading(prev => ({ ...prev, orderBook: true }));
      setError(prev => ({ ...prev, orderBook: null }));
      
      // In a real app, you would call the API:
      // const data = await getOrderBook(selectedAsset);
      
      // Mock data for demonstration
      const mockBids = Array.from({ length: 10 }, (_, i) => ({
        price: (50000 - i * 100).toFixed(2),
        quantity: (Math.random() * 2 + 0.5).toFixed(4),
      }));
      
      const mockAsks = Array.from({ length: 10 }, (_, i) => ({
        price: (50100 + i * 100).toFixed(2),
        quantity: (Math.random() * 2 + 0.5).toFixed(4),
      }));
      
      setOrderBook({ bids: mockBids, asks: mockAsks });
    } catch (err) {
      console.error('Error fetching order book:', err);
      setError(prev => ({ ...prev, orderBook: 'Failed to load order book' }));
    } finally {
      setIsLoading(prev => ({ ...prev, orderBook: false }));
    }
  }, [selectedAsset]);

  // Fetch positions
  const fetchPositions = useCallback(async () => {
    try {
      setIsLoading(prev => ({ ...prev, positions: true }));
      setError(prev => ({ ...prev, positions: null }));
      
      // In a real app, you would call the API:
      // const data = await getPositions();
      
      // Mock data for demonstration
      const mockPositions = [
        {
          id: 'pos-1',
          symbol: 'BTC/USD',
          side: 'long',
          size: 0.5,
          entryPrice: 48500,
          markPrice: 49876.54,
          liquidationPrice: 32000,
          leverage: 10,
          margin: 2500,
          unrealizedPnl: 688.27,
          roe: 27.53,
        },
        {
          id: 'pos-2',
          symbol: 'ETH/USD',
          side: 'short',
          size: 2.5,
          entryPrice: 3200,
          markPrice: 3150.23,
          liquidationPrice: 3800,
          leverage: 5,
          margin: 1600,
          unrealizedPnl: 124.43,
          roe: 7.78,
        },
      ];
      
      setPositions(mockPositions);
    } catch (err) {
      console.error('Error fetching positions:', err);
      setError(prev => ({ ...prev, positions: 'Failed to load positions' }));
    } finally {
      setIsLoading(prev => ({ ...prev, positions: false }));
    }
  }, []);

  // Fetch trading history
  const fetchTradingHistory = useCallback(async () => {
    try {
      setIsLoading(prev => ({ ...prev, history: true }));
      setError(prev => ({ ...prev, history: null }));
      
      // In a real app, you would call the API:
      // const data = await getTradingHistory(selectedAsset);
      
      // Mock data for demonstration
      const mockHistory = [
        {
          id: 'trade-1',
          orderId: 'ord-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
          symbol: 'BTC/USD',
          side: 'buy',
          type: 'limit',
          price: 49500.50,
          quantity: 0.1,
          cost: 4950.05,
          status: 'filled',
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
        },
        {
          id: 'trade-2',
          orderId: 'ord-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
          symbol: 'ETH/USD',
          side: 'sell',
          type: 'market',
          price: 3150.23,
          quantity: 0.5,
          cost: 1575.12,
          status: 'filled',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        },
        // Add more mock trades as needed
      ];
      
      setTradingHistory(mockHistory);
    } catch (err) {
      console.error('Error fetching trading history:', err);
      setError(prev => ({ ...prev, history: 'Failed to load trading history' }));
    } finally {
      setIsLoading(prev => ({ ...prev, history: false }));
    }
  }, [selectedAsset]);

  // Handle placing a new order
  const handlePlaceOrder = async (orderData) => {
    try {
      // In a real app, you would call the API:
      // const response = await placeOrder(orderData);
      
      // For now, just log the order and refresh data
      console.log('Placing order:', orderData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh data
      fetchOrderBook();
      fetchPositions();
      fetchTradingHistory();
      
      // Show success message
      // You might want to use a toast notification here
      console.log('Order placed successfully');
      
      return { success: true };
    } catch (error) {
      console.error('Error placing order:', error);
      throw error;
    }
  };

  // Handle closing a position
  const handleClosePosition = async (positionId) => {
    try {
      // In a real app, you would call the API to close the position
      console.log('Closing position:', positionId);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh positions
      fetchPositions();
      
      // Show success message
      console.log('Position closed successfully');
    } catch (error) {
      console.error('Error closing position:', error);
    }
  };

  // Set up WebSocket for real-time updates
  const handleWebSocketMessage = useCallback((data) => {
    // Handle different types of WebSocket messages
    switch (data.type) {
      case 'orderbook':
        setOrderBook({
          bids: data.bids || [],
          asks: data.asks || [],
        });
        break;
      case 'trade':
        // Update trading history with new trade
        setTradingHistory(prev => [data.trade, ...prev].slice(0, 100)); // Keep last 100 trades
        break;
      case 'position':
        // Update positions
        setPositions(prev => {
          const existingIndex = prev.findIndex(p => p.id === data.position.id);
          if (existingIndex >= 0) {
            const newPositions = [...prev];
            newPositions[existingIndex] = data.position;
            return newPositions;
          }
          return [...prev, data.position];
        });
        break;
      default:
        console.log('Unhandled WebSocket message type:', data.type);
    }
  }, []);

  // In a real app, you would use the WebSocket hook like this:
  // useWebSocket(
  //   `wss://api.example.com/ws?symbol=${encodeURIComponent(selectedAsset)}`,
  //   handleWebSocketMessage,
  //   () => console.log('WebSocket connected'),
  //   () => console.log('WebSocket disconnected'),
  //   (error) => console.error('WebSocket error:', error)
  // );

  // Initial data fetch
  useEffect(() => {
    fetchOrderBook();
    fetchPositions();
    fetchTradingHistory();
    
    // Set up polling for data that doesn't use WebSocket
    const pollingInterval = setInterval(() => {
      fetchOrderBook();
      fetchPositions();
    }, 30000); // Poll every 30 seconds
    
    return () => clearInterval(pollingInterval);
  }, [fetchOrderBook, fetchPositions, fetchTradingHistory]);

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Grid container spacing={gridSpacing}>
        {/* Chart and Order Form Row */}
        <Grid item xs={12} md={8} lg={9}>
          <PriceChart 
            symbol={selectedAsset} 
            timeframe={timeframe} 
            onTimeframeChange={setTimeframe}
            height={500}
          />
        </Grid>
        
        <Grid item xs={12} md={4} lg={3}>
          <OrderForm 
            selectedAsset={selectedAsset} 
            onOrderPlaced={handlePlaceOrder}
            availableBalance={10000} // This would come from user data
          />
        </Grid>
        
        {/* Order Book and Positions Row */}
        <Grid item xs={12} md={6} lg={5}>
          <OrderBook 
            data={orderBook} 
            isLoading={isLoading.orderBook} 
            error={error.orderBook} 
          />
        </Grid>
        
        <Grid item xs={12} md={6} lg={7}>
          <PositionsTable 
            data={positions} 
            isLoading={isLoading.positions} 
            error={error.positions}
            onClosePosition={handleClosePosition}
          />
        </Grid>
        
        {/* Trading History */}
        <Grid item xs={12}>
          <TradingHistory 
            data={tradingHistory}
            isLoading={isLoading.history}
            error={error.history}
            onRefresh={fetchTradingHistory}
            onExport={() => {
              // Implement export functionality
              console.log('Exporting trading history...');
            }}
            onFilterChange={(filters) => {
              console.log('Filters changed:', filters);
              // In a real app, you would update the API call with these filters
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default TradingPage;
