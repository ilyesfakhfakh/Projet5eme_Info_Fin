import { http } from './http';

/**
 * Trading Strategies API Service
 * Provides methods to interact with the trading strategies backend endpoints
 */

// Create a new trading strategy
export const createStrategy = async (strategyData) => {
  const response = await http.post('/trading-strategies', strategyData);
  return response;
};

// Get all trading strategies with optional filters
export const getStrategies = async (filters = {}) => {
  const response = await http.get('/trading-strategies', { params: filters });
  return response;
};

// Get a single trading strategy by ID
export const getStrategyById = async (strategyId) => {
  const response = await http.get(`/trading-strategies/${strategyId}`);
  return response;
};

// Update a trading strategy
export const updateStrategy = async (strategyId, updateData) => {
  const response = await http.put(`/trading-strategies/${strategyId}`, updateData);
  return response;
};

// Delete a trading strategy
export const deleteStrategy = async (strategyId) => {
  const response = await http.del(`/trading-strategies/${strategyId}`);
  return response;
};

// Backtest a strategy
export const backtestStrategy = async (strategyId, options) => {
  const response = await http.post(`/trading-strategies/${strategyId}/backtest`, options);
  return response;
};

// Get strategy performance history
export const getStrategyPerformance = async (strategyId) => {
  const response = await http.get(`/trading-strategies/${strategyId}/performance`);
  return response;
};

// Activate a strategy
export const activateStrategy = async (strategyId) => {
  const response = await http.put(`/trading-strategies/${strategyId}/activate`);
  return response;
};

// Run strategy once
export const runStrategy = async (strategyId) => {
  const response = await http.post(`/trading-strategies/${strategyId}/run`);
  return response;
};

export default {
  createStrategy,
  getStrategies,
  getStrategyById,
  updateStrategy,
  deleteStrategy,
  backtestStrategy,
  getStrategyPerformance,
  activateStrategy,
  runStrategy
};
