import { http } from './http';

/**
 * Order Executions API Service
 * Provides methods to interact with the order executions backend endpoints
 */

// Create a new order execution
export const createOrderExecution = async (executionData) => {
  const response = await http.post('/order-executions', executionData);
  return response;
};

// Get all order executions (optional filter by order_id)
export const getAllOrderExecutions = async (filters = {}) => {
  const response = await http.get('/order-executions', { params: filters });
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

// Get executions in range for an asset
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

// Get last trade for an asset
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
