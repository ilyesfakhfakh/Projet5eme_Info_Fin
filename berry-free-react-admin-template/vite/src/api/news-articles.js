import httpMarket from './httpMarket';

const BASE_PATH = '/news-articles';

export const newsArticlesApi = {
  create: (data) => httpMarket.post(BASE_PATH, data, { auth: false }),
  getAll: (params) => httpMarket.get(BASE_PATH, { params, auth: false }),
  getLatest: () => httpMarket.get(`${BASE_PATH}/latest`, { auth: false }),
  getByCategory: (category) => httpMarket.get(`${BASE_PATH}/category/${category}`, { auth: false }),
  getByAsset: (assetId) => httpMarket.get(`${BASE_PATH}/asset/${assetId}`, { auth: false }),
  getByTag: (tag) => httpMarket.get(`${BASE_PATH}/tag/${tag}`, { auth: false }),
  getAllTags: () => httpMarket.get(`${BASE_PATH}/tags/all`, { auth: false }),
  getById: (id) => httpMarket.get(`${BASE_PATH}/${id}`, { auth: false }),
  update: (id, data) => httpMarket.put(`${BASE_PATH}/${id}`, data, { auth: false }),
  delete: (id) => httpMarket.del(`${BASE_PATH}/${id}`, { auth: false }),
  deleteAll: () => httpMarket.del(BASE_PATH, { auth: false })
};

export default newsArticlesApi;
