import { http } from './http';

/**
 * Technical Indicators API Service
 * Comprehensive service for technical indicators management
 */

// === CRUD Operations ===

// Create a new technical indicator
export const createTechnicalIndicator = async (indicatorData) => {
  const response = await http.post('/technical-indicators', indicatorData);
  return response;
};

// Get all technical indicators
export const getTechnicalIndicators = async (filters = {}) => {
  const response = await http.get('/technical-indicators', { params: filters });
  return response;
};

// Get a technical indicator by ID
export const getTechnicalIndicatorById = async (indicatorId) => {
  const response = await http.get(`/technical-indicators/${indicatorId}`);
  return response;
};

// Update a technical indicator
export const updateTechnicalIndicator = async (indicatorId, updateData) => {
  const response = await http.put(`/technical-indicators/${indicatorId}`, updateData);
  return response;
};

// Delete a technical indicator
export const deleteTechnicalIndicator = async (indicatorId) => {
  const response = await http.del(`/technical-indicators/${indicatorId}`);
  return response;
};

// === Query Operations ===

// Get technical indicators by asset ID
export const getTechnicalIndicatorsByAsset = async (assetId) => {
  const response = await http.get(`/technical-indicators/asset/${assetId}`);
  return response;
};

// Get technical indicators by type
export const getTechnicalIndicatorsByType = async (indicatorType) => {
  const response = await http.get(`/technical-indicators/type/${indicatorType}`);
  return response;
};

// === Calculation Operations ===

// Calculate a technical indicator
export const calculateTechnicalIndicator = async (indicatorId) => {
  const response = await http.post(`/technical-indicators/${indicatorId}/calculate`);
  return response;
};

// Get indicator values
export const getTechnicalIndicatorValues = async (indicatorId, limit = 100) => {
  const response = await http.get(`/technical-indicators/${indicatorId}/values`, { 
    params: { limit } 
  });
  return response;
};

// Calculate indicator for asset and period
export const calculateIndicatorForAsset = async (indicatorId, assetId, period) => {
  const response = await http.get(`/technical-indicators/${indicatorId}/calculate/${assetId}/${period}`);
  return response;
};

// Update indicator values
export const updateIndicatorValues = async (indicatorId) => {
  const response = await http.post(`/technical-indicators/${indicatorId}/update`);
  return response;
};

// Batch recalculate all indicators
export const batchRecalculateIndicators = async () => {
  const response = await http.post('/technical-indicators/batch-recalculate');
  return response;
};

// === Signal Operations ===

// Generate trading signal
export const generateSignal = async (indicatorValue, indicatorType) => {
  const response = await http.get(`/technical-indicators/signal/${indicatorValue}/${indicatorType}`);
  return response;
};

// Detect trend
export const detectTrend = async (indicatorId, assetId) => {
  const response = await http.get(`/technical-indicators/${indicatorId}/trend/${assetId}`);
  return response;
};

// Combine indicators
export const combineIndicators = async (primaryId, secondaryId, assetId) => {
  const response = await http.get(`/technical-indicators/combine/${primaryId}/${secondaryId}/${assetId}`);
  return response;
};

// === Optimization Operations ===

// Optimize indicator parameters
export const optimizeParameters = async (indicatorId, assetId, parameterRanges) => {
  const response = await http.post(`/technical-indicators/${indicatorId}/optimize/${assetId}`, {
    parameterRanges
  });
  return response;
};

// === Historical Operations ===

// Get historical values
export const getHistoricalValues = async (indicatorId, assetId, startDate, endDate) => {
  const response = await http.get(`/technical-indicators/${indicatorId}/history/${assetId}`, {
    params: { startDate, endDate }
  });
  return response;
};

// Evaluate indicator performance
export const evaluatePerformance = async (indicatorId, assetId, startDate, endDate) => {
  const response = await http.get(`/technical-indicators/${indicatorId}/performance/${assetId}`, {
    params: { startDate, endDate }
  });
  return response;
};

// Predict next signal
export const predictNextSignal = async (indicatorId, assetId) => {
  const response = await http.get(`/technical-indicators/${indicatorId}/predict/${assetId}`);
  return response;
};

// === Other Operations ===

// Recalculate indicator completely
export const recalculateIndicator = async (indicatorId) => {
  const response = await http.post(`/technical-indicators/${indicatorId}/recalculate`);
  return response;
};

// Validate indicator parameters
export const validateParameters = async (indicatorType, parameters) => {
  const response = await http.post('/technical-indicators/validate', {
    indicatorType,
    parameters
  });
  return response;
};

// Check for signal change alerts
export const checkSignalChangeAlert = async (assetId) => {
  const response = await http.get(`/technical-indicators/alert/${assetId}`);
  return response;
};

// === Indicator Value Operations ===

// Create indicator value
export const createIndicatorValue = async (valueData) => {
  const response = await http.post('/indicator-values', valueData);
  return response;
};

// Bulk create indicator values
export const bulkCreateIndicatorValues = async (valuesData) => {
  const response = await http.post('/indicator-values/bulk', valuesData);
  return response;
};

// Get indicator values with filters
export const getIndicatorValues = async (filters = {}) => {
  const response = await http.get('/indicator-values', { params: filters });
  return response;
};

// Get indicator value by ID
export const getIndicatorValueById = async (valueId) => {
  const response = await http.get(`/indicator-values/${valueId}`);
  return response;
};

// Get indicator values by indicator ID
export const getIndicatorValuesByIndicatorId = async (indicatorId) => {
  const response = await http.get(`/indicator-values/indicator/${indicatorId}`);
  return response;
};

// Get indicator values by indicator ID and date range
export const getIndicatorValuesByDateRange = async (indicatorId, startDate, endDate) => {
  const response = await http.get(`/indicator-values/indicator/${indicatorId}/range`, {
    params: { startDate, endDate }
  });
  return response;
};

// Get latest indicator value
export const getLatestIndicatorValue = async (indicatorId) => {
  const response = await http.get(`/indicator-values/indicator/${indicatorId}/latest`);
  return response;
};

// Get indicator values by signal
export const getIndicatorValuesBySignal = async (signal) => {
  const response = await http.get(`/indicator-values/signal/${signal}`);
  return response;
};

// Delete indicator values by indicator ID
export const deleteIndicatorValuesByIndicatorId = async (indicatorId) => {
  const response = await http.del(`/indicator-values/indicator/${indicatorId}`);
  return response;
};

export default {
  // CRUD
  createTechnicalIndicator,
  getTechnicalIndicators,
  getTechnicalIndicatorById,
  updateTechnicalIndicator,
  deleteTechnicalIndicator,
  
  // Query
  getTechnicalIndicatorsByAsset,
  getTechnicalIndicatorsByType,
  
  // Calculation
  calculateTechnicalIndicator,
  getTechnicalIndicatorValues,
  calculateIndicatorForAsset,
  updateIndicatorValues,
  batchRecalculateIndicators,
  
  // Signals
  generateSignal,
  detectTrend,
  combineIndicators,
  
  // Optimization
  optimizeParameters,
  
  // Historical
  getHistoricalValues,
  evaluatePerformance,
  predictNextSignal,
  
  // Other
  recalculateIndicator,
  validateParameters,
  checkSignalChangeAlert,
  
  // Indicator Values
  createIndicatorValue,
  bulkCreateIndicatorValues,
  getIndicatorValues,
  getIndicatorValueById,
  getIndicatorValuesByIndicatorId,
  getIndicatorValuesByDateRange,
  getLatestIndicatorValue,
  getIndicatorValuesBySignal,
  deleteIndicatorValuesByIndicatorId
};
