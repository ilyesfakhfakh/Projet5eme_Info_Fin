import httpMarket from './httpMarket';

const BASE_PATH = '/assets';

export const assetsApi = {
  create: (data) => httpMarket.post(BASE_PATH, data, { auth: false }),
  getAll: (params) => httpMarket.get(BASE_PATH, { params, auth: false }),
  getByType: (assetType) => httpMarket.get(`${BASE_PATH}/type/${assetType}`, { auth: false }),
  getById: (id) => httpMarket.get(`${BASE_PATH}/${id}`, { auth: false }),
  update: (id, data) => httpMarket.put(`${BASE_PATH}/${id}`, data, { auth: false }),
  delete: (id) => httpMarket.del(`${BASE_PATH}/${id}`, { auth: false }),
  deleteAll: () => httpMarket.del(BASE_PATH, { auth: false })
};

export default assetsApi;
