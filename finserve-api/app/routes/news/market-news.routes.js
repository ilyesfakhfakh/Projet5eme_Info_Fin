module.exports = app => {
  const marketNews = require('../../controllers/news/market-news.controller.js');

  var router = require('express').Router();

  // Create a new MarketNews
  router.post('/', marketNews.create);

  // Retrieve all MarketNews
  router.get('/', marketNews.findAll);

  // Retrieve latest MarketNews
  router.get('/latest', marketNews.findLatest);

  // Retrieve all MarketNews by priority
  router.get('/priority/:priority', marketNews.findByPriority);

  // Retrieve a single MarketNews with id
  router.get('/:id', marketNews.findOne);

  // Update a MarketNews with id
  router.put('/:id', marketNews.update);

  // Delete a MarketNews with id
  router.delete('/:id', marketNews.delete);

  // Delete all MarketNews
  router.delete('/', marketNews.deleteAll);

  app.use('/api/market-news', router);
};