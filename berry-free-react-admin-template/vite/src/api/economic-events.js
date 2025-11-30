import httpMarket from './httpMarket';

const BASE_PATH = '/economic-events';

export const economicEventsApi = {
  create: (data) => httpMarket.post(BASE_PATH, data, { auth: false }),
  getAll: (params) => httpMarket.get(BASE_PATH, { params, auth: false }),
  getUpcoming: () => httpMarket.get(`${BASE_PATH}/upcoming`, { auth: false }),
  getByImportance: (importance) => httpMarket.get(`${BASE_PATH}/importance/${importance}`, { auth: false }),
  getById: (id) => httpMarket.get(`${BASE_PATH}/${id}`, { auth: false }),
  update: (id, data) => httpMarket.put(`${BASE_PATH}/${id}`, data, { auth: false }),
  delete: (id) => httpMarket.del(`${BASE_PATH}/${id}`, { auth: false }),
  deleteAll: () => httpMarket.del(BASE_PATH, { auth: false })
};

export default economicEventsApi;
