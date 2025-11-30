module.exports = app => {
  const assets = require('../../controllers/market/asset.controller.js');

  var router = require('express').Router();

  // Create a new Asset
  router.post('/', assets.create);

  // Retrieve all Assets
  router.get('/', assets.findAll);

  // Retrieve all active Assets
  router.get('/active', assets.findAllActive);

  // Retrieve assets by category
  router.get('/category/:category', assets.findByCategory);

  // Filter assets by sector
  router.get('/sector', assets.findBySector);

  // Retrieve a single Asset with id
  router.get('/:id', assets.findOne);

  // Update an Asset with id
  router.put('/:id', assets.update);

  // Delete an Asset with id
  router.delete('/:id', assets.delete);

  // Delete all Assets
  router.delete('/', assets.deleteAll);

  app.use('/api/assets', router);
};