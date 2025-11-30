module.exports = app => {
  const realtimeQuotes = require('../../controllers/market/realtime-quote.controller.js');

  var router = require('express').Router();

  // Create a new RealTimeQuote
  router.post('/', realtimeQuotes.create);

  // Retrieve all RealTimeQuotes
  router.get('/', realtimeQuotes.findAll);

  // Retrieve all RealTimeQuotes for a specific asset
  router.get('/asset/:asset_id', realtimeQuotes.findByAsset);

  // Retrieve the latest RealTimeQuote for a specific asset
  router.get('/asset/:asset_id/latest', realtimeQuotes.findLatestByAsset);

  // Retrieve a single RealTimeQuote with id
  router.get('/:id', realtimeQuotes.findOne);

  // Update a RealTimeQuote with id
  router.put('/:id', realtimeQuotes.update);

  // Delete a RealTimeQuote with id
  router.delete('/:id', realtimeQuotes.delete);

  // Delete all RealTimeQuotes
  router.delete('/', realtimeQuotes.deleteAll);

  app.use('/api/realtime-quotes', router);
};