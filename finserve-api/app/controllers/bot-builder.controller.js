const BotBuilderService = require('../services/bot-builder.service');
const BacktestingService = require('../services/backtesting.service');
const db = require('../models');

const botBuilderService = new BotBuilderService(db);
const backtestingService = new BacktestingService(db, botBuilderService);

/**
 * Créer un nouveau bot
 * POST /api/v1/bots
 */
const createBot = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId || 'demo-user';
    const botData = req.body;

    const bot = await botBuilderService.createBot(userId, botData);

    res.status(201).json({
      success: true,
      bot: bot
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Récupérer tous les bots d'un user
 * GET /api/v1/bots
 */
const getBots = async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId || 'demo-user';
    const filters = {
      status: req.query.status,
      category: req.query.category,
      limit: parseInt(req.query.limit) || 50
    };

    const bots = await botBuilderService.getUserBots(userId, filters);

    res.json({
      success: true,
      count: bots.length,
      bots: bots
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Récupérer un bot spécifique
 * GET /api/v1/bots/:botId
 */
const getBot = async (req, res) => {
  try {
    const { botId } = req.params;
    const userId = req.user?.id || req.query.userId || 'demo-user';

    const bot = await botBuilderService.getBot(botId, userId);

    res.json({
      success: true,
      bot: bot
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Mettre à jour un bot
 * PUT /api/v1/bots/:botId
 */
const updateBot = async (req, res) => {
  try {
    const { botId } = req.params;
    const userId = req.user?.id || req.body.userId || 'demo-user';
    const updates = req.body;

    const bot = await botBuilderService.updateBot(botId, userId, updates);

    res.json({
      success: true,
      bot: bot
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Supprimer un bot
 * DELETE /api/v1/bots/:botId
 */
const deleteBot = async (req, res) => {
  try {
    const { botId } = req.params;
    const userId = req.user?.id || req.body.userId || 'demo-user';

    await botBuilderService.deleteBot(botId, userId);

    res.json({
      success: true,
      message: 'Bot deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Démarrer un bot
 * POST /api/v1/bots/:botId/start
 */
const startBot = async (req, res) => {
  try {
    const { botId } = req.params;
    const userId = req.user?.id || req.body.userId || 'demo-user';

    const bot = await botBuilderService.startBot(botId, userId);

    res.json({
      success: true,
      bot: bot,
      message: 'Bot started successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Arrêter un bot
 * POST /api/v1/bots/:botId/stop
 */
const stopBot = async (req, res) => {
  try {
    const { botId } = req.params;
    const userId = req.user?.id || req.body.userId || 'demo-user';

    const bot = await botBuilderService.stopBot(botId, userId);

    res.json({
      success: true,
      bot: bot,
      message: 'Bot stopped successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Récupérer les exécutions d'un bot
 * GET /api/v1/bots/:botId/executions
 */
const getBotExecutions = async (req, res) => {
  try {
    const { botId } = req.params;
    const userId = req.user?.id || req.query.userId || 'demo-user';
    const limit = parseInt(req.query.limit) || 100;

    const executions = await botBuilderService.getBotExecutions(botId, userId, limit);

    res.json({
      success: true,
      count: executions.length,
      executions: executions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Lancer un backtest
 * POST /api/v1/bots/:botId/backtest
 */
const runBacktest = async (req, res) => {
  try {
    const { botId } = req.params;
    const userId = req.user?.id || req.body.userId || 'demo-user';
    const config = {
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      initialCapital: parseFloat(req.body.initialCapital) || 10000,
      asset: req.body.asset || 'BTC'
    };

    const backtest = await backtestingService.runBacktest(botId, userId, config);

    res.json({
      success: true,
      backtest: backtest
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Récupérer les résultats de backtest
 * GET /api/v1/bots/:botId/backtests
 */
const getBacktests = async (req, res) => {
  try {
    const { botId } = req.params;
    const userId = req.user?.id || req.query.userId || 'demo-user';
    const limit = parseInt(req.query.limit) || 10;

    const backtests = await backtestingService.getBacktestResults(botId, userId, limit);

    res.json({
      success: true,
      count: backtests.length,
      backtests: backtests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Récupérer un backtest spécifique
 * GET /api/v1/backtests/:backtestId
 */
const getBacktest = async (req, res) => {
  try {
    const { backtestId } = req.params;
    const userId = req.user?.id || req.query.userId || 'demo-user';

    const backtest = await backtestingService.getBacktest(backtestId, userId);

    res.json({
      success: true,
      backtest: backtest
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  createBot,
  getBots,
  getBot,
  updateBot,
  deleteBot,
  startBot,
  stopBot,
  getBotExecutions,
  runBacktest,
  getBacktests,
  getBacktest
};
