import { http } from './http';

/**
 * Orders API Service
 * Provides methods to interact with the orders backend endpoints
 */

// Create a new order
export const createOrder = async (orderData) => {
  const response = await http.post('/orders', orderData);
  return response;
};

// Get all orders with optional filters
export const getOrders = async (filters = {}) => {
  const response = await http.get('/orders', { params: filters });
  return response;
};

// Get a single order by ID
export const getOrderById = async (orderId) => {
  const response = await http.get(`/orders/${orderId}`);
  return response;
};

// Update an order
export const updateOrder = async (orderId, updateData) => {
  const response = await http.put(`/orders/${orderId}`, updateData);
  return response;
};

// Delete/cancel an order
export const deleteOrder = async (orderId) => {
  const response = await http.del(`/orders/${orderId}`);
  return response;
};

// Cancel a single order (alias for deleteOrder)
export const cancelOrder = async (orderId) => {
  const response = await http.del(`/orders/${orderId}`);
  return response;
};

// Replace an order (modify quantity or price)
export const replaceOrder = async (orderId, updates) => {
  const response = await http.put(`/orders/${orderId}/replace`, updates);
  return response;
};

// Cancel all orders for a portfolio/asset
export const cancelAllOrders = async (portfolioId, assetId) => {
  const params = {};
  if (portfolioId) params.portfolio_id = portfolioId;
  if (assetId) params.asset_id = assetId;
  const response = await http.del('/orders/cancel-all', { params });
  return response;
};

// Get open orders
export const getOpenOrders = async (portfolioId, assetId) => {
  const params = {};
  if (portfolioId) params.portfolio_id = portfolioId;
  if (assetId) params.asset_id = assetId;
  const response = await http.get('/orders/open', { params });
  return response;
};

// Get order history for a portfolio
export const getOrderHistory = async (portfolioId, options = {}) => {
  const response = await http.get(`/orders/history/${portfolioId}`, { params: options });
  return response;
};

// Get fill ratio for an order
export const getOrderFillRatio = async (orderId) => {
  const response = await http.get(`/orders/${orderId}/fill-ratio`);
  return response;
};

export default {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  cancelOrder,
  replaceOrder,
  cancelAllOrders,
  getOpenOrders,
  getOrderHistory,
  getOrderFillRatio
};
