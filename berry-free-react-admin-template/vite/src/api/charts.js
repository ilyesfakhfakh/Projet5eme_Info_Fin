import { http } from './http';

/**
 * Charts API Service
 * Provides methods to interact with the charts backend endpoints
 */

// Create a new chart
export const createChart = async (chartData) => {
  const response = await http.post('/charts', chartData);
  return response;
};

// Get all charts with optional filters
export const getCharts = async (filters = {}) => {
  const response = await http.get('/charts', { params: filters });
  return response;
};

// Get a chart by ID
export const getChartById = async (chartId) => {
  const response = await http.get(`/charts/${chartId}`);
  return response;
};

// Update a chart
export const updateChart = async (chartId, updateData) => {
  const response = await http.put(`/charts/${chartId}`, updateData);
  return response;
};

// Delete a chart
export const deleteChart = async (chartId) => {
  const response = await http.del(`/charts/${chartId}`);
  return response;
};

// Get charts by asset ID
export const getChartsByAsset = async (assetId) => {
  const response = await http.get(`/charts/asset/${assetId}`);
  return response;
};

// Get charts by type
export const getChartsByType = async (chartType) => {
  const response = await http.get(`/charts/type/${chartType}`);
  return response;
};

// Update chart annotations
export const updateChartAnnotations = async (chartId, annotations) => {
  const response = await http.put(`/charts/${chartId}/annotations`, { annotations });
  return response;
};

// Get chart with indicators
export const getChartWithIndicators = async (chartId) => {
  const response = await http.get(`/charts/${chartId}/with-indicators`);
  return response;
};

export default {
  createChart,
  getCharts,
  getChartById,
  updateChart,
  deleteChart,
  getChartsByAsset,
  getChartsByType,
  updateChartAnnotations,
  getChartWithIndicators
};
