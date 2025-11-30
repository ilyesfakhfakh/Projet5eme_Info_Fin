import httpMarket from './httpMarket';

const BASE_PATH = '/market-data';

export const marketDataApi = {
  create: (data) => httpMarket.post(BASE_PATH, data, { auth: false }),
  getAll: (params) => httpMarket.get(BASE_PATH, { params, auth: false }),
  getByAsset: (assetId) => httpMarket.get(`${BASE_PATH}/asset/${assetId}`, { auth: false }),
  getStatistics: (assetId) => httpMarket.get(`${BASE_PATH}/statistics/${assetId}`, { auth: false }),
  compareAssets: (assetIds) => httpMarket.post(`${BASE_PATH}/compare`, { assetIds }, { auth: false }),
  getById: (id) => httpMarket.get(`${BASE_PATH}/${id}`, { auth: false }),
  update: (id, data) => httpMarket.put(`${BASE_PATH}/${id}`, data, { auth: false }),
  delete: (id) => httpMarket.del(`${BASE_PATH}/${id}`, { auth: false }),
  deleteAll: () => httpMarket.del(BASE_PATH, { auth: false })
};

export default marketDataApi;
