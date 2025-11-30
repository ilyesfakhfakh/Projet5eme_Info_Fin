import api from './api';

export const tradingService = {
  // Get order book for a symbol
  getOrderBook: async (symbol = 'BTC/USDT') => {
    try {
      const response = await api.get(`/trading/orderbook/${symbol}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching order book:', error);
      throw error;
    }
  },

  // Get open positions
  getPositions: async () => {
    try {
      const response = await api.get('/trading/positions');
      return response.data;
    } catch (error) {
      console.error('Error fetching positions:', error);
      throw error;
    }
  },

  // Get trading history
  getTradingHistory: async (symbol = 'BTC/USDT', limit = 100) => {
    try {
      const response = await api.get(`/trading/history/${symbol}?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching trading history:', error);
      throw error;
    }
  },

  // Place a new order
  placeOrder: async (orderData) => {
    try {
      const response = await api.post('/trading/orders', orderData);
      return response.data;
    } catch (error) {
      console.error('Error placing order:', error);
      throw error;
    }
  },

  // Cancel an order
  cancelOrder: async (orderId) => {
    try {
      const response = await api.delete(`/trading/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error canceling order:', error);
      throw error;
    }
  },

  // Get account balance
  getBalance: async () => {
    try {
      const response = await api.get('/trading/balance');
      return response.data;
    } catch (error) {
      console.error('Error fetching balance:', error);
      throw error;
    }
  },

  // Get open orders
  getOpenOrders: async (symbol = 'BTC/USDT') => {
    try {
      const response = await api.get(`/trading/orders/open?symbol=${symbol}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching open orders:', error);
      throw error;
    }
  },

  // Get market data
  getMarketData: async (symbol = 'BTC/USDT', timeframe = '1h', limit = 100) => {
    try {
      const response = await api.get(
        `/trading/market-data/${symbol}?timeframe=${timeframe}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching market data:', error);
      throw error;
    }
  }
};

export default tradingService;
