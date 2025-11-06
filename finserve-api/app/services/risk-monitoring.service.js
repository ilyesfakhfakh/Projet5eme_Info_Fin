const cron = require('node-cron');
const RiskAlertService = require('./risk-alert.service');
const RiskCalculatorService = require('./risk-calculator.service');
const RiskAssessment = require('../models/risk/risk-assessment.model');
const { Op } = require('sequelize');

class RiskMonitoringService {
  constructor() {
    this.alertService = new RiskAlertService();
    this.isMonitoring = false;
    this.monitoringJobs = new Map();
  }

  /**
   * Start real-time risk monitoring for a portfolio
   * @param {string} portfolioId - Portfolio ID
   * @param {Object} options - Monitoring options
   */
  startMonitoring(portfolioId, options = {}) {
    if (this.monitoringJobs.has(portfolioId)) {
      console.log(`Monitoring already running for portfolio ${portfolioId}`);
      return;
    }

    const {
      interval = '*/5 * * * *', // Every 5 minutes by default
      checkLimits = true,
      generateAssessments = true,
      alertThresholds = {}
    } = options;

    const job = cron.schedule(interval, async () => {
      try {
        await this.performRiskCheck(portfolioId, {
          checkLimits,
          generateAssessments,
          alertThresholds
        });
      } catch (error) {
        console.error(`Error in risk monitoring for portfolio ${portfolioId}:`, error);
      }
    });

    this.monitoringJobs.set(portfolioId, job);
    console.log(`Started risk monitoring for portfolio ${portfolioId}`);
  }

  /**
   * Stop risk monitoring for a portfolio
   * @param {string} portfolioId - Portfolio ID
   */
  stopMonitoring(portfolioId) {
    const job = this.monitoringJobs.get(portfolioId);
    if (job) {
      job.stop();
      this.monitoringJobs.delete(portfolioId);
      console.log(`Stopped risk monitoring for portfolio ${portfolioId}`);
    }
  }

  /**
   * Perform comprehensive risk check
   * @param {string} portfolioId - Portfolio ID
   * @param {Object} options - Check options
   */
  async performRiskCheck(portfolioId, options = {}) {
    try {
      // Get current portfolio data (mock data for now)
      const portfolioData = await this.getCurrentPortfolioData(portfolioId);

      if (!portfolioData) {
        console.log(`No portfolio data found for ${portfolioId}`);
        return;
      }

      const { returns, portfolioValues, positions } = portfolioData;

      // Calculate current risk metrics
      const currentMetrics = {
        volatility: RiskCalculatorService.calculateVolatility(returns),
        valueAtRisk: RiskCalculatorService.calculateVaR(returns, 0.95),
        maxDrawdown: RiskCalculatorService.calculateMaxDrawdown(portfolioValues),
        sharpeRatio: RiskCalculatorService.calculateSharpeRatio(returns),
        dailyLoss: this.calculateDailyLoss(portfolioValues),
        positionSize: this.calculateLargestPositionSize(positions),
        concentration: this.calculateConcentrationRisk(positions)
      };

      // Check risk limits and generate alerts
      if (options.checkLimits) {
        await this.alertService.checkRiskLimits(portfolioId, currentMetrics);
      }

      // Generate periodic risk assessment
      if (options.generateAssessments) {
        await this.generatePeriodicAssessment(portfolioId, currentMetrics, returns, portfolioValues);
      }

      // Check for significant changes that might require immediate attention
      await this.checkSignificantChanges(portfolioId, currentMetrics, options.alertThresholds);

      return currentMetrics;

    } catch (error) {
      console.error('Error performing risk check:', error);
      throw error;
    }
  }

  /**
   * Generate periodic risk assessment
   * @param {string} portfolioId - Portfolio ID
   * @param {Object} metrics - Current risk metrics
   * @param {Array} returns - Historical returns
   * @param {Array} portfolioValues - Portfolio values
   */
  async generatePeriodicAssessment(portfolioId, metrics, returns, portfolioValues) {
    try {
      // Check if we need to generate a new assessment (e.g., once per hour)
      const lastAssessment = await RiskAssessment.findOne({
        where: { portfolio_id: portfolioId },
        order: [['assessment_date', 'DESC']]
      });

      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      if (lastAssessment && lastAssessment.assessment_date > oneHourAgo) {
        return; // Skip if assessment was done within the last hour
      }

      const riskScore = RiskCalculatorService.calculateRiskScore(metrics);
      const recommendations = this.generateRecommendations(metrics);

      await RiskAssessment.create({
        portfolio_id: portfolioId,
        risk_score: riskScore,
        volatility: metrics.volatility,
        max_drawdown: metrics.maxDrawdown,
        sharpe_ratio: metrics.sharpeRatio,
        value_at_risk: metrics.valueAtRisk,
        recommendations
      });

      console.log(`Generated periodic risk assessment for portfolio ${portfolioId}`);

    } catch (error) {
      console.error('Error generating periodic assessment:', error);
    }
  }

  /**
   * Check for significant changes in risk metrics
   * @param {string} portfolioId - Portfolio ID
   * @param {Object} currentMetrics - Current risk metrics
   * @param {Object} thresholds - Alert thresholds
   */
  async checkSignificantChanges(portfolioId, currentMetrics, thresholds = {}) {
    try {
      // Get previous assessment for comparison
      const previousAssessment = await RiskAssessment.findOne({
        where: { portfolio_id: portfolioId },
        order: [['assessment_date', 'DESC']],
        offset: 1 // Get the second most recent
      });

      if (!previousAssessment) return;

      const changes = {
        volatility: currentMetrics.volatility - previousAssessment.volatility,
        valueAtRisk: currentMetrics.valueAtRisk - previousAssessment.value_at_risk,
        maxDrawdown: currentMetrics.maxDrawdown - previousAssessment.max_drawdown,
        sharpeRatio: currentMetrics.sharpeRatio - previousAssessment.sharpe_ratio
      };

      // Check for significant changes
      const significantChangeThreshold = thresholds.significantChange || 0.1; // 10% change

      if (Math.abs(changes.volatility) > significantChangeThreshold) {
        await this.alertService.createAlert({
          portfolio_id: portfolioId,
          alert_type: 'VOLATILITY_SPIKE',
          threshold_value: previousAssessment.volatility,
          current_value: currentMetrics.volatility,
          message: `Volatility changed by ${(changes.volatility * 100).toFixed(2)}% from previous assessment`,
          severity: Math.abs(changes.volatility) > 0.2 ? 'HIGH' : 'MEDIUM'
        });
      }

      if (Math.abs(changes.valueAtRisk) > significantChangeThreshold) {
        await this.alertService.createAlert({
          portfolio_id: portfolioId,
          alert_type: 'VAR_EXCEEDED',
          threshold_value: previousAssessment.value_at_risk,
          current_value: currentMetrics.valueAtRisk,
          message: `VaR changed by ${(changes.valueAtRisk * 100).toFixed(2)}% from previous assessment`,
          severity: Math.abs(changes.valueAtRisk) > 0.2 ? 'HIGH' : 'MEDIUM'
        });
      }

    } catch (error) {
      console.error('Error checking significant changes:', error);
    }
  }

  /**
   * Get current portfolio data (mock implementation)
   * @param {string} portfolioId - Portfolio ID
   * @returns {Object} Portfolio data
   */
  async getCurrentPortfolioData(portfolioId) {
    // This is a mock implementation
    // In a real system, this would fetch data from market data APIs,
    // portfolio management systems, etc.

    try {
      // Generate mock returns (last 100 trading days)
      const returns = Array.from({ length: 100 }, () => {
        return (Math.random() - 0.5) * 0.04; // Random returns between -2% and +2%
      });

      // Generate mock portfolio values
      let currentValue = 100000;
      const portfolioValues = [currentValue];

      for (let i = 1; i < 50; i++) {
        currentValue *= (1 + (Math.random() - 0.5) * 0.02); // Small daily changes
        portfolioValues.push(currentValue);
      }

      // Mock positions
      const positions = [
        { symbol: 'AAPL', value: 25000, weight: 0.25 },
        { symbol: 'MSFT', value: 20000, weight: 0.20 },
        { symbol: 'GOOGL', value: 15000, weight: 0.15 },
        { symbol: 'AMZN', value: 10000, weight: 0.10 },
        { symbol: 'TSLA', value: 5000, weight: 0.05 },
        { symbol: 'CASH', value: 25000, weight: 0.25 }
      ];

      return {
        returns,
        portfolioValues,
        positions
      };

    } catch (error) {
      console.error('Error getting portfolio data:', error);
      return null;
    }
  }

  /**
   * Calculate daily loss from portfolio values
   * @param {Array} portfolioValues - Array of portfolio values
   * @returns {number} Daily loss percentage
   */
  calculateDailyLoss(portfolioValues) {
    if (portfolioValues.length < 2) return 0;

    const latest = portfolioValues[portfolioValues.length - 1];
    const previous = portfolioValues[portfolioValues.length - 2];

    return (previous - latest) / previous;
  }

  /**
   * Calculate largest position size
   * @param {Array} positions - Array of positions
   * @returns {number} Largest position weight
   */
  calculateLargestPositionSize(positions) {
    if (!positions || positions.length === 0) return 0;

    return Math.max(...positions.map(p => p.weight || 0));
  }

  /**
   * Calculate concentration risk (Herfindahl-Hirschman Index)
   * @param {Array} positions - Array of positions
   * @returns {number} Concentration index
   */
  calculateConcentrationRisk(positions) {
    if (!positions || positions.length === 0) return 0;

    const weights = positions.map(p => p.weight || 0);
    return weights.reduce((sum, weight) => sum + weight * weight, 0);
  }

  /**
   * Generate risk recommendations based on metrics
   * @param {Object} metrics - Risk metrics
   * @returns {string} Recommendations
   */
  generateRecommendations(metrics) {
    const recommendations = [];

    if (metrics.volatility > 0.25) {
      recommendations.push('Consider reducing portfolio volatility through diversification.');
    }

    if (metrics.sharpeRatio < 0.5) {
      recommendations.push('Sharpe ratio indicates poor risk-adjusted returns. Review investment strategy.');
    }

    if (metrics.maxDrawdown > 0.15) {
      recommendations.push('High drawdown detected. Consider implementing stop-loss orders.');
    }

    if (metrics.valueAtRisk > 0.05) {
      recommendations.push('VaR exceeds 5%. Consider reducing position sizes.');
    }

    return recommendations.length > 0 ?
      recommendations.join(' ') :
      'Risk metrics are within acceptable ranges. Continue monitoring.';
  }

  /**
   * Get monitoring status for all portfolios
   * @returns {Object} Monitoring status
   */
  getMonitoringStatus() {
    const activePortfolios = Array.from(this.monitoringJobs.keys());
    return {
      isMonitoring: this.isMonitoring,
      activePortfolios: activePortfolios,
      totalMonitored: activePortfolios.length
    };
  }

  /**
   * Stop all monitoring jobs
   */
  stopAllMonitoring() {
    for (const [portfolioId, job] of this.monitoringJobs) {
      job.stop();
      console.log(`Stopped monitoring for portfolio ${portfolioId}`);
    }
    this.monitoringJobs.clear();
    this.isMonitoring = false;
  }

  /**
   * Schedule daily risk report generation
   * @param {string} portfolioId - Portfolio ID
   * @param {string} cronExpression - Cron expression for scheduling
   */
  scheduleDailyReport(portfolioId, cronExpression = '0 8 * * *') {
    // Schedule daily report at 8 AM
    cron.schedule(cronExpression, async () => {
      try {
        await this.generateDailyRiskReport(portfolioId);
      } catch (error) {
        console.error(`Error generating daily report for ${portfolioId}:`, error);
      }
    });
  }

  /**
   * Generate daily risk report
   * @param {string} portfolioId - Portfolio ID
   */
  async generateDailyRiskReport(portfolioId) {
    // Implementation for generating and sending daily risk reports
    console.log(`Generating daily risk report for portfolio ${portfolioId}`);
    // This could generate a PDF report and email it to stakeholders
  }
}

module.exports = RiskMonitoringService;