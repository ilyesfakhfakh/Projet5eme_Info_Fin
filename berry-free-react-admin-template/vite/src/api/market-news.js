import httpMarket from './httpMarket';

const BASE_PATH = '/market-news';

export const marketNewsApi = {
  create: (data) => httpMarket.post(BASE_PATH, data, { auth: false }),
  getAll: (params) => httpMarket.get(BASE_PATH, { params, auth: false }),
  getLatest: () => httpMarket.get(`${BASE_PATH}/latest`, { auth: false }),
  getByPriority: (priority) => httpMarket.get(`${BASE_PATH}/priority/${priority}`, { auth: false }),
  getById: (id) => httpMarket.get(`${BASE_PATH}/${id}`, { auth: false }),
  update: (id, data) => httpMarket.put(`${BASE_PATH}/${id}`, data, { auth: false }),
  delete: (id) => httpMarket.del(`${BASE_PATH}/${id}`, { auth: false }),
  deleteAll: () => httpMarket.del(BASE_PATH, { auth: false })
};

export default marketNewsApi;
