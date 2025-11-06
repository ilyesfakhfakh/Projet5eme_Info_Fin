const math = require('mathjs');

class RiskCalculatorService {
  /**
   * Calculate Value at Risk (VaR) using historical simulation
   * @param {Array} returns - Array of historical returns
   * @param {number} confidenceLevel - Confidence level (e.g., 0.95 for 95%)
   * @returns {number} VaR value
   */
  static calculateVaR(returns, confidenceLevel = 0.95) {
    if (!returns || returns.length === 0) return 0;

    const sortedReturns = returns.sort((a, b) => a - b);
    const index = Math.floor((1 - confidenceLevel) * sortedReturns.length);
    return -sortedReturns[index]; // Negative because we want the loss
  }

  /**
   * Calculate Sharpe Ratio
   * @param {Array} returns - Array of returns
   * @param {number} riskFreeRate - Risk-free rate (annualized)
   * @returns {number} Sharpe ratio
   */
  static calculateSharpeRatio(returns, riskFreeRate = 0.02) {
    if (!returns || returns.length === 0) return 0;

    const avgReturn = math.mean(returns);
    const volatility = math.std(returns);

    if (volatility === 0) return 0;

    return (avgReturn - riskFreeRate) / volatility;
  }

  /**
   * Calculate portfolio volatility
   * @param {Array} returns - Array of returns
   * @returns {number} Volatility (standard deviation)
   */
  static calculateVolatility(returns) {
    if (!returns || returns.length === 0) return 0;
    return math.std(returns);
  }

  /**
   * Calculate maximum drawdown
   * @param {Array} portfolioValues - Array of portfolio values over time
   * @returns {number} Maximum drawdown percentage
   */
  static calculateMaxDrawdown(portfolioValues) {
    if (!portfolioValues || portfolioValues.length === 0) return 0;

    let maxDrawdown = 0;
    let peak = portfolioValues[0];

    for (let i = 1; i < portfolioValues.length; i++) {
      if (portfolioValues[i] > peak) {
        peak = portfolioValues[i];
      }

      const drawdown = (peak - portfolioValues[i]) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return maxDrawdown;
  }

  /**
   * Calculate correlation matrix between assets
   * @param {Array} assetReturns - Array of arrays, each containing returns for an asset
   * @returns {Array} Correlation matrix
   */
  static calculateCorrelationMatrix(assetReturns) {
    if (!assetReturns || assetReturns.length === 0) return [];

    const numAssets = assetReturns.length;
    const correlationMatrix = Array(numAssets).fill().map(() => Array(numAssets).fill(0));

    for (let i = 0; i < numAssets; i++) {
      for (let j = 0; j < numAssets; j++) {
        if (i === j) {
          correlationMatrix[i][j] = 1;
        } else {
          correlationMatrix[i][j] = math.corr(assetReturns[i], assetReturns[j]);
        }
      }
    }

    return correlationMatrix;
  }

  /**
   * Perform stress test simulation
   * @param {Array} portfolioWeights - Array of portfolio weights
   * @param {Array} stressScenarios - Array of stress scenarios (return shocks)
   * @returns {Object} Stress test results
   */
  static performStressTest(portfolioWeights, stressScenarios) {
    const results = {
      scenarios: [],
      worstCase: null,
      bestCase: null
    };

    stressScenarios.forEach((scenario, index) => {
      const portfolioReturn = portfolioWeights.reduce((sum, weight, i) =>
        sum + weight * scenario.returns[i], 0
      );

      const result = {
        scenarioName: scenario.name,
        portfolioReturn: portfolioReturn,
        var: this.calculateVaR(scenario.returns, 0.95)
      };

      results.scenarios.push(result);

      if (!results.worstCase || portfolioReturn < results.worstCase.portfolioReturn) {
        results.worstCase = result;
      }

      if (!results.bestCase || portfolioReturn > results.bestCase.portfolioReturn) {
        results.bestCase = result;
      }
    });

    return results;
  }

  /**
   * Calculate risk score based on multiple metrics
   * @param {Object} metrics - Object containing various risk metrics
   * @returns {number} Risk score (0-100)
   */
  static calculateRiskScore(metrics) {
    const { volatility, maxDrawdown, sharpeRatio, valueAtRisk } = metrics;

    // Normalize and weight different risk factors
    const volatilityScore = Math.min(volatility * 100, 100);
    const drawdownScore = maxDrawdown * 100;
    const sharpeScore = Math.max(0, 100 - Math.abs(sharpeRatio) * 10);
    const varScore = Math.min(valueAtRisk * 100, 100);

    // Weighted average
    const riskScore = (
      volatilityScore * 0.3 +
      drawdownScore * 0.3 +
      sharpeScore * 0.2 +
      varScore * 0.2
    );

    return Math.min(Math.max(riskScore, 0), 100);
  }
}

module.exports = RiskCalculatorService;