import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getAuthToken()}`
  }
});

// Get all simulations
export const getSimulations = async () => {
  try {
    // In a real app, you would call the API:
    // const response = await api.get('/simulations');
    // return response.data;
    
    // Mock data for demonstration
    return [
      {
        id: 'sim-1',
        name: 'EMA Crossover Strategy',
        symbol: 'BTC/USD',
        timeframe: '1h',
        status: 'completed',
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-11-25T00:00:00Z',
        initialCapital: 10000,
        finalCapital: 15432.56,
        profitLoss: 5432.56,
        profitLossPercent: 54.33,
        winRate: 62.5,
        maxDrawdown: 12.3,
        sharpeRatio: 1.8,
        createdAt: '2025-11-20T10:30:00Z',
      },
      {
        id: 'sim-2',
        name: 'RSI Strategy',
        symbol: 'ETH/USD',
        timeframe: '4h',
        status: 'running',
        startDate: '2025-10-01T00:00:00Z',
        endDate: '2025-11-25T00:00:00Z',
        initialCapital: 5000,
        finalCapital: 6234.12,
        profitLoss: 1234.12,
        profitLossPercent: 24.68,
        winRate: 58.2,
        maxDrawdown: 8.7,
        sharpeRatio: 1.2,
        createdAt: '2025-11-15T14:15:00Z',
      },
    ];
  } catch (error) {
    console.error('Error fetching simulations:', error);
    throw error;
  }
};

// Get simulation by ID
export const getSimulationById = async (id) => {
  try {
    // In a real app, you would call the API:
    // const response = await api.get(`/simulations/${id}`);
    // return response.data;
    
    // Mock data for demonstration
    return {
      id,
      name: 'EMA Crossover Strategy',
      symbol: 'BTC/USD',
      timeframe: '1h',
      status: 'completed',
      startDate: '2025-01-01T00:00:00Z',
      endDate: '2025-11-25T00:00:00Z',
      initialCapital: 10000,
      finalCapital: 15432.56,
      profitLoss: 5432.56,
      profitLossPercent: 54.33,
      winRate: 62.5,
      maxDrawdown: 12.3,
      sharpeRatio: 1.8,
      createdAt: '2025-11-20T10:30:00Z',
      parameters: {
        fastEma: 9,
        slowEma: 21,
        takeProfit: 5,
        stopLoss: 2,
        maxOpenTrades: 3,
      },
      trades: Array.from({ length: 50 }, (_, i) => ({
        id: `trade-${i + 1}`,
        entryTime: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString(),
        exitTime: new Date(Date.now() - (i * 24 * 60 * 60 * 1000 - 3600000)).toISOString(),
        symbol: 'BTC/USD',
        side: i % 2 === 0 ? 'long' : 'short',
        entryPrice: 45000 + (Math.random() * 5000 - 2500),
        exitPrice: 45000 + (Math.random() * 5000 - 2500),
        quantity: 0.1 + (Math.random() * 0.9),
        pnl: (Math.random() * 200 - 100).toFixed(2),
        pnlPercent: (Math.random() * 10 - 5).toFixed(2),
        status: 'closed',
        strategy: 'EMA Crossover',
      })),
      equityCurve: Array.from({ length: 100 }, (_, i) => ({
        date: new Date(Date.now() - ((99 - i) * 24 * 60 * 60 * 1000)).toISOString(),
        equity: 10000 + (i * 100) + (Math.random() * 50 - 25),
        balance: 10000 + (i * 90) + (Math.random() * 45 - 22.5),
      })),
    };
  } catch (error) {
    console.error(`Error fetching simulation ${id}:`, error);
    throw error;
  }
};

// Create a new simulation
export const createSimulation = async (simulationData) => {
  try {
    // In a real app, you would call the API:
    // const response = await api.post('/simulations', simulationData);
    // return response.data;
    
    // Mock response
    return {
      id: `sim-${Math.random().toString(36).substr(2, 8)}`,
      ...simulationData,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error creating simulation:', error);
    throw error;
  }
};

// Update a simulation
export const updateSimulation = async (id, updates) => {
  try {
    // In a real app, you would call the API:
    // const response = await api.put(`/simulations/${id}`, updates);
    // return response.data;
    
    // Mock response
    return {
      id,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error updating simulation ${id}:`, error);
    throw error;
  }
};

// Delete a simulation
export const deleteSimulation = async (id) => {
  try {
    // In a real app, you would call the API:
    // await api.delete(`/simulations/${id}`);
    return { success: true };
  } catch (error) {
    console.error(`Error deleting simulation ${id}:`, error);
    throw error;
  }
};

// Get available strategy templates
export const getStrategyTemplates = async () => {
  try {
    // In a real app, you would call the API:
    // const response = await api.get('/simulations/strategies');
    // return response.data;
    
    // Mock data
    return [
      {
        id: 'ema-crossover',
        name: 'EMA Crossover',
        description: 'Enter long when fast EMA crosses above slow EMA, exit when it crosses below.',
        parameters: [
          { name: 'fastEma', type: 'number', default: 9, min: 1, max: 50, step: 1 },
          { name: 'slowEma', type: 'number', default: 21, min: 5, max: 200, step: 1 },
          { name: 'takeProfit', type: 'number', default: 5, min: 0.1, max: 50, step: 0.1, suffix: '%' },
          { name: 'stopLoss', type: 'number', default: 2, min: 0.1, max: 50, step: 0.1, suffix: '%' },
          { name: 'maxOpenTrades', type: 'number', default: 3, min: 1, max: 20, step: 1 },
        ],
      },
      {
        id: 'rsi-mean-reversion',
        name: 'RSI Mean Reversion',
        description: 'Enter when RSI is oversold/overbought and shows reversal signs.',
        parameters: [
          { name: 'rsiPeriod', type: 'number', default: 14, min: 2, max: 50, step: 1 },
          { name: 'overbought', type: 'number', default: 70, min: 50, max: 90, step: 1 },
          { name: 'oversold', type: 'number', default: 30, min: 10, max: 50, step: 1 },
          { name: 'takeProfit', type: 'number', default: 3, min: 0.1, max: 50, step: 0.1, suffix: '%' },
          { name: 'stopLoss', type: 'number', default: 1.5, min: 0.1, max: 50, step: 0.1, suffix: '%' },
        ],
      },
      {
        id: 'bollinger-bands',
        name: 'Bollinger Bands',
        description: 'Trade price bounces from Bollinger Bands with confirmation.',
        parameters: [
          { name: 'period', type: 'number', default: 20, min: 5, max: 50, step: 1 },
          { name: 'stdDev', type: 'number', default: 2, min: 1, max: 5, step: 0.1 },
          { name: 'takeProfit', type: 'number', default: 4, min: 0.1, max: 50, step: 0.1, suffix: '%' },
          { name: 'stopLoss', type: 'number', default: 2, min: 0.1, max: 50, step: 0.1, suffix: '%' },
        ],
      },
    ];
  } catch (error) {
    console.error('Error fetching strategy templates:', error);
    throw error;
  }
};

// Run a backtest
export const runBacktest = async (backtestConfig) => {
  try {
    // In a real app, you would call the API:
    // const response = await api.post('/simulations/backtest', backtestConfig);
    // return response.data;
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock response
    return {
      id: `backtest-${Math.random().toString(36).substr(2, 8)}`,
      status: 'completed',
      progress: 100,
      results: {
        initialCapital: backtestConfig.initialCapital || 10000,
        finalCapital: 12543.21,
        profitLoss: 2543.21,
        profitLossPercent: 25.43,
        totalTrades: 42,
        winRate: 61.9,
        maxDrawdown: 8.7,
        sharpeRatio: 1.5,
        sortinoRatio: 1.8,
        winLossRatio: 1.4,
        averageWin: 3.2,
        averageLoss: -2.3,
        largestWin: 8.7,
        largestLoss: -4.2,
        averageTradeDuration: '2h 15m',
      },
      trades: Array.from({ length: 42 }, (_, i) => ({
        id: `trade-${i + 1}`,
        entryTime: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString(),
        exitTime: new Date(Date.now() - (i * 24 * 60 * 60 * 1000 - 3600000)).toISOString(),
        symbol: backtestConfig.symbol || 'BTC/USD',
        side: i % 2 === 0 ? 'long' : 'short',
        entryPrice: 45000 + (Math.random() * 5000 - 2500),
        exitPrice: 45000 + (Math.random() * 5000 - 2500),
        quantity: 0.1 + (Math.random() * 0.9),
        pnl: (Math.random() * 200 - 50).toFixed(2),
        pnlPercent: (Math.random() * 10 - 2.5).toFixed(2),
        status: 'closed',
        strategy: backtestConfig.strategy || 'Custom Strategy',
      })),
      equityCurve: Array.from({ length: 100 }, (_, i) => ({
        date: new Date(Date.now() - ((99 - i) * 24 * 60 * 60 * 1000)).toISOString(),
        equity: (backtestConfig.initialCapital || 10000) + (i * 25) + (Math.random() * 20 - 10),
        balance: (backtestConfig.initialCapital || 10000) + (i * 22) + (Math.random() * 15 - 7.5),
      })),
    };
  } catch (error) {
    console.error('Error running backtest:', error);
    throw error;
  }
};

export default {
  getSimulations,
  getSimulationById,
  createSimulation,
  updateSimulation,
  deleteSimulation,
  getStrategyTemplates,
  runBacktest,
};
