import { http } from './http';

/**
 * Statistics API Service
 * Provides methods for retrieving various statistics
 */

// Get new users by month
export const getNewUsersByMonth = async () => {
  const response = await http.get('/stats/new-users-by-month');
  return response;
};

// Get user statistics
export const getUserStatistics = async () => {
  const response = await http.get('/stats/users');
  return response;
};

// Get trading statistics
export const getTradingStatistics = async () => {
  const response = await http.get('/stats/trading');
  return response;
};

// Get portfolio statistics
export const getPortfolioStatistics = async () => {
  const response = await http.get('/stats/portfolios');
  return response;
};

// Get system statistics
export const getSystemStatistics = async () => {
  const response = await http.get('/stats/system');
  return response;
};

export default {
  getNewUsersByMonth,
  getUserStatistics,
  getTradingStatistics,
  getPortfolioStatistics,
  getSystemStatistics
};
