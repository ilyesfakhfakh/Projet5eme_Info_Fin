import { http } from './http';

// Risk exposure functions
export const getExposure = async (params = {}) => {
  const response = await http.get('/risk/exposure', { params });
  return response;
};

export const getAggregatedExposure = async (params = {}) => {
  const response = await http.get('/risk/aggregate/exposure', { params });
  return response;
};

// Risk metrics functions
export const getRiskMetrics = async (params = {}) => {
  const response = await http.get('/risk/metrics', { params });
  return response;
};

export const getAggregatedRiskMetrics = async (params = {}) => {
  const response = await http.get('/risk/aggregate/metrics', { params });
  return response;
};

// Risk calculation functions
export const calculateVaR = async (data) => {
  const response = await http.post('/risk/calculate/var', data);
  return response;
};

export const calculateCVaR = async (data) => {
  const response = await http.post('/risk/calculate/cvar', data);
  return response;
};

export const calculateSharpeRatio = async (data) => {
  const response = await http.post('/risk/calculate/sharpe', data);
  return response;
};

export const calculateMaxDrawdown = async (data) => {
  const response = await http.post('/risk/calculate/max-drawdown', data);
  return response;
};

export const calculateHistoricalVaR = async (data) => {
  const response = await http.post('/risk/calculate/historical-var', data);
  return response;
};

export const calculateAggregatedVaR = async (data) => {
  const response = await http.post('/risk/aggregate/var', data);
  return response;
};

// Risk limits functions
export const getLimits = async (params = {}) => {
  const response = await http.get('/risk/limits', { params });
  return response;
};

export const createLimit = async (limitData) => {
  const response = await http.post('/risk/limits', limitData);
  return response;
};

export const updateLimit = async (id, limitData) => {
  const response = await http.put(`/risk/limits/${id}`, limitData);
  return response;
};

export const deleteLimit = async (id) => {
  const response = await http.del(`/risk/limits/${id}`);
  return response;
};

// Risk alerts functions
export const getAlerts = async (params = {}) => {
  const response = await http.get('/risk/alerts', { params });
  return response;
};

export const acknowledgeAlert = async (id) => {
  const response = await http.put(`/risk/alerts/${id}/acknowledge`);
  return response;
};

// Stress testing functions
export const getStressScenarios = async () => {
  const response = await http.get('/risk/stress/scenarios');
  return response;
};

export const runStressTest = async (data) => {
  const response = await http.post('/risk/stress/run', data);
  return response;
};

// Risk monitoring and assessment
export const monitorRiskLimits = async (data) => {
  const response = await http.post('/risk/monitor/limits', data);
  return response;
};

export const runRiskAssessment = async (data) => {
  const response = await http.post('/risk/assessment/run', data);
  return response;
};

// Scenario validation and approval
export const validateScenario = async (id, data) => {
  const response = await http.post(`/risk/scenarios/${id}/validate`, data);
  return response;
};

export const approveScenario = async (id, data) => {
  const response = await http.post(`/risk/scenarios/${id}/approve`, data);
  return response;
};

export const rejectScenario = async (id, data) => {
  const response = await http.post(`/risk/scenarios/${id}/reject`, data);
  return response;
};

// Default export for compatibility
export default {
  getExposure,
  getAggregatedExposure,
  getRiskMetrics,
  getAggregatedRiskMetrics,
  calculateVaR,
  calculateCVaR,
  calculateSharpeRatio,
  calculateMaxDrawdown,
  calculateHistoricalVaR,
  calculateAggregatedVaR,
  getLimits,
  createLimit,
  updateLimit,
  deleteLimit,
  getAlerts,
  acknowledgeAlert,
  getStressScenarios,
  runStressTest,
  monitorRiskLimits,
  runRiskAssessment,
  validateScenario,
  approveScenario,
  rejectScenario
};