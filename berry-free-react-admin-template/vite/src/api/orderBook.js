import { http } from './http';

/**
 * Order Book API Service
 * Provides methods to interact with the order book backend endpoints
 */

// Place an order and match
export const placeOrder = async (orderData) => {
  const response = await http.post('/trading/order-book/orders', orderData);
  return response;
};

// Cancel an order
export const cancelOrder = async (orderId) => {
  const response = await http.del(`/trading/order-book/orders/${orderId}`);
  return response;
};

// Get order book
export const getOrderBook = async (filters = {}) => {
  const response = await http.get('/trading/order-book/', { params: filters });
  return response;
};

// Get all executions for an order
export const getOrderExecutions = async (orderId) => {
  const response = await http.get(`/trading/order-book/executions/${orderId}`);
  return response;
};

// Get best bid for an asset
export const getBestBid = async (assetId) => {
  const response = await http.get(`/trading/order-book/best-bid/${assetId}`);
  return response;
};

// Get best ask for an asset
export const getBestAsk = async (assetId) => {
  const response = await http.get(`/trading/order-book/best-ask/${assetId}`);
  return response;
};

// Get market depth
export const getMarketDepth = async (assetId, side, levels = 10) => {
  const response = await http.get(`/trading/order-book/depth/${assetId}`, {
    params: { side, levels }
  });
  return response;
};

// Get spread for an asset
export const getSpread = async (assetId) => {
  const response = await http.get(`/trading/order-book/spread/${assetId}`);
  return response;
};

// Get top of book
export const getTopOfBook = async (assetId) => {
  const response = await http.get(`/trading/order-book/top/${assetId}`);
  return response;
};

// Get market snapshot
export const getMarketSnapshot = async (assetId) => {
  const response = await http.get(`/trading/order-book/snapshot/${assetId}`);
  return response;
};

// Purge stale orders
export const purgeStaleOrders = async (cutoffDate) => {
  const response = await http.post('/trading/order-book/purge-stale', { cutoffDate });
  return response;
};

// Reopen an order
export const reopenOrder = async (orderId) => {
  const response = await http.put(`/trading/order-book/reopen/${orderId}`);
  return response;
};

// Cancel expired orders
export const cancelExpiredOrders = async () => {
  const response = await http.post('/trading/order-book/cancel-expired');
  return response;
};

// Force matching cycle
export const forceMatchNow = async () => {
  const response = await http.post('/trading/order-book/match-now');
  return response;
};

// === Order Executions ===

// Create order execution
export const createOrderExecution = async (executionData) => {
  const response = await http.post('/order-executions', executionData);
  return response;
};

// Get all order executions
export const getAllOrderExecutions = async (orderId = null) => {
  const params = {};
  if (orderId) params.order_id = orderId;
  const response = await http.get('/order-executions', { params });
  return response;
};

// Get order execution by ID
export const getOrderExecutionById = async (executionId) => {
  const response = await http.get(`/order-executions/${executionId}`);
  return response;
};

// Update order execution
export const updateOrderExecution = async (executionId, updateData) => {
  const response = await http.put(`/order-executions/${executionId}`, updateData);
  return response;
};

// Delete order execution
export const deleteOrderExecution = async (executionId) => {
  const response = await http.del(`/order-executions/${executionId}`);
  return response;
};

// Get executions in range
export const getExecutionsInRange = async (assetId, from, to) => {
  const response = await http.get(`/order-executions/range/${assetId}`, {
    params: { from, to }
  });
  return response;
};

// Get VWAP from executions
export const getExecutionVWAP = async (assetId, from, to) => {
  const response = await http.get(`/order-executions/vwap/${assetId}`, {
    params: { from, to }
  });
  return response;
};

// Get last trade
export const getLastTrade = async (assetId) => {
  const response = await http.get(`/order-executions/last-trade/${assetId}`);
  return response;
};

// Aggregate executions by order
export const aggregateExecutionsByOrder = async (orderId) => {
  const response = await http.get(`/order-executions/aggregate/${orderId}`);
  return response;
};

export default {
  // Order Book
  placeOrder,
  cancelOrder,
  getOrderBook,
  getOrderExecutions,
  getBestBid,
  getBestAsk,
  getMarketDepth,
  getSpread,
  getTopOfBook,
  getMarketSnapshot,
  purgeStaleOrders,
  reopenOrder,
  cancelExpiredOrders,
  forceMatchNow,
  
  // Order Executions
  createOrderExecution,
  getAllOrderExecutions,
  getOrderExecutionById,
  updateOrderExecution,
  deleteOrderExecution,
  getExecutionsInRange,
  getExecutionVWAP,
  getLastTrade,
  aggregateExecutionsByOrder
};
