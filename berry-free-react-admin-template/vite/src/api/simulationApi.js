import { http } from './http';

/**
 * Comprehensive Simulation API Service
 * Provides all simulation management methods including time control, data generation, and import
 */

// === Simulation State Management ===

// Get current simulation state
export const getSimulationState = async () => {
  const response = await http.get('/simulation/state');
  return response;
};

// Start simulation
export const startSimulation = async (config) => {
  const response = await http.post('/simulation/start', config);
  return response;
};

// Pause simulation
export const pauseSimulation = async () => {
  const response = await http.post('/simulation/pause');
  return response;
};

// Resume simulation
export const resumeSimulation = async () => {
  const response = await http.post('/simulation/resume');
  return response;
};

// Stop simulation
export const stopSimulation = async () => {
  const response = await http.post('/simulation/stop');
  return response;
};

// Reset simulation
export const resetSimulation = async () => {
  const response = await http.post('/simulation/reset');
  return response;
};

// Set simulation speed
export const setSimulationSpeed = async (speed) => {
  const response = await http.post('/simulation/speed', { speed });
  return response;
};

// Jump to specific date
export const jumpToDate = async (date) => {
  const response = await http.post('/simulation/jump-to-date', { date });
  return response;
};

// === Asset Management ===

// Initialize asset for data generation
export const initializeAsset = async (asset, initialPrice, params = {}) => {
  const response = await http.post('/simulation/initialize-asset', {
    asset,
    initialPrice,
    params
  });
  return response;
};

// Get current price for asset
export const getCurrentAssetPrice = async (asset) => {
  const response = await http.get(`/simulation/price/${asset}`);
  return response;
};

// Get price history for asset
export const getAssetPriceHistory = async (asset, limit = null) => {
  const params = {};
  if (limit) params.limit = limit;
  const response = await http.get(`/simulation/price-history/${asset}`, { params });
  return response;
};

// === Data Import ===

// Import data from CSV
export const importFromCSV = async (asset, filePath, options = {}) => {
  const response = await http.post('/simulation/import/csv', {
    asset,
    filePath,
    options
  });
  return response;
};

// Import data from Yahoo Finance
export const importFromYahooFinance = async (asset, period = '1y', interval = '1d') => {
  const response = await http.post('/simulation/import/yahoo', {
    asset,
    period,
    interval
  });
  return response;
};

// Import data from Alpha Vantage
export const importFromAlphaVantage = async (asset, apiKey, options = {}) => {
  const response = await http.post('/simulation/import/alpha-vantage', {
    asset,
    apiKey,
    options
  });
  return response;
};

// Get imported data
export const getImportedData = async (asset, startDate = null, endDate = null) => {
  const params = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const response = await http.get(`/simulation/imported-data/${asset}`, { params });
  return response;
};

// Validate imported data
export const validateImportedData = async (asset) => {
  const response = await http.get(`/simulation/validate-data/${asset}`);
  return response;
};

// === Snapshot Management ===

// Save simulation snapshot
export const saveSnapshot = async () => {
  const response = await http.post('/simulation/snapshot/save');
  return response;
};

// Load simulation snapshot
export const loadSnapshot = async (snapshot) => {
  const response = await http.post('/simulation/snapshot/load', { snapshot });
  return response;
};

// === Metrics & Events ===

// Get simulation metrics
export const getSimulationMetrics = async () => {
  const response = await http.get('/simulation/metrics');
  return response;
};

// Schedule an event
export const scheduleEvent = async (event, scheduledTime) => {
  const response = await http.post('/simulation/schedule-event', {
    event,
    scheduledTime
  });
  return response;
};

export default {
  // State Management
  getSimulationState,
  startSimulation,
  pauseSimulation,
  resumeSimulation,
  stopSimulation,
  resetSimulation,
  setSimulationSpeed,
  jumpToDate,
  
  // Asset Management
  initializeAsset,
  getCurrentAssetPrice,
  getAssetPriceHistory,
  
  // Data Import
  importFromCSV,
  importFromYahooFinance,
  importFromAlphaVantage,
  getImportedData,
  validateImportedData,
  
  // Snapshot
  saveSnapshot,
  loadSnapshot,
  
  // Metrics & Events
  getSimulationMetrics,
  scheduleEvent
};
