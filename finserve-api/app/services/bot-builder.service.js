const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

class BotBuilderService {
  constructor(models) {
    this.models = models;
    this.activeBots = new Map(); // Bots en cours d'exécution
  }

  /**
   * Créer un nouveau bot
   */
  async createBot(userId, botData) {
    try {
      const bot = await this.models.trading_bots.create({
        bot_id: uuidv4(),
        user_id: userId,
        name: botData.name,
        description: botData.description || '',
        config: botData.config || { nodes: [], edges: [] },
        settings: botData.settings || {},
        category: botData.category || 'custom',
        risk_level: botData.risk_level || 'MEDIUM',
        status: 'DRAFT'
      });

      console.log(`[BotBuilder] New bot created: ${bot.bot_id} by ${userId}`);
      return bot;
    } catch (error) {
      throw new Error(`Error creating bot: ${error.message}`);
    }
  }

  /**
   * Mettre à jour un bot
   */
  async updateBot(botId, userId, updates) {
    try {
      const bot = await this.models.trading_bots.findOne({
        where: { bot_id: botId, user_id: userId }
      });

      if (!bot) {
        throw new Error('Bot not found or unauthorized');
      }

      await bot.update(updates);
      return bot;
    } catch (error) {
      throw new Error(`Error updating bot: ${error.message}`);
    }
  }

  /**
   * Démarrer un bot
   */
  async startBot(botId, userId) {
    try {
      const bot = await this.models.trading_bots.findOne({
        where: { bot_id: botId, user_id: userId }
      });

      if (!bot) {
        throw new Error('Bot not found or unauthorized');
      }

      if (bot.status === 'ACTIVE') {
        throw new Error('Bot is already running');
      }

      // Valider la configuration du bot
      this.validateBotConfig(bot.config);

      await bot.update({ status: 'ACTIVE' });
      
      // Ajouter aux bots actifs
      this.activeBots.set(botId, {
        userId,
        config: bot.config,
        settings: bot.settings,
        lastCheck: Date.now()
      });

      console.log(`[BotBuilder] Bot started: ${botId}`);
      return bot;
    } catch (error) {
      throw new Error(`Error starting bot: ${error.message}`);
    }
  }

  /**
   * Arrêter un bot
   */
  async stopBot(botId, userId) {
    try {
      const bot = await this.models.trading_bots.findOne({
        where: { bot_id: botId, user_id: userId }
      });

      if (!bot) {
        throw new Error('Bot not found or unauthorized');
      }

      await bot.update({ status: 'STOPPED' });
      this.activeBots.delete(botId);

      console.log(`[BotBuilder] Bot stopped: ${botId}`);
      return bot;
    } catch (error) {
      throw new Error(`Error stopping bot: ${error.message}`);
    }
  }

  /**
   * Valider la configuration d'un bot
   */
  validateBotConfig(config) {
    if (!config || !config.nodes || !config.edges) {
      throw new Error('Invalid bot configuration');
    }

    if (config.nodes.length === 0) {
      throw new Error('Bot must have at least one node');
    }

    // Vérifier qu'il y a au moins un trigger et une action
    const hasTrigger = config.nodes.some(n => n.type === 'trigger');
    const hasAction = config.nodes.some(n => n.type === 'action');

    if (!hasTrigger) {
      throw new Error('Bot must have at least one trigger');
    }

    if (!hasAction) {
      throw new Error('Bot must have at least one action');
    }

    return true;
  }

  /**
   * Évaluer les conditions d'un bot
   */
  async evaluateBot(botId, marketData) {
    try {
      const botInfo = this.activeBots.get(botId);
      if (!botInfo) {
        return null;
      }

      const { config, settings } = botInfo;
      const triggers = config.nodes.filter(n => n.type === 'trigger');
      
      // Évaluer chaque trigger
      for (const trigger of triggers) {
        const shouldTrigger = this.evaluateTrigger(trigger, marketData);
        
        if (shouldTrigger) {
          // Trouver les actions connectées
          const actions = this.findConnectedActions(trigger.id, config);
          
          // Exécuter les actions
          for (const action of actions) {
            await this.executeAction(botId, action, marketData, trigger.data.name);
          }
        }
      }
    } catch (error) {
      console.error(`[BotBuilder] Error evaluating bot ${botId}:`, error.message);
    }
  }

  /**
   * Évaluer un trigger
   */
  evaluateTrigger(trigger, marketData) {
    const { condition, value, operator } = trigger.data;
    
    let currentValue;
    switch (condition) {
      case 'price':
        currentValue = marketData.price;
        break;
      case 'volume':
        currentValue = marketData.volume;
        break;
      case 'rsi':
        currentValue = marketData.rsi;
        break;
      case 'macd':
        currentValue = marketData.macd;
        break;
      default:
        return false;
    }

    // Comparer selon l'opérateur
    switch (operator) {
      case '>':
        return currentValue > value;
      case '<':
        return currentValue < value;
      case '>=':
        return currentValue >= value;
      case '<=':
        return currentValue <= value;
      case '==':
        return currentValue == value;
      default:
        return false;
    }
  }

  /**
   * Trouver les actions connectées à un trigger
   */
  findConnectedActions(triggerId, config) {
    const connectedEdges = config.edges.filter(e => e.source === triggerId);
    const actionIds = connectedEdges.map(e => e.target);
    return config.nodes.filter(n => actionIds.includes(n.id));
  }

  /**
   * Exécuter une action
   */
  async executeAction(botId, action, marketData, triggerName) {
    try {
      const bot = await this.models.trading_bots.findByPk(botId);
      const { type, quantity, symbol } = action.data;

      // Créer l'exécution
      const execution = await this.models.bot_executions.create({
        execution_id: uuidv4(),
        bot_id: botId,
        user_id: bot.user_id,
        asset_symbol: symbol || marketData.symbol,
        action: type.toUpperCase(),
        quantity: quantity,
        price: marketData.price,
        total_value: quantity * marketData.price,
        trigger_rule: triggerName,
        market_conditions: {
          price: marketData.price,
          volume: marketData.volume,
          rsi: marketData.rsi,
          macd: marketData.macd
        }
      });

      // Mettre à jour les stats du bot
      await this.updateBotStats(botId);

      console.log(`[BotBuilder] Action executed: ${type} ${quantity} ${symbol} @ ${marketData.price}`);
      return execution;
    } catch (error) {
      console.error(`[BotBuilder] Error executing action:`, error.message);
      throw error;
    }
  }

  /**
   * Mettre à jour les stats d'un bot
   */
  async updateBotStats(botId) {
    try {
      const executions = await this.models.bot_executions.findAll({
        where: { bot_id: botId }
      });

      const totalTrades = executions.length;
      const totalProfit = executions
        .filter(e => e.profit_loss > 0)
        .reduce((sum, e) => sum + parseFloat(e.profit_loss), 0);
      const totalLoss = executions
        .filter(e => e.profit_loss < 0)
        .reduce((sum, e) => sum + Math.abs(parseFloat(e.profit_loss)), 0);
      
      const winningTrades = executions.filter(e => e.profit_loss > 0).length;
      const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
      const roi = totalLoss > 0 ? ((totalProfit - totalLoss) / totalLoss) * 100 : 0;

      await this.models.trading_bots.update({
        total_trades: totalTrades,
        win_rate: winRate,
        total_profit: totalProfit,
        total_loss: totalLoss,
        roi: roi
      }, {
        where: { bot_id: botId }
      });
    } catch (error) {
      console.error(`[BotBuilder] Error updating bot stats:`, error.message);
    }
  }

  /**
   * Récupérer les bots d'un utilisateur
   */
  async getUserBots(userId, filters = {}) {
    try {
      const where = { user_id: userId };
      
      if (filters.status) {
        where.status = filters.status;
      }
      
      if (filters.category) {
        where.category = filters.category;
      }

      const bots = await this.models.trading_bots.findAll({
        where,
        order: [['created_at', 'DESC']],
        limit: filters.limit || 50
      });

      return bots;
    } catch (error) {
      throw new Error(`Error fetching bots: ${error.message}`);
    }
  }

  /**
   * Récupérer un bot par ID
   */
  async getBot(botId, userId = null) {
    try {
      const where = { bot_id: botId };
      if (userId) {
        where.user_id = userId;
      }

      const bot = await this.models.trading_bots.findOne({ where });
      
      if (!bot) {
        throw new Error('Bot not found');
      }

      return bot;
    } catch (error) {
      throw new Error(`Error fetching bot: ${error.message}`);
    }
  }

  /**
   * Supprimer un bot
   */
  async deleteBot(botId, userId) {
    try {
      const bot = await this.models.trading_bots.findOne({
        where: { bot_id: botId, user_id: userId }
      });

      if (!bot) {
        throw new Error('Bot not found or unauthorized');
      }

      // Arrêter le bot s'il est actif
      if (this.activeBots.has(botId)) {
        this.activeBots.delete(botId);
      }

      await bot.destroy();
      console.log(`[BotBuilder] Bot deleted: ${botId}`);
      return true;
    } catch (error) {
      throw new Error(`Error deleting bot: ${error.message}`);
    }
  }

  /**
   * Récupérer l'historique d'exécution
   */
  async getBotExecutions(botId, userId, limit = 100) {
    try {
      const bot = await this.models.trading_bots.findOne({
        where: { bot_id: botId, user_id: userId }
      });

      if (!bot) {
        throw new Error('Bot not found or unauthorized');
      }

      const executions = await this.models.bot_executions.findAll({
        where: { bot_id: botId },
        order: [['executed_at', 'DESC']],
        limit
      });

      return executions;
    } catch (error) {
      throw new Error(`Error fetching executions: ${error.message}`);
    }
  }
}

module.exports = BotBuilderService;
