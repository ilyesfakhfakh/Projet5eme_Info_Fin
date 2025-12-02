const express = require('express');
const router = express.Router();
const botBuilderController = require('../controllers/bot-builder.controller');

// Bot CRUD
router.post('/', botBuilderController.createBot);
router.get('/', botBuilderController.getBots);
router.get('/:botId', botBuilderController.getBot);
router.put('/:botId', botBuilderController.updateBot);
router.delete('/:botId', botBuilderController.deleteBot);

// Bot Control
router.post('/:botId/start', botBuilderController.startBot);
router.post('/:botId/stop', botBuilderController.stopBot);

// Executions
router.get('/:botId/executions', botBuilderController.getBotExecutions);

// Backtesting
router.post('/:botId/backtest', botBuilderController.runBacktest);
router.get('/:botId/backtests', botBuilderController.getBacktests);

// Individual backtest
router.get('/backtests/:backtestId', botBuilderController.getBacktest);

module.exports = router;
