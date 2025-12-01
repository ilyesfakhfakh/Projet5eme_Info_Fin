import { http } from './http';

// Yield Curve Management
export const createYieldCurve = async (yieldCurveData) => {
  const response = await http.post('/alm/yield-curves', yieldCurveData);
  return response;
};

export const getYieldCurves = async (params = {}) => {
  const response = await http.get('/alm/yield-curves', { params });
  return response;
};

export const getYieldCurveById = async (id) => {
  const response = await http.get(`/alm/yield-curves/${id}`);
  return response;
};

export const generateYieldCurve = async (curveData) => {
  const response = await http.post('/alm/yield-curves/generate', curveData);
  return response;
};

// Cashflow Projections
export const projectCashflows = async (projectionData) => {
  const response = await http.post('/alm/cashflow-projections', projectionData);
  return response;
};

// PV Calculations
export const calculatePV = async (pvData) => {
  const response = await http.post('/alm/pv-calculation', pvData);
  return response;
};

// Duration and Convexity
export const calculateDurationConvexity = async (durationData) => {
  const response = await http.post('/alm/duration-convexity', durationData);
  return response;
};

// Liquidity Gap
export const calculateLiquidityGap = async (gapData) => {
  const response = await http.post('/alm/liquidity-gap', gapData);
  return response;
};

// Interest Rate Sensitivity
export const calculateInterestRateSensitivity = async (sensitivityData) => {
  const response = await http.post('/alm/interest-rate-sensitivity', sensitivityData);
  return response;
};

// Liquidity Ratios
export const calculateLiquidityRatios = async (portfolioId) => {
  const response = await http.get(`/alm/liquidity-ratios/${portfolioId}`);
  return response;
};

// Duration Gap
export const calculateDurationGap = async (portfolioId) => {
  const response = await http.get(`/alm/duration-gap/${portfolioId}`);
  return response;
};

// Default export for compatibility
export default {
  createYieldCurve,
  getYieldCurves,
  getYieldCurveById,
  projectCashflows,
  calculatePV,
  calculateDurationConvexity,
  calculateLiquidityGap,
  calculateInterestRateSensitivity,
  calculateLiquidityRatios,
  calculateDurationGap
};