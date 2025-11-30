import { http } from './http';

/**
 * Price & OHLCV API Service
 * Provides methods to interact with price and OHLCV data endpoints
 */

// === Price Operations ===

// Get current price for an asset
export const getCurrentPrice = async (assetId, method = 'midPrice') => {
  const response = await http.get(`/price/${assetId}/current`, { 
    params: { method } 
  });
  return response;
};

// Get price history for an asset
export const getPriceHistory = async (assetId, from, to, interval = '1h') => {
  const response = await http.get(`/price/${assetId}/history`, {
    params: { from, to, interval }
  });
  return response;
};

// Get VWAP for an asset
export const getVWAP = async (assetId, period = '1h') => {
  const response = await http.get(`/price/${assetId}/vwap`, {
    params: { period }
  });
  return response;
};

// Get OHLCV data for an asset
export const getOHLCV = async (assetId, interval = '1h', from, to, limit = 100) => {
  const response = await http.get(`/price/${assetId}/ohlcv`, {
    params: { interval, from, to, limit }
  });
  return response;
};

// Get ticker information (24h summary)
export const getTicker = async (assetId) => {
  const response = await http.get(`/price/${assetId}/ticker`);
  return response;
};

// Generate OHLCV data for an asset (admin endpoint)
export const generateOHLCV = async (assetId, interval = '1h', hoursBack = 24) => {
  const response = await http.post(`/price/${assetId}/ohlcv/generate`, {
    interval,
    hoursBack
  });
  return response;
};

// Generate OHLCV data for all assets (admin endpoint)
export const generateAllOHLCV = async (interval = '1h', hoursBack = 24) => {
  const response = await http.post('/price/ohlcv/generate-all', {
    interval,
    hoursBack
  });
  return response;
};

// === OHLCV Specific Operations ===

// Get OHLCV data
export const getOHLCVData = async (assetId, interval = '1h', from, to, limit = 100) => {
  const response = await http.get(`/ohlcv/${assetId}`, {
    params: { interval, from, to, limit }
  });
  return response;
};

// Get latest OHLCV data
export const getLatestOHLCV = async (assetId, interval = '1h') => {
  const response = await http.get(`/ohlcv/${assetId}/latest`, {
    params: { interval }
  });
  return response;
};

// Get OHLCV statistics
export const getOHLCVStats = async (assetId, interval = '1h', days = 30) => {
  const response = await http.get(`/ohlcv/${assetId}/stats`, {
    params: { interval, days }
  });
  return response;
};

// Generate OHLCV for specific asset
export const generateOHLCVForAsset = async (assetId, interval = '1h', hoursBack = 24) => {
  const response = await http.post(`/ohlcv/${assetId}/generate`, {
    interval,
    hoursBack
  });
  return response;
};

// Generate OHLCV for all assets
export const generateOHLCVForAllAssets = async (interval = '1h', hoursBack = 24) => {
  const response = await http.post('/ohlcv/generate-all', {
    interval,
    hoursBack
  });
  return response;
};

// Aggregate OHLCV data
export const aggregateOHLCV = async (assetId, targetInterval, sourceInterval = '1m') => {
  const response = await http.post(`/ohlcv/${assetId}/aggregate`, {
    targetInterval,
    sourceInterval
  });
  return response;
};

export default {
  // Price
  getCurrentPrice,
  getPriceHistory,
  getVWAP,
  getOHLCV,
  getTicker,
  generateOHLCV,
  generateAllOHLCV,
  
  // OHLCV
  getOHLCVData,
  getLatestOHLCV,
  getOHLCVStats,
  generateOHLCVForAsset,
  generateOHLCVForAllAssets,
  aggregateOHLCV
};
