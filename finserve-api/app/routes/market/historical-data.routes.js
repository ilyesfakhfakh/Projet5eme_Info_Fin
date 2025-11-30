// ========================================
// MODULE 3: Financial Assets and Market Data
// Routes: HistoricalData
// Description: API endpoints for historical data management
// ========================================

module.exports = app => {
  const historicalData = require('../../controllers/market/historical-data.controller.js');

  var router = require('express').Router();

  // Create new Historical Data
  router.post('/', historicalData.create);

  // Bulk create/update historical data
  router.post('/bulk', historicalData.bulkCreate);

  // Retrieve all Historical Data (optional query: ?asset_id=xxx)
  router.get('/', historicalData.findAll);

  // Retrieve historical data by date range
  router.get('/date-range', historicalData.findByDateRange);

  // Retrieve historical data for a specific asset
  router.get('/asset/:assetId', historicalData.findByAsset);

  // Retrieve latest historical data for an asset
  router.get('/asset/:assetId/latest', historicalData.findLatest);

  // Retrieve a single Historical Data entry by id
  router.get('/:id', historicalData.findOne);

  // Update Historical Data by id
  router.put('/:id', historicalData.update);

  // Delete Historical Data by id
  router.delete('/:id', historicalData.delete);

  // Delete all Historical Data
  router.delete('/', historicalData.deleteAll);

  app.use('/api/historical-data', router);
};
