module.exports = app => {
  const marketData = require('../../controllers/market/market-data.controller.js');

  var router = require('express').Router();

  // Create a new MarketData
  router.post('/', marketData.create);

  // Retrieve all MarketData
  router.get('/', marketData.findAll);

  // Retrieve all MarketData for a specific asset
  router.get('/asset/:asset_id', marketData.findByAsset);

  // Get market statistics for a specific asset
  router.get('/statistics/:asset_id', marketData.getStatistics);

  // Compare performances of multiple assets
  router.post('/compare', marketData.compareAssets);

  // Retrieve a single MarketData with id
  router.get('/:id', marketData.findOne);

  // Update a MarketData with id
  router.put('/:id', marketData.update);

  // Delete a MarketData with id
  router.delete('/:id', marketData.delete);

  // Delete all MarketData
  router.delete('/', marketData.deleteAll);

  app.use('/api/market-data', router);
};