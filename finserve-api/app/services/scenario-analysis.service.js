const RiskCalculatorService = require('./risk-calculator.service');
const ScenarioAnalysis = require('../models/risk/scenario-analysis.model');

class ScenarioAnalysisService {
  /**
   * Perform comprehensive stress test analysis
   * @param {string} portfolioId - Portfolio ID
   * @param {Array} portfolioWeights - Current portfolio weights
   * @param {Array} stressScenarios - Array of stress scenarios
   * @returns {Object} Stress test results
   */
  static async performStressTest(portfolioId, portfolioWeights, stressScenarios) {
    try {
      const results = RiskCalculatorService.performStressTest(portfolioWeights, stressScenarios);

      // Save detailed results
      await ScenarioAnalysis.create({
        portfolio_id: portfolioId,
        scenario_type: 'STRESS_TEST',
        scenario_name: 'Comprehensive Stress Test',
        parameters: { portfolioWeights, stressScenarios },
        results: results,
        impact_var: results.worstCase ? results.worstCase.var : 0,
        impact_drawdown: results.worstCase ? results.worstCase.portfolioReturn : 0
      });

      return results;
    } catch (error) {
      console.error('Error performing stress test:', error);
      throw error;
    }
  }

  /**
   * Perform what-if analysis for portfolio changes
   * @param {string} portfolioId - Portfolio ID
   * @param {Object} changes - Portfolio changes to simulate
   * @param {Array} historicalReturns - Historical market returns
   * @returns {Object} What-if analysis results
   */
  static async performWhatIfAnalysis(portfolioId, changes, historicalReturns) {
    try {
      const baselineMetrics = this.calculateBaselineMetrics(historicalReturns);
      const modifiedMetrics = this.calculateModifiedMetrics(historicalReturns, changes);

      const results = {
        baseline: baselineMetrics,
        modified: modifiedMetrics,
        impact: {
          volatilityChange: modifiedMetrics.volatility - baselineMetrics.volatility,
          varChange: modifiedMetrics.valueAtRisk - baselineMetrics.valueAtRisk,
          sharpeChange: modifiedMetrics.sharpeRatio - baselineMetrics.sharpeRatio,
          drawdownChange: modifiedMetrics.maxDrawdown - baselineMetrics.maxDrawdown
        },
        recommendations: this.generateWhatIfRecommendations(changes, modifiedMetrics)
      };

      // Save analysis
      await ScenarioAnalysis.create({
        portfolio_id: portfolioId,
        scenario_type: 'WHAT_IF',
        scenario_name: `What-if: ${changes.description || 'Portfolio Changes'}`,
        parameters: { changes, historicalReturns: historicalReturns.length },
        results: results,
        impact_var: results.impact.varChange,
        impact_drawdown: results.impact.drawdownChange
      });

      return results;
    } catch (error) {
      console.error('Error performing what-if analysis:', error);
      throw error;
    }
  }

  /**
   * Perform backtesting of trading strategy
   * @param {string} portfolioId - Portfolio ID
   * @param {Object} strategy - Trading strategy parameters
   * @param {Array} historicalData - Historical market data
   * @returns {Object} Backtesting results
   */
  static async performBacktesting(portfolioId, strategy, historicalData) {
    try {
      const trades = this.simulateStrategyTrades(strategy, historicalData);
      const performance = this.calculateStrategyPerformance(trades, historicalData);

      const results = {
        strategy: strategy,
        totalTrades: trades.length,
        winningTrades: trades.filter(t => t.profit > 0).length,
        losingTrades: trades.filter(t => t.profit < 0).length,
        winRate: trades.filter(t => t.profit > 0).length / trades.length,
        totalReturn: performance.totalReturn,
        annualizedReturn: performance.annualizedReturn,
        maxDrawdown: performance.maxDrawdown,
        sharpeRatio: performance.sharpeRatio,
        volatility: performance.volatility,
        trades: trades.slice(0, 100) // Limit stored trades
      };

      // Save analysis
      await ScenarioAnalysis.create({
        portfolio_id: portfolioId,
        scenario_type: 'BACKTESTING',
        scenario_name: `Backtest: ${strategy.name || 'Strategy'}`,
        parameters: { strategy, dataPoints: historicalData.length },
        results: results,
        impact_var: performance.volatility,
        impact_drawdown: performance.maxDrawdown
      });

      return results;
    } catch (error) {
      console.error('Error performing backtesting:', error);
      throw error;
    }
  }

  /**
   * Generate predefined stress scenarios
   * @returns {Array} Array of stress scenarios
   */
  static generateStressScenarios() {
    return [
      {
        name: 'Market Crash (-30%)',
        returns: [-0.3, -0.25, -0.2, -0.15, -0.1] // Different asset class returns
      },
      {
        name: 'Tech Bubble Burst',
        returns: [-0.4, -0.35, -0.1, -0.05, 0.1]
      },
      {
        name: 'Interest Rate Shock',
        returns: [-0.15, -0.1, 0.05, 0.1, 0.15]
      },
      {
        name: 'Geopolitical Crisis',
        returns: [-0.2, -0.15, -0.1, -0.05, 0.05]
      },
      {
        name: 'Inflation Surge',
        returns: [-0.1, 0.05, 0.1, 0.15, 0.2]
      },
      {
        name: 'Recovery Scenario',
        returns: [0.1, 0.15, 0.2, 0.25, 0.3]
      }
    ];
  }

  /**
   * Calculate baseline portfolio metrics
   * @param {Array} historicalReturns - Historical returns data
   * @returns {Object} Baseline metrics
   */
  static calculateBaselineMetrics(historicalReturns) {
    return {
      volatility: RiskCalculatorService.calculateVolatility(historicalReturns),
      valueAtRisk: RiskCalculatorService.calculateVaR(historicalReturns, 0.95),
      sharpeRatio: RiskCalculatorService.calculateSharpeRatio(historicalReturns),
      maxDrawdown: this.calculateMaxDrawdownFromReturns(historicalReturns)
    };
  }

  /**
   * Calculate modified portfolio metrics after changes
   * @param {Array} historicalReturns - Historical returns
   * @param {Object} changes - Portfolio changes
   * @returns {Object} Modified metrics
   */
  static calculateModifiedMetrics(historicalReturns, changes) {
    // Apply changes to returns (simplified simulation)
    let modifiedReturns = [...historicalReturns];

    if (changes.rebalance) {
      // Simulate rebalancing impact
      modifiedReturns = modifiedReturns.map(r => r * (1 + changes.rebalance.impact));
    }

    if (changes.addAssets) {
      // Simulate adding new assets
      const newAssetImpact = changes.addAssets.reduce((sum, asset) => sum + asset.expectedReturn * asset.weight, 0);
      modifiedReturns = modifiedReturns.map(r => r * (1 - changes.addAssets.reduce((sum, asset) => sum + asset.weight, 0)) + newAssetImpact);
    }

    if (changes.reduceRisk) {
      // Simulate risk reduction (e.g., adding cash)
      modifiedReturns = modifiedReturns.map(r => r * (1 - changes.reduceRisk.cashWeight) + changes.reduceRisk.cashWeight * 0.001);
    }

    return {
      volatility: RiskCalculatorService.calculateVolatility(modifiedReturns),
      valueAtRisk: RiskCalculatorService.calculateVaR(modifiedReturns, 0.95),
      sharpeRatio: RiskCalculatorService.calculateSharpeRatio(modifiedReturns),
      maxDrawdown: this.calculateMaxDrawdownFromReturns(modifiedReturns)
    };
  }

  /**
   * Calculate max drawdown from returns array
   * @param {Array} returns - Returns array
   * @returns {number} Max drawdown
   */
  static calculateMaxDrawdownFromReturns(returns) {
    // Convert returns to portfolio values
    let portfolioValue = 1000; // Starting value
    const portfolioValues = [portfolioValue];

    returns.forEach(returnVal => {
      portfolioValue *= (1 + returnVal);
      portfolioValues.push(portfolioValue);
    });

    return RiskCalculatorService.calculateMaxDrawdown(portfolioValues);
  }

  /**
   * Simulate trades based on strategy
   * @param {Object} strategy - Strategy parameters
   * @param {Array} historicalData - Historical price data
   * @returns {Array} Simulated trades
   */
  static simulateStrategyTrades(strategy, historicalData) {
    const trades = [];
    let position = 0;
    let entryPrice = 0;

    for (let i = strategy.lookback || 20; i < historicalData.length; i++) {
      const currentPrice = historicalData[i].price;
      const signal = this.generateStrategySignal(strategy, historicalData.slice(i - (strategy.lookback || 20), i + 1));

      if (signal === 'BUY' && position === 0) {
        position = 1;
        entryPrice = currentPrice;
        trades.push({
          type: 'BUY',
          price: currentPrice,
          date: historicalData[i].date,
          signal: signal
        });
      } else if (signal === 'SELL' && position === 1) {
        position = 0;
        const profit = currentPrice - entryPrice;
        trades.push({
          type: 'SELL',
          price: currentPrice,
          date: historicalData[i].date,
          profit: profit,
          profitPercent: (profit / entryPrice) * 100,
          signal: signal
        });
      }
    }

    return trades;
  }

  /**
   * Generate trading signal based on strategy
   * @param {Object} strategy - Strategy parameters
   * @param {Array} data - Historical data window
   * @returns {string} Trading signal
   */
  static generateStrategySignal(strategy, data) {
    switch (strategy.type) {
      case 'MOVING_AVERAGE_CROSSOVER':
        return this.movingAverageCrossoverSignal(data, strategy.fastPeriod || 5, strategy.slowPeriod || 20);

      case 'RSI':
        return this.rsiSignal(data, strategy.overbought || 70, strategy.oversold || 30);

      case 'BOLLINGER_BANDS':
        return this.bollingerBandsSignal(data, strategy.multiplier || 2);

      default:
        return 'HOLD';
    }
  }

  /**
   * Generate moving average crossover signal
   * @param {Array} data - Price data
   * @param {number} fastPeriod - Fast MA period
   * @param {number} slowPeriod - Slow MA period
   * @returns {string} Signal
   */
  static movingAverageCrossoverSignal(data, fastPeriod, slowPeriod) {
    const prices = data.map(d => d.price);
    const fastMA = this.calculateSMA(prices, fastPeriod);
    const slowMA = this.calculateSMA(prices, slowPeriod);

    if (fastMA > slowMA && prices[prices.length - 2] <= this.calculateSMA(prices.slice(0, -1), slowPeriod)) {
      return 'BUY';
    } else if (fastMA < slowMA && prices[prices.length - 2] >= this.calculateSMA(prices.slice(0, -1), slowPeriod)) {
      return 'SELL';
    }

    return 'HOLD';
  }

  /**
   * Generate RSI signal
   * @param {Array} data - Price data
   * @param {number} overbought - Overbought level
   * @param {number} oversold - Oversold level
   * @returns {string} Signal
   */
  static rsiSignal(data, overbought, oversold) {
    const prices = data.map(d => d.price);
    const rsi = this.calculateRSI(prices, 14);

    if (rsi < oversold) return 'BUY';
    if (rsi > overbought) return 'SELL';
    return 'HOLD';
  }

  /**
   * Generate Bollinger Bands signal
   * @param {Array} data - Price data
   * @param {number} multiplier - Standard deviation multiplier
   * @returns {string} Signal
   */
  static bollingerBandsSignal(data, multiplier) {
    const prices = data.map(d => d.price);
    const sma = this.calculateSMA(prices, 20);
    const std = this.calculateStd(prices, 20);
    const upperBand = sma + (std * multiplier);
    const lowerBand = sma - (std * multiplier);
    const currentPrice = prices[prices.length - 1];

    if (currentPrice < lowerBand) return 'BUY';
    if (currentPrice > upperBand) return 'SELL';
    return 'HOLD';
  }

  /**
   * Calculate Simple Moving Average
   * @param {Array} data - Data array
   * @param {number} period - Period
   * @returns {number} SMA value
   */
  static calculateSMA(data, period) {
    if (data.length < period) return data[data.length - 1];
    const sum = data.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
  }

  /**
   * Calculate RSI
   * @param {Array} prices - Price array
   * @param {number} period - Period
   * @returns {number} RSI value
   */
  static calculateRSI(prices, period) {
    let gains = 0;
    let losses = 0;

    for (let i = 1; i < Math.min(prices.length, period + 1); i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }

    if (losses === 0) return 100;
    const rs = gains / losses;
    return 100 - (100 / (1 + rs));
  }

  /**
   * Calculate Standard Deviation
   * @param {Array} data - Data array
   * @param {number} period - Period
   * @returns {number} Standard deviation
   */
  static calculateStd(data, period) {
    const slice = data.slice(-period);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
    return Math.sqrt(variance);
  }

  /**
   * Calculate strategy performance metrics
   * @param {Array} trades - Array of trades
   * @param {Array} historicalData - Historical data
   * @returns {Object} Performance metrics
   */
  static calculateStrategyPerformance(trades, historicalData) {
    const profits = trades.filter(t => t.profit).map(t => t.profit);
    const totalReturn = profits.reduce((sum, profit) => sum + profit, 0);
    const returns = profits.map(p => p / 1000); // Assuming $1000 per trade

    return {
      totalReturn: totalReturn,
      annualizedReturn: totalReturn / (historicalData.length / 252), // Assuming daily data
      maxDrawdown: RiskCalculatorService.calculateMaxDrawdown(this.calculateEquityCurve(trades)),
      sharpeRatio: RiskCalculatorService.calculateSharpeRatio(returns),
      volatility: RiskCalculatorService.calculateVolatility(returns)
    };
  }

  /**
   * Calculate equity curve from trades
   * @param {Array} trades - Array of trades
   * @returns {Array} Equity values
   */
  static calculateEquityCurve(trades) {
    let equity = 100000; // Starting capital
    const equityCurve = [equity];

    trades.forEach(trade => {
      if (trade.profit) {
        equity += trade.profit;
      }
      equityCurve.push(equity);
    });

    return equityCurve;
  }

  /**
   * Generate recommendations based on what-if analysis
   * @param {Object} changes - Portfolio changes
   * @param {Object} metrics - Modified metrics
   * @returns {string} Recommendations
   */
  static generateWhatIfRecommendations(changes, metrics) {
    const recommendations = [];

    if (changes.rebalance && metrics.volatility < 0.2) {
      recommendations.push('Rebalancing reduces portfolio volatility significantly.');
    }

    if (changes.addAssets && metrics.sharpeRatio > 0.8) {
      recommendations.push('Adding these assets improves risk-adjusted returns.');
    }

    if (changes.reduceRisk && metrics.maxDrawdown < 0.1) {
      recommendations.push('Risk reduction strategy effectively limits downside potential.');
    }

    return recommendations.join(' ');
  }
}

module.exports = ScenarioAnalysisService;