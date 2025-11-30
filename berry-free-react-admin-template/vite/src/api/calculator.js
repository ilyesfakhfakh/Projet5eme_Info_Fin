import { http } from './http';

/**
 * Calculator API Service
 * Provides methods for technical indicator calculations
 */

// Calculate SMA (Simple Moving Average)
export const calculateSMA = async (prices, period) => {
  const response = await http.post('/calculator/sma', { prices, period });
  return response;
};

// Calculate EMA (Exponential Moving Average)
export const calculateEMA = async (prices, period) => {
  const response = await http.post('/calculator/ema', { prices, period });
  return response;
};

// Calculate RSI (Relative Strength Index)
export const calculateRSI = async (prices, period = 14) => {
  const response = await http.post('/calculator/rsi', { prices, period });
  return response;
};

// Calculate MACD (Moving Average Convergence Divergence)
export const calculateMACD = async (prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
  const response = await http.post('/calculator/macd', {
    prices,
    fastPeriod,
    slowPeriod,
    signalPeriod
  });
  return response;
};

// Calculate Bollinger Bands
export const calculateBollingerBands = async (prices, period = 20, stdDev = 2) => {
  const response = await http.post('/calculator/bollinger-bands', {
    prices,
    period,
    stdDev
  });
  return response;
};

// Generate trading signal
export const generateSignal = async (indicatorType, currentValue, previousValue = null, parameters = {}) => {
  const response = await http.post('/calculator/signal', {
    indicatorType,
    currentValue,
    previousValue,
    parameters
  });
  return response;
};

// Calculate multiple indicators at once
export const calculateMultiple = async (prices, indicators) => {
  const response = await http.post('/calculator/multiple', {
    prices,
    indicators
  });
  return response;
};

// Validate calculation parameters
export const validateParameters = async (indicatorType, parameters) => {
  const response = await http.post('/calculator/validate', {
    indicatorType,
    parameters
  });
  return response;
};

// Get calculation examples
export const getCalculationExamples = async () => {
  const response = await http.get('/calculator/examples');
  return response;
};

export default {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  generateSignal,
  calculateMultiple,
  validateParameters,
  getCalculationExamples
};
