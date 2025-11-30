module.exports = app => {
  const economicEvents = require('../../controllers/news/economic-event.controller.js');

  var router = require('express').Router();

  // Create a new EconomicEvent
  router.post('/', economicEvents.create);

  // Retrieve all EconomicEvents
  router.get('/', economicEvents.findAll);

  // Retrieve all upcoming EconomicEvents
  router.get('/upcoming', economicEvents.findUpcoming);

  // Retrieve all EconomicEvents by importance
  router.get('/importance/:importance', economicEvents.findByImportance);

  // Retrieve a single EconomicEvent with id
  router.get('/:id', economicEvents.findOne);

  // Update an EconomicEvent with id
  router.put('/:id', economicEvents.update);

  // Delete an EconomicEvent with id
  router.delete('/:id', economicEvents.delete);

  // Delete all EconomicEvents
  router.delete('/', economicEvents.deleteAll);

  app.use('/api/economic-events', router);
};