import { http } from './http';

/**
 * Portfolio API Service
 * Provides methods to interact with the portfolio backend endpoints
 */

// Get portfolio summary with current valuation
export const getPortfolioSummary = async (portfolioId) => {
  const response = await http.get(`/portfolio/${portfolioId}/summary`);
  return response;
};

// Calculate and update portfolio value
export const calculatePortfolioValue = async (portfolioId) => {
  const response = await http.post(`/portfolio/${portfolioId}/calculate-value`);
  return response;
};

// Update all portfolio values (admin endpoint)
export const updateAllPortfolioValues = async () => {
  const response = await http.post('/portfolio/update-all-values');
  return response;
};

export default {
  getPortfolioSummary,
  calculatePortfolioValue,
  updateAllPortfolioValues
};
