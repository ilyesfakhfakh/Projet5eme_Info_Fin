import { http } from './http';

/**
 * Portfolios API Service
 */

// Get all portfolios
export const getPortfolios = async (filters = {}) => {
  const response = await http.get('/portfolios', { params: filters });
  return response;
};

// Get portfolio by ID
export const getPortfolioById = async (portfolioId) => {
  const response = await http.get(`/portfolios/${portfolioId}`);
  return response;
};

export default {
  getPortfolios,
  getPortfolioById
};
