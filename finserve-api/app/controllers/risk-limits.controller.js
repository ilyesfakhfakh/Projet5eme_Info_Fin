const RiskLimit = require('../models/risk/risk-limit.model');
const RiskAlert = require('../models/risk/risk-alert.model');
const RiskMonitoringService = require('../services/risk-monitoring.service');

class RiskLimitsController {
  /**
   * Get all risk limits for a portfolio
   */
  static async getRiskLimits(req, res) {
    try {
      const { portfolio_id } = req.params;
      const { active_only = 'true' } = req.query;

      const whereClause = { portfolio_id };
      if (active_only === 'true') {
        whereClause.is_active = true;
      }

      const limits = await RiskLimit.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']]
      });

      res.json({ limits });

    } catch (error) {
      console.error('Error fetching risk limits:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Create or update a risk limit
   */
  static async setRiskLimit(req, res) {
    try {
      const { portfolio_id } = req.params;
      const { limit_type, threshold, is_active = true } = req.body;

      if (!limit_type || threshold === undefined) {
        return res.status(400).json({
          error: 'Missing required fields: limit_type, threshold'
        });
      }

      // Check if limit type is valid
      const validTypes = ['DAILY_LOSS', 'POSITION_SIZE', 'CONCENTRATION', 'VAR_LIMIT', 'VOLATILITY_LIMIT', 'DRAWDOWN_LIMIT'];
      if (!validTypes.includes(limit_type)) {
        return res.status(400).json({ error: 'Invalid limit type' });
      }

      // Upsert the limit
      const [limit, created] = await RiskLimit.upsert({
        portfolio_id,
        limit_type,
        threshold,
        is_active,
        current_value: 0, // Will be updated by monitoring service
        alert_triggered: false
      });

      res.status(created ? 201 : 200).json({
        message: `Risk limit ${created ? 'created' : 'updated'} successfully`,
        limit
      });

    } catch (error) {
      console.error('Error setting risk limit:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update multiple risk limits at once
   */
  static async bulkUpdateLimits(req, res) {
    try {
      const { portfolio_id } = req.params;
      const { limits } = req.body;

      if (!Array.isArray(limits)) {
        return res.status(400).json({ error: 'Limits must be an array' });
      }

      const updatedLimits = [];

      for (const limitData of limits) {
        const [limit] = await RiskLimit.upsert({
          portfolio_id,
          limit_type: limitData.limit_type,
          threshold: limitData.threshold,
          is_active: limitData.is_active !== undefined ? limitData.is_active : true,
          current_value: limitData.current_value || 0,
          alert_triggered: limitData.alert_triggered || false
        });
        updatedLimits.push(limit);
      }

      res.json({
        message: 'Risk limits updated successfully',
        limits: updatedLimits
      });

    } catch (error) {
      console.error('Error bulk updating limits:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Deactivate a risk limit
   */
  static async deactivateLimit(req, res) {
    try {
      const { limit_id } = req.params;

      const limit = await RiskLimit.findByPk(limit_id);
      if (!limit) {
        return res.status(404).json({ error: 'Risk limit not found' });
      }

      await limit.update({ is_active: false });

      res.json({ message: 'Risk limit deactivated successfully' });

    } catch (error) {
      console.error('Error deactivating risk limit:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get limit breaches and alerts
   */
  static async getLimitBreaches(req, res) {
    try {
      const { portfolio_id } = req.params;
      const { days = 30 } = req.query;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      // Get breached limits
      const breachedLimits = await RiskLimit.findAll({
        where: {
          portfolio_id,
          alert_triggered: true,
          updatedAt: { [require('sequelize').Op.gte]: startDate }
        }
      });

      // Get related alerts
      const alerts = await RiskAlert.findAll({
        where: {
          portfolio_id,
          alert_date: { [require('sequelize').Op.gte]: startDate }
        },
        order: [['alert_date', 'DESC']]
      });

      res.json({
        breached_limits: breachedLimits,
        alerts: alerts,
        summary: {
          total_breaches: breachedLimits.length,
          active_alerts: alerts.filter(a => !a.is_read).length
        }
      });

    } catch (error) {
      console.error('Error fetching limit breaches:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Reset alert triggers for limits
   */
  static async resetLimitAlerts(req, res) {
    try {
      const { portfolio_id } = req.params;
      const { limit_ids } = req.body;

      const whereClause = { portfolio_id, alert_triggered: true };
      if (Array.isArray(limit_ids)) {
        whereClause.limit_id = { [require('sequelize').Op.in]: limit_ids };
      }

      const [affectedRows] = await RiskLimit.update(
        { alert_triggered: false },
        { where: whereClause }
      );

      res.json({
        message: `${affectedRows} limit alerts reset successfully`
      });

    } catch (error) {
      console.error('Error resetting limit alerts:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get risk limit templates
   */
  static async getLimitTemplates(req, res) {
    try {
      const templates = {
        conservative: [
          { limit_type: 'DAILY_LOSS', threshold: 0.01, description: 'Max 1% daily loss' },
          { limit_type: 'POSITION_SIZE', threshold: 0.05, description: 'Max 5% in single position' },
          { limit_type: 'CONCENTRATION', threshold: 0.10, description: 'Max 10% concentration' },
          { limit_type: 'VAR_LIMIT', threshold: 0.02, description: 'Max 2% VaR' },
          { limit_type: 'VOLATILITY_LIMIT', threshold: 0.15, description: 'Max 15% volatility' },
          { limit_type: 'DRAWDOWN_LIMIT', threshold: 0.10, description: 'Max 10% drawdown' }
        ],
        moderate: [
          { limit_type: 'DAILY_LOSS', threshold: 0.02, description: 'Max 2% daily loss' },
          { limit_type: 'POSITION_SIZE', threshold: 0.10, description: 'Max 10% in single position' },
          { limit_type: 'CONCENTRATION', threshold: 0.20, description: 'Max 20% concentration' },
          { limit_type: 'VAR_LIMIT', threshold: 0.03, description: 'Max 3% VaR' },
          { limit_type: 'VOLATILITY_LIMIT', threshold: 0.20, description: 'Max 20% volatility' },
          { limit_type: 'DRAWDOWN_LIMIT', threshold: 0.15, description: 'Max 15% drawdown' }
        ],
        aggressive: [
          { limit_type: 'DAILY_LOSS', threshold: 0.05, description: 'Max 5% daily loss' },
          { limit_type: 'POSITION_SIZE', threshold: 0.20, description: 'Max 20% in single position' },
          { limit_type: 'CONCENTRATION', threshold: 0.30, description: 'Max 30% concentration' },
          { limit_type: 'VAR_LIMIT', threshold: 0.05, description: 'Max 5% VaR' },
          { limit_type: 'VOLATILITY_LIMIT', threshold: 0.30, description: 'Max 30% volatility' },
          { limit_type: 'DRAWDOWN_LIMIT', threshold: 0.25, description: 'Max 25% drawdown' }
        ]
      };

      res.json({ templates });

    } catch (error) {
      console.error('Error fetching limit templates:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Apply risk limit template
   */
  static async applyLimitTemplate(req, res) {
    try {
      const { portfolio_id } = req.params;
      const { template_name } = req.body;

      const templates = await this.getLimitTemplates({}, { json: () => {} });
      const template = templates.templates[template_name];

      if (!template) {
        return res.status(400).json({ error: 'Invalid template name' });
      }

      const appliedLimits = [];

      for (const limitData of template) {
        const [limit] = await RiskLimit.upsert({
          portfolio_id,
          limit_type: limitData.limit_type,
          threshold: limitData.threshold,
          is_active: true,
          current_value: 0,
          alert_triggered: false
        });
        appliedLimits.push(limit);
      }

      res.json({
        message: `${template_name} template applied successfully`,
        limits: appliedLimits
      });

    } catch (error) {
      console.error('Error applying limit template:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get risk limit compliance report
   */
  static async getComplianceReport(req, res) {
    try {
      const { portfolio_id } = req.params;

      const limits = await RiskLimit.findAll({
        where: { portfolio_id, is_active: true }
      });

      const alerts = await RiskAlert.findAll({
        where: { portfolio_id },
        order: [['alert_date', 'DESC']],
        limit: 50
      });

      const compliance = {
        total_limits: limits.length,
        compliant_limits: limits.filter(l => !l.alert_triggered).length,
        breached_limits: limits.filter(l => l.alert_triggered).length,
        compliance_rate: limits.length > 0 ? (limits.filter(l => !l.alert_triggered).length / limits.length) * 100 : 100,
        recent_alerts: alerts.slice(0, 10),
        limits_status: limits.map(limit => ({
          type: limit.limit_type,
          threshold: limit.threshold,
          current_value: limit.current_value,
          status: limit.alert_triggered ? 'BREACHED' : 'COMPLIANT',
          last_updated: limit.updatedAt
        }))
      };

      res.json({ compliance });

    } catch (error) {
      console.error('Error generating compliance report:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Start/stop risk monitoring for a portfolio
   */
  static async toggleMonitoring(req, res) {
    try {
      const { portfolio_id } = req.params;
      const { action, options = {} } = req.body;

      const monitoringService = new RiskMonitoringService();

      if (action === 'start') {
        monitoringService.startMonitoring(portfolio_id, options);
        res.json({ message: `Risk monitoring started for portfolio ${portfolio_id}` });
      } else if (action === 'stop') {
        monitoringService.stopMonitoring(portfolio_id);
        res.json({ message: `Risk monitoring stopped for portfolio ${portfolio_id}` });
      } else {
        res.status(400).json({ error: 'Invalid action. Use "start" or "stop"' });
      }

    } catch (error) {
      console.error('Error toggling risk monitoring:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get monitoring status
   */
  static async getMonitoringStatus(req, res) {
    try {
      const monitoringService = new RiskMonitoringService();
      const status = monitoringService.getMonitoringStatus();

      res.json({ status });

    } catch (error) {
      console.error('Error getting monitoring status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Manually trigger risk check
   */
  static async triggerRiskCheck(req, res) {
    try {
      const { portfolio_id } = req.params;
      const monitoringService = new RiskMonitoringService();

      const metrics = await monitoringService.performRiskCheck(portfolio_id);

      res.json({
        message: 'Risk check completed',
        metrics
      });

    } catch (error) {
      console.error('Error triggering risk check:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = RiskLimitsController;