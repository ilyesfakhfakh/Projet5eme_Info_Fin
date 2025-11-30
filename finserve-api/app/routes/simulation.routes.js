const express = require('express');
const router = express.Router();
const simulationController = require('../controllers/simulation.controller');
const timeManagerController = require('../controllers/time-manager.controller');
const dataGeneratorController = require('../controllers/data-generator.controller');
const dataImportController = require('../controllers/data-import.controller');

// Simulation control routes
router.get('/state', simulationController.getState);
router.post('/start', simulationController.start);
router.post('/pause', simulationController.pause);
router.post('/resume', simulationController.resume);
router.post('/stop', simulationController.stop);
router.post('/reset', simulationController.reset);

// Time management routes
router.post('/speed', simulationController.setSpeed);
router.post('/jump-to-date', simulationController.jumpToDate);
router.post('/advance-time', timeManagerController.advanceTime);
router.get('/current-time', timeManagerController.getCurrentTime);

// Data generation routes
router.post('/assets/initialize', simulationController.initializeAsset);
router.get('/assets/:asset/price', simulationController.getCurrentPrice);
router.get('/assets/:asset/history', simulationController.getPriceHistory);
router.post('/assets/:asset/generate-price', dataGeneratorController.generateNextPrice);
router.post('/assets/:asset/generate-ohlcv', dataGeneratorController.generateOHLCV);
router.post('/assets/generate-correlated', dataGeneratorController.generateCorrelatedPrices);
router.post('/assets/generate-historical', dataGeneratorController.generateHistoricalData);
router.get('/assets', dataGeneratorController.getAssets);
router.put('/assets/:asset/parameters', dataGeneratorController.updateParameters);
router.delete('/assets/:asset', dataGeneratorController.resetAsset);
router.get('/assets/:asset/parameters', dataGeneratorController.getParameters);
router.post('/assets/:asset/generate-ticks', dataGeneratorController.generateTicks);

// Data import routes
router.post('/import/csv', simulationController.importCSV);
router.post('/import/yahoo-finance', simulationController.importYahooFinance);
router.post('/import/alpha-vantage', simulationController.importAlphaVantage);
router.get('/imported-data/:asset', simulationController.getImportedData);
router.get('/validate/:asset', simulationController.validateData);
router.get('/imported-data/:asset/next', dataImportController.getNextDataPoint);
router.get('/imported-assets', dataImportController.getImportedAssets);
router.delete('/imported-data/:asset', dataImportController.clearData);
router.post('/export/csv', dataImportController.exportToCSV);
router.get('/data-stats/:asset', dataImportController.getDataStats);
router.post('/import/bulk', dataImportController.bulkImport);
router.get('/supported-assets', dataImportController.getSupportedAssets);

// Snapshot routes
router.post('/snapshot/save', simulationController.saveSnapshot);
router.post('/snapshot/load', simulationController.loadSnapshot);

// Metrics and events
router.get('/metrics', simulationController.getMetrics);
router.post('/schedule-event', simulationController.scheduleEvent);

module.exports = router;