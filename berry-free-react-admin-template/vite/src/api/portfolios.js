import { http } from './http';

export const listPortfolios = async (params = {}) => {
  const response = await http.get('/portfolios', { params });
  return response;
};

export const getPortfolio = async (id) => {
  const response = await http.get(`/portfolios/${id}`);
  return response;
};

export const createPortfolio = async (portfolioData) => {
  const response = await http.post('/portfolios', portfolioData);
  return response;
};

export const updatePortfolio = async (id, portfolioData) => {
  const response = await http.put(`/portfolios/${id}`, portfolioData);
  return response;
};

export const deletePortfolio = async (id) => {
  const response = await http.del(`/portfolios/${id}`);
  return response;
};

export const getPortfolioBalances = async (id) => {
  const response = await http.get(`/portfolios/${id}/balances`);
  return response;
};

export const getCurrencyExposure = async (id) => {
  const response = await http.get(`/portfolios/${id}/currency-exposure`);
  return response;
};

export const getPortfolioPerformance = async (id, params = {}) => {
  const response = await http.get(`/portfolios/${id}/performance`, { params });
  return response;
};

export const rebalancePortfolio = async (id, rebalanceData) => {
  const response = await http.post(`/portfolios/${id}/rebalance`, rebalanceData);
  return response;
};

export const optimizePortfolio = async (id, params = {}) => {
  const response = await http.get(`/portfolios/${id}/optimize`, { params });
  return response;
};

export const refreshPortfolio = async (id, params = {}) => {
  const response = await http.post(`/portfolios/${id}/refresh`, {}, { params });
  return response;
};

export const refreshAllPortfolios = async (params = {}) => {
  const response = await http.post('/portfolios/refresh', {}, { params });
  return response;
};

// Position management functions
export const createPosition = async (portfolioId, positionData) => {
  const response = await http.post(`/portfolios/${portfolioId}/positions`, positionData);
  return response;
};

export const getPortfolioPositions = async (portfolioId, params = {}) => {
  const response = await http.get(`/portfolios/${portfolioId}/positions`, { params });
  return response;
};

export const getPosition = async (positionId) => {
  const response = await http.get(`/portfolios/positions/${positionId}`);
  return response;
};

export const updatePosition = async (positionId, positionData) => {
  const response = await http.put(`/portfolios/positions/${positionId}`, positionData);
  return response;
};

export const archivePosition = async (positionId) => {
  const response = await http.patch(`/portfolios/positions/${positionId}/archive`);
  return response;
};

export const deletePosition = async (positionId) => {
  const response = await http.del(`/portfolios/positions/${positionId}`);
  return response;
};

export const getPositionPerformance = async (positionId) => {
  const response = await http.get(`/portfolios/positions/${positionId}/performance`);
  return response;
};

// Default export for compatibility
export default {
  listPortfolios,
  getPortfolio,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  getPortfolioBalances,
  getCurrencyExposure,
  getPortfolioPerformance,
  rebalancePortfolio,
  optimizePortfolio,
  refreshPortfolio,
  refreshAllPortfolios,
  createPosition,
  getPortfolioPositions,
  getPosition,
  updatePosition,
  archivePosition,
  deletePosition,
  getPositionPerformance
};