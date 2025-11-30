import httpMarket from './httpMarket';

const BASE_PATH = '/historical-data';

export const historicalDataApi = {
  create: (data) => httpMarket.post(BASE_PATH, data, { auth: false }),
  bulkCreate: (data) => httpMarket.post(`${BASE_PATH}/bulk`, data, { auth: false }),
  getAll: (params) => httpMarket.get(BASE_PATH, { params, auth: false }),
  getByDateRange: (params) => httpMarket.get(`${BASE_PATH}/date-range`, { params, auth: false }),
  getByAsset: (assetId) => httpMarket.get(`${BASE_PATH}/asset/${assetId}`, { auth: false }),
  getLatest: (assetId) => httpMarket.get(`${BASE_PATH}/asset/${assetId}/latest`, { auth: false }),
  getById: (id) => httpMarket.get(`${BASE_PATH}/${id}`, { auth: false }),
  update: (id, data) => httpMarket.put(`${BASE_PATH}/${id}`, data, { auth: false }),
  delete: (id) => httpMarket.del(`${BASE_PATH}/${id}`, { auth: false }),
  deleteAll: () => httpMarket.del(BASE_PATH, { auth: false })
};

export default historicalDataApi;
