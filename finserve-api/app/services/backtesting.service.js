const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

class BacktestingService {
  constructor(models, botBuilderService) {
    this.models = models;
    this.botBuilderService = botBuilderService;
  }

  /**
   * Lancer un backtest
   */
  async runBacktest(botId, userId, backtestConfig) {
    try {
      const { startDate, endDate, initialCapital, asset } = backtestConfig;

      // Récupérer le bot
      const bot = await this.botBuilderService.getBot(botId, userId);
      
      // Valider la config du bot
      this.botBuilderService.validateBotConfig(bot.config);

      // Récupérer les données historiques
      const historicalData = await this.getHistoricalData(
        asset,
        new Date(startDate),
        new Date(endDate)
      );

      if (historicalData.length === 0) {
        throw new Error('No historical data found for this period');
      }

      // Simuler les trades
      const simulation = await this.simulateTrades(
        bot,
        historicalData,
        initialCapital
      );

      // Calculer les métriques
      const metrics = this.calculateMetrics(simulation, initialCapital);

      // Sauvegarder les résultats
      const backtest = await this.models.backtest_results.create({
        backtest_id: uuidv4(),
        bot_id: botId,
        user_id: userId,
        start_date: startDate,
        end_date: endDate,
        initial_capital: initialCapital,
        final_capital: metrics.finalCapital,
        total_trades: metrics.totalTrades,
        winning_trades: metrics.winningTrades,
        losing_trades: metrics.losingTrades,
        win_rate: metrics.winRate,
        total_profit: metrics.totalProfit,
        total_loss: metrics.totalLoss,
        net_profit: metrics.netProfit,
        roi: metrics.roi,
        max_drawdown: metrics.maxDrawdown,
        sharpe_ratio: metrics.sharpeRatio,
        trades_data: simulation.trades,
        equity_curve: simulation.equityCurve
      });

      console.log(`[Backtesting] Completed for bot ${botId}: ${metrics.totalTrades} trades, ROI: ${metrics.roi}%`);
      
      return backtest;
    } catch (error) {
      throw new Error(`Error running backtest: ${error.message}`);
    }
  }

  /**
   * Récupérer les données historiques
   */
  async getHistoricalData(asset, startDate, endDate) {
    try {
      // Pour la démo, on génère des données aléatoires
      // Dans un vrai système, on appellerait une API (Binance, CoinGecko, etc.)
      const data = [];
      const currentDate = new Date(startDate);
      let price = 100; // Prix de départ

      while (currentDate <= endDate) {
        // Variation aléatoire du prix (-3% à +3%)
        const change = (Math.random() - 0.5) * 6;
        price = price * (1 + change / 100);

        // Générer RSI et MACD simulés
        const rsi = 30 + Math.random() * 40; // Entre 30 et 70
        const macd = (Math.random() - 0.5) * 2; // Entre -1 et 1

        data.push({
          date: new Date(currentDate),
          symbol: asset,
          price: parseFloat(price.toFixed(2)),
          volume: Math.floor(Math.random() * 1000000),
          rsi: parseFloat(rsi.toFixed(2)),
          macd: parseFloat(macd.toFixed(2)),
          high: parseFloat((price * 1.02).toFixed(2)),
          low: parseFloat((price * 0.98).toFixed(2))
        });

        // Avancer d'une heure
        currentDate.setHours(currentDate.getHours() + 1);
      }

      return data;
    } catch (error) {
      throw new Error(`Error fetching historical data: ${error.message}`);
    }
  }

  /**
   * Simuler les trades
   */
  async simulateTrades(bot, historicalData, initialCapital) {
    const trades = [];
    const equityCurve = [];
    let capital = initialCapital;
    let position = null; // { action: 'BUY', quantity, entryPrice, entryDate }

    for (let i = 0; i < historicalData.length; i++) {
      const marketData = historicalData[i];
      
      // Évaluer les triggers du bot
      const triggers = bot.config.nodes.filter(n => n.type === 'trigger');
      
      for (const trigger of triggers) {
        const shouldTrigger = this.botBuilderService.evaluateTrigger(trigger, marketData);
        
        if (shouldTrigger) {
          const actions = this.botBuilderService.findConnectedActions(trigger.id, bot.config);
          
          for (const action of actions) {
            const trade = await this.executeSimulatedTrade(
              action,
              marketData,
              capital,
              position,
              bot.settings
            );

            if (trade) {
              trades.push(trade);
              
              if (trade.type === 'BUY') {
                position = {
                  action: 'BUY',
                  quantity: trade.quantity,
                  entryPrice: trade.price,
                  entryDate: trade.date
                };
                capital -= trade.total;
              } else if (trade.type === 'SELL' && position) {
                // Calculer le profit/loss
                const profitLoss = (trade.price - position.entryPrice) * position.quantity;
                const profitLossPercent = ((trade.price - position.entryPrice) / position.entryPrice) * 100;
                
                trade.profit_loss = profitLoss;
                trade.profit_loss_percent = profitLossPercent;
                
                capital += trade.total;
                position = null;
              }
            }
          }
        }
      }

      // Enregistrer l'equity curve (tous les 24 points = 1 jour)
      if (i % 24 === 0) {
        equityCurve.push({
          date: marketData.date,
          capital: position 
            ? capital + (marketData.price * position.quantity)
            : capital
        });
      }
    }

    // Fermer la position ouverte si nécessaire
    if (position) {
      const lastData = historicalData[historicalData.length - 1];
      const closingValue = position.quantity * lastData.price;
      capital += closingValue;
    }

    return { trades, equityCurve, finalCapital: capital };
  }

  /**
   * Exécuter un trade simulé
   */
  async executeSimulatedTrade(action, marketData, capital, currentPosition, settings) {
    const { type, quantity: quantityPercent } = action.data;
    const maxInvestment = settings.maxInvestment || 1000;

    // BUY
    if (type === 'BUY' && !currentPosition) {
      const investmentAmount = Math.min(capital * (quantityPercent / 100), maxInvestment);
      const quantity = investmentAmount / marketData.price;

      return {
        type: 'BUY',
        date: marketData.date,
        symbol: marketData.symbol,
        price: marketData.price,
        quantity: quantity,
        total: investmentAmount,
        profit_loss: 0,
        profit_loss_percent: 0
      };
    }

    // SELL
    if (type === 'SELL' && currentPosition) {
      const sellValue = currentPosition.quantity * marketData.price;

      return {
        type: 'SELL',
        date: marketData.date,
        symbol: marketData.symbol,
        price: marketData.price,
        quantity: currentPosition.quantity,
        total: sellValue,
        profit_loss: 0, // Sera calculé après
        profit_loss_percent: 0
      };
    }

    return null;
  }

  /**
   * Calculer les métriques
   */
  calculateMetrics(simulation, initialCapital) {
    const { trades, finalCapital } = simulation;
    
    const totalTrades = trades.length;
    const winningTrades = trades.filter(t => t.profit_loss > 0).length;
    const losingTrades = trades.filter(t => t.profit_loss < 0).length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

    const totalProfit = trades
      .filter(t => t.profit_loss > 0)
      .reduce((sum, t) => sum + t.profit_loss, 0);
    
    const totalLoss = Math.abs(
      trades
        .filter(t => t.profit_loss < 0)
        .reduce((sum, t) => sum + t.profit_loss, 0)
    );

    const netProfit = totalProfit - totalLoss;
    const roi = ((finalCapital - initialCapital) / initialCapital) * 100;

    // Max Drawdown
    const equityCurve = simulation.equityCurve;
    let maxDrawdown = 0;
    let peak = initialCapital;

    for (const point of equityCurve) {
      if (point.capital > peak) {
        peak = point.capital;
      }
      const drawdown = ((peak - point.capital) / peak) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    // Sharpe Ratio (simplifié)
    const returns = [];
    for (let i = 1; i < equityCurve.length; i++) {
      const dailyReturn = ((equityCurve[i].capital - equityCurve[i - 1].capital) / equityCurve[i - 1].capital) * 100;
      returns.push(dailyReturn);
    }

    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const stdDev = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    );
    const sharpeRatio = stdDev !== 0 ? (avgReturn / stdDev) : 0;

    return {
      totalTrades,
      winningTrades,
      losingTrades,
      winRate: parseFloat(winRate.toFixed(2)),
      totalProfit: parseFloat(totalProfit.toFixed(2)),
      totalLoss: parseFloat(totalLoss.toFixed(2)),
      netProfit: parseFloat(netProfit.toFixed(2)),
      roi: parseFloat(roi.toFixed(2)),
      maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
      sharpeRatio: parseFloat(sharpeRatio.toFixed(4)),
      finalCapital: parseFloat(finalCapital.toFixed(2))
    };
  }

  /**
   * Récupérer les résultats de backtest
   */
  async getBacktestResults(botId, userId, limit = 10) {
    try {
      const results = await this.models.backtest_results.findAll({
        where: { bot_id: botId, user_id: userId },
        order: [['created_at', 'DESC']],
        limit
      });

      return results;
    } catch (error) {
      throw new Error(`Error fetching backtest results: ${error.message}`);
    }
  }

  /**
   * Récupérer un backtest spécifique
   */
  async getBacktest(backtestId, userId) {
    try {
      const backtest = await this.models.backtest_results.findOne({
        where: { backtest_id: backtestId, user_id: userId }
      });

      if (!backtest) {
        throw new Error('Backtest not found');
      }

      return backtest;
    } catch (error) {
      throw new Error(`Error fetching backtest: ${error.message}`);
    }
  }
}

module.exports = BacktestingService;
