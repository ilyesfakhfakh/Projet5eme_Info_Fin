const RiskAssessment = require('../models/risk/risk-assessment.model');
const RiskLimit = require('../models/risk/risk-limit.model');
const RiskAlert = require('../models/risk/risk-alert.model');
const ScenarioAnalysis = require('../models/risk/scenario-analysis.model');
const RiskCalculatorService = require('../services/risk-calculator.service');
const { Op } = require('sequelize');

class RiskController {
  /**
   * Calculate and store risk assessment for a portfolio
   */
  static async calculateRiskAssessment(req, res) {
    try {
      const { portfolio_id, returns, portfolio_values, risk_free_rate } = req.body;

      if (!portfolio_id || !returns || !portfolio_values) {
        return res.status(400).json({
          error: 'Missing required parameters: portfolio_id, returns, portfolio_values'
        });
      }

      // Calculate risk metrics
      const volatility = RiskCalculatorService.calculateVolatility(returns);
      const sharpeRatio = RiskCalculatorService.calculateSharpeRatio(returns, risk_free_rate || 0.02);
      const maxDrawdown = RiskCalculatorService.calculateMaxDrawdown(portfolio_values);
      const valueAtRisk = RiskCalculatorService.calculateVaR(returns, 0.95);

      // Calculate risk score
      const riskScore = RiskCalculatorService.calculateRiskScore({
        volatility,
        maxDrawdown,
        sharpeRatio,
        valueAtRisk
      });

      // Generate recommendations based on risk metrics
      const recommendations = RiskController.generateRecommendations({
        volatility,
        sharpeRatio,
        maxDrawdown,
        valueAtRisk
      });

      // Save assessment
      const assessment = await RiskAssessment.create({
        portfolio_id,
        risk_score: riskScore,
        volatility,
        max_drawdown: maxDrawdown,
        sharpe_ratio: sharpeRatio,
        value_at_risk: valueAtRisk,
        recommendations
      });

      res.status(201).json({
        message: 'Risk assessment calculated successfully',
        assessment
      });

    } catch (error) {
      console.error('Error calculating risk assessment:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get risk assessment history for a portfolio
   */
  static async getRiskAssessments(req, res) {
    try {
      const { portfolio_id } = req.params;
      const { limit = 10, offset = 0 } = req.query;

      const assessments = await RiskAssessment.findAll({
        where: { portfolio_id },
        order: [['assessment_date', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({ assessments });

    } catch (error) {
      console.error('Error fetching risk assessments:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get current risk limits for a portfolio
   */
  static async getRiskLimits(req, res) {
    try {
      const { portfolio_id } = req.params;

      const limits = await RiskLimit.findAll({
        where: { portfolio_id, is_active: true }
      });

      res.json({ limits });

    } catch (error) {
      console.error('Error fetching risk limits:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get current risk metrics for a portfolio
   */
  static async getRiskMetrics(req, res) {
    try {
      const { portfolio_id } = req.params;

      // Get latest assessment
      const latestAssessment = await RiskAssessment.findOne({
        where: { portfolio_id },
        order: [['assessment_date', 'DESC']]
      });

      if (!latestAssessment) {
        return res.status(404).json({ error: 'No risk assessment found for this portfolio' });
      }

      // Get recent alerts
      const recentAlerts = await RiskAlert.findAll({
        where: { portfolio_id },
        order: [['alert_date', 'DESC']],
        limit: 5
      });

      // Get active limits
      const activeLimits = await RiskLimit.findAll({
        where: { portfolio_id, is_active: true }
      });

      const metrics = {
        portfolio_id,
        current_assessment: {
          risk_score: latestAssessment.risk_score,
          volatility: latestAssessment.volatility,
          max_drawdown: latestAssessment.max_drawdown,
          sharpe_ratio: latestAssessment.sharpe_ratio,
          value_at_risk: latestAssessment.value_at_risk,
          recommendations: latestAssessment.recommendations,
          assessment_date: latestAssessment.assessment_date
        },
        alerts_summary: {
          total: recentAlerts.length,
          unread: recentAlerts.filter(a => !a.is_read).length,
          critical: recentAlerts.filter(a => a.severity === 'CRITICAL').length
        },
        limits_summary: {
          total: activeLimits.length,
          breached: activeLimits.filter(l => l.alert_triggered).length,
          compliance_rate: activeLimits.length > 0 ?
            (activeLimits.filter(l => !l.alert_triggered).length / activeLimits.length) * 100 : 100
        },
        last_updated: latestAssessment.assessment_date
      };

      res.json(metrics);

    } catch (error) {
      console.error('Error fetching risk metrics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update or create risk limits
   */
  static async updateRiskLimits(req, res) {
    try {
      const { portfolio_id } = req.params;
      const { limits } = req.body;

      if (!Array.isArray(limits)) {
        return res.status(400).json({ error: 'Limits must be an array' });
      }

      const updatedLimits = [];

      for (const limit of limits) {
        const [updatedLimit] = await RiskLimit.upsert({
          portfolio_id,
          limit_type: limit.limit_type,
          threshold: limit.threshold,
          is_active: limit.is_active !== undefined ? limit.is_active : true
        });
        updatedLimits.push(updatedLimit);
      }

      res.json({
        message: 'Risk limits updated successfully',
        limits: updatedLimits
      });

    } catch (error) {
      console.error('Error updating risk limits:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get risk alerts for a portfolio
   */
  static async getRiskAlerts(req, res) {
    try {
      const { portfolio_id } = req.params;
      const { is_read, limit = 20 } = req.query;

      const whereClause = { portfolio_id };
      if (is_read !== undefined) {
        whereClause.is_read = is_read === 'true';
      }

      const alerts = await RiskAlert.findAll({
        where: whereClause,
        order: [['alert_date', 'DESC']],
        limit: parseInt(limit)
      });

      res.json({ alerts });

    } catch (error) {
      console.error('Error fetching risk alerts:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Mark alerts as read
   */
  static async markAlertsAsRead(req, res) {
    try {
      const { alert_ids } = req.body;

      if (!Array.isArray(alert_ids)) {
        return res.status(400).json({ error: 'alert_ids must be an array' });
      }

      await RiskAlert.update(
        { is_read: true },
        { where: { alert_id: { [Op.in]: alert_ids } } }
      );

      res.json({ message: 'Alerts marked as read' });

    } catch (error) {
      console.error('Error marking alerts as read:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Perform scenario analysis
   */
  static async performScenarioAnalysis(req, res) {
    try {
      const { portfolio_id, scenario_type, scenario_name, parameters } = req.body;

      if (!portfolio_id || !scenario_type || !parameters) {
        return res.status(400).json({
          error: 'Missing required parameters: portfolio_id, scenario_type, parameters'
        });
      }

      let results = {};

      switch (scenario_type) {
        case 'STRESS_TEST':
          results = RiskCalculatorService.performStressTest(
            parameters.portfolioWeights,
            parameters.stressScenarios
          );
          break;

        case 'WHAT_IF':
          // Implement what-if analysis logic
          results = { message: 'What-if analysis not yet implemented' };
          break;

        case 'BACKTESTING':
          // Implement backtesting logic
          results = { message: 'Backtesting not yet implemented' };
          break;

        default:
          return res.status(400).json({ error: 'Invalid scenario type' });
      }

      // Save scenario analysis
      const scenario = await ScenarioAnalysis.create({
        portfolio_id,
        scenario_type,
        scenario_name: scenario_name || `${scenario_type} Analysis`,
        parameters,
        results,
        impact_var: results.worstCase ? results.worstCase.var : 0,
        impact_drawdown: results.worstCase ? results.worstCase.portfolioReturn : 0
      });

      res.status(201).json({
        message: 'Scenario analysis completed',
        scenario
      });

    } catch (error) {
      console.error('Error performing scenario analysis:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get scenario analysis history
   */
  static async getScenarioAnalyses(req, res) {
    try {
      const { portfolio_id } = req.params;
      const { scenario_type, limit = 10 } = req.query;

      const whereClause = { portfolio_id };
      if (scenario_type) {
        whereClause.scenario_type = scenario_type;
      }

      const scenarios = await ScenarioAnalysis.findAll({
        where: whereClause,
        order: [['created_date', 'DESC']],
        limit: parseInt(limit)
      });

      res.json({ scenarios });

    } catch (error) {
      console.error('Error fetching scenario analyses:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Generate risk recommendations based on metrics
   */
  static generateRecommendations(metrics) {
    const { volatility, sharpeRatio, maxDrawdown, valueAtRisk } = metrics;
    const recommendations = [];

    if (volatility > 0.3) {
      recommendations.push('High portfolio volatility detected. Consider diversifying your investments.');
    }

    if (sharpeRatio < 0.5) {
      recommendations.push('Low Sharpe ratio indicates poor risk-adjusted returns. Review your asset allocation.');
    }

    if (maxDrawdown > 0.2) {
      recommendations.push('Significant drawdown detected. Consider implementing stop-loss orders.');
    }

    if (valueAtRisk > 0.1) {
      recommendations.push('High Value at Risk. Consider reducing position sizes or hedging strategies.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Portfolio risk metrics are within acceptable ranges. Continue monitoring.');
    }

    return recommendations.join(' ');
  }

  /**
   * Check risk limits and generate alerts
   */
  static async checkRiskLimits(portfolio_id, currentMetrics) {
    try {
      const limits = await RiskLimit.findAll({
        where: { portfolio_id, is_active: true }
      });

      const alerts = [];

      for (const limit of limits) {
        let alertTriggered = false;
        let message = '';
        let currentValue = 0;

        switch (limit.limit_type) {
          case 'DAILY_LOSS':
            currentValue = currentMetrics.dailyLoss || 0;
            if (currentValue > limit.threshold) {
              alertTriggered = true;
              message = `Daily loss of ${currentValue} exceeds limit of ${limit.threshold}`;
            }
            break;

          case 'POSITION_SIZE':
            currentValue = currentMetrics.positionSize || 0;
            if (currentValue > limit.threshold) {
              alertTriggered = true;
              message = `Position size of ${currentValue} exceeds limit of ${limit.threshold}`;
            }
            break;

          case 'CONCENTRATION':
            currentValue = currentMetrics.concentration || 0;
            if (currentValue > limit.threshold) {
              alertTriggered = true;
              message = `Asset concentration of ${currentValue} exceeds limit of ${limit.threshold}`;
            }
            break;
        }

        if (alertTriggered) {
          await RiskAlert.create({
            portfolio_id,
            alert_type: limit.limit_type,
            threshold_value: limit.threshold,
            current_value: currentValue,
            message
          });

          // Update limit status
          await limit.update({ alert_triggered: true, current_value: currentValue });
        }
      }

      return alerts;

    } catch (error) {
      console.error('Error checking risk limits:', error);
      throw error;
    }
  }
}

module.exports = RiskController;