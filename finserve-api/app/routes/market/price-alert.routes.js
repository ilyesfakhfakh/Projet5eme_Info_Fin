// ========================================
// Price Alert Routes
// Description: API endpoints for price alerts
// ========================================

module.exports = app => {
  const priceAlerts = require('../../controllers/market/price-alert.controller.js');
  var router = require('express').Router();

  // Create a new Price Alert
  router.post('/', priceAlerts.create);

  // Retrieve all Price Alerts
  router.get('/', priceAlerts.findAll);

  // Retrieve a single Price Alert by id
  router.get('/:id', priceAlerts.findOne);

  // Update a Price Alert by id
  router.put('/:id', priceAlerts.update);

  // Delete a Price Alert by id
  router.delete('/:id', priceAlerts.delete);

  // Delete all Price Alerts
  router.delete('/', priceAlerts.deleteAll);

  app.use('/api/price-alerts', router);
};
