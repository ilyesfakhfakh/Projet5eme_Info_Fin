import { http } from './http';

/**
 * Trading Strategies API Service
 * Provides methods to interact with the trading strategies backend endpoints
 */

// Create a new trading strategy
export const createTradingStrategy = async (strategyData) => {
  const response = await http.post('/trading-strategies', strategyData);
  return response;
};

// Get all trading strategies (with optional filters)
export const getAllTradingStrategies = async (filters = {}) => {
  const response = await http.get('/trading-strategies', { params: filters });
  return response;
};

// Get trading strategy by ID
export const getTradingStrategyById = async (strategyId) => {
  const response = await http.get(`/trading-strategies/${strategyId}`);
  return response;
};

// Update trading strategy
export const updateTradingStrategy = async (strategyId, updateData) => {
  const response = await http.put(`/trading-strategies/${strategyId}`, updateData);
  return response;
};

// Delete trading strategy
export const deleteTradingStrategy = async (strategyId) => {
  const response = await http.del(`/trading-strategies/${strategyId}`);
  return response;
};

// Backtest a strategy
export const backtestStrategy = async (strategyId, { from, to }) => {
  const response = await http.post(`/trading-strategies/${strategyId}/backtest`, { from, to });
  return response;
};

// Get performance history
export const getStrategyPerformance = async (strategyId) => {
  const response = await http.get(`/trading-strategies/${strategyId}/performance`);
  return response;
};

// Activate a strategy
export const activateStrategy = async (strategyId) => {
  const response = await http.put(`/trading-strategies/${strategyId}/activate`);
  return response;
};

// Deactivate a strategy (using update)
export const deactivateStrategy = async (strategyId) => {
  const response = await http.put(`/trading-strategies/${strategyId}`, { is_active: false });
  return response;
};

// Run strategy once
export const runStrategyOnce = async (strategyId) => {
  const response = await http.post(`/trading-strategies/${strategyId}/run`);
  return response;
};

export default {
  createTradingStrategy,
  getAllTradingStrategies,
  getTradingStrategyById,
  updateTradingStrategy,
  deleteTradingStrategy,
  backtestStrategy,
  getStrategyPerformance,
  activateStrategy,
  deactivateStrategy,
  runStrategyOnce
};
