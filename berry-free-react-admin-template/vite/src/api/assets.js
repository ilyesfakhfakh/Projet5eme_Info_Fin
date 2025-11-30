import { http } from './http';

/**
 * Assets API Service
 */

// Get all assets
export const getAssets = async (filters = {}) => {
  const response = await http.get('/assets', { params: filters });
  return response;
};

// Get asset by ID
export const getAssetById = async (assetId) => {
  const response = await http.get(`/assets/${assetId}`);
  return response;
};

export default {
  getAssets,
  getAssetById
};
