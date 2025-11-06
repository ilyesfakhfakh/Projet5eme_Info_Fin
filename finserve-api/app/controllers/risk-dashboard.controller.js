const RiskAssessment = require('../models/risk/risk-assessment.model');
const RiskAlert = require('../models/risk/risk-alert.model');
const RiskLimit = require('../models/risk/risk-limit.model');
const ScenarioAnalysis = require('../models/risk/scenario-analysis.model');
const RiskVisualizationService = require('../services/risk-visualization.service');
const RiskCalculatorService = require('../services/risk-calculator.service');
const { Op } = require('sequelize');

class RiskDashboardController {
  /**
   * Get comprehensive risk dashboard data
   */
  static async getDashboard(req, res) {
    try {
      const { portfolio_id } = req.params;
      const { period = '30' } = req.query; // days

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));

      // Get latest assessment
      const latestAssessment = await RiskAssessment.findOne({
        where: { portfolio_id },
        order: [['assessment_date', 'DESC']]
      });

      // Get recent assessments for trends
      const assessments = await RiskAssessment.findAll({
        where: {
          portfolio_id,
          assessment_date: { [Op.gte]: startDate }
        },
        order: [['assessment_date', 'ASC']]
      });

      // Get active alerts
      const alerts = await RiskAlert.findAll({
        where: {
          portfolio_id,
          alert_date: { [Op.gte]: startDate }
        },
        order: [['alert_date', 'DESC']]
      });

      // Get active limits
      const limits = await RiskLimit.findAll({
        where: { portfolio_id, is_active: true }
      });

      // Get recent scenario analyses
      const scenarios = await ScenarioAnalysis.findAll({
        where: {
          portfolio_id,
          created_date: { [Op.gte]: startDate }
        },
        order: [['created_date', 'DESC']],
        limit: 5
      });

      // Generate dashboard data
      const dashboard = {
        summary: this.generateDashboardSummary(latestAssessment, alerts, limits),
        trends: this.generateTrendsData(assessments),
        alerts: this.generateAlertsSummary(alerts),
        limits: this.generateLimitsSummary(limits),
        scenarios: scenarios,
        charts: await this.generateDashboardCharts(portfolio_id, assessments, alerts),
        last_updated: latestAssessment?.assessment_date || null
      };

      res.json({ dashboard });

    } catch (error) {
      console.error('Error generating risk dashboard:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Generate dashboard summary
   */
  static generateDashboardSummary(latestAssessment, alerts, limits) {
    const summary = {
      current_risk: {
        score: latestAssessment?.risk_score || 0,
        level: RiskVisualizationService.getRiskLevel(latestAssessment?.risk_score || 0),
        volatility: latestAssessment?.volatility || 0,
        sharpe_ratio: latestAssessment?.sharpe_ratio || 0,
        max_drawdown: latestAssessment?.max_drawdown || 0,
        value_at_risk: latestAssessment?.value_at_risk || 0
      },
      alerts_summary: {
        total: alerts.length,
        unread: alerts.filter(a => !a.is_read).length,
        critical: alerts.filter(a => a.severity === 'CRITICAL').length,
        by_type: this.groupAlertsByType(alerts)
      },
      limits_summary: {
        total: limits.length,
        compliant: limits.filter(l => !l.alert_triggered).length,
        breached: limits.filter(l => l.alert_triggered).length,
        compliance_rate: limits.length > 0 ? (limits.filter(l => !l.alert_triggered).length / limits.length) * 100 : 100
      },
      recommendations: latestAssessment?.recommendations || 'No recommendations available'
    };

    return summary;
  }

  /**
   * Generate trends data
   */
  static generateTrendsData(assessments) {
    if (assessments.length === 0) return {};

    const trends = {
      risk_score: assessments.map(a => ({ date: a.assessment_date, value: a.risk_score })),
      volatility: assessments.map(a => ({ date: a.assessment_date, value: a.volatility })),
      sharpe_ratio: assessments.map(a => ({ date: a.assessment_date, value: a.sharpe_ratio })),
      value_at_risk: assessments.map(a => ({ date: a.assessment_date, value: a.value_at_risk })),
      max_drawdown: assessments.map(a => ({ date: a.assessment_date, value: a.max_drawdown }))
    };

    // Calculate trend directions
    trends.directions = {
      risk_score: this.calculateTrendDirection(trends.risk_score.map(d => d.value)),
      volatility: this.calculateTrendDirection(trends.volatility.map(d => d.value)),
      sharpe_ratio: this.calculateTrendDirection(trends.sharpe_ratio.map(d => d.value))
    };

    return trends;
  }

  /**
   * Generate alerts summary
   */
  static generateAlertsSummary(alerts) {
    return {
      recent: alerts.slice(0, 5),
      by_severity: {
        CRITICAL: alerts.filter(a => a.severity === 'CRITICAL').length,
        HIGH: alerts.filter(a => a.severity === 'HIGH').length,
        MEDIUM: alerts.filter(a => a.severity === 'MEDIUM').length,
        LOW: alerts.filter(a => a.severity === 'LOW').length
      },
      timeline: RiskVisualizationService.generateAlertsTimeline(alerts)
    };
  }

  /**
   * Generate limits summary
   */
  static generateLimitsSummary(limits) {
    return limits.map(limit => ({
      type: limit.limit_type,
      threshold: limit.threshold,
      current_value: limit.current_value,
      status: limit.alert_triggered ? 'BREACHED' : 'COMPLIANT',
      breach_percentage: limit.current_value > limit.threshold ?
        ((limit.current_value - limit.threshold) / limit.threshold) * 100 : 0
    }));
  }

  /**
   * Generate dashboard charts
   */
  static async generateDashboardCharts(portfolioId, assessments, alerts) {
    const charts = {};

    try {
      // Risk metrics time series
      if (assessments.length > 0) {
        charts.risk_trends = RiskVisualizationService.generateRiskMetricsTimeSeries(assessments);
      }

      // VaR distribution (mock data for now)
      charts.var_distribution = await this.getMockVaRChart(portfolioId);

      // Alerts timeline
      if (alerts.length > 0) {
        charts.alerts_timeline = RiskVisualizationService.generateAlertsTimeline(alerts);
      }

      // Correlation heatmap (mock data)
      charts.correlation_heatmap = await this.getMockCorrelationHeatmap(portfolioId);

    } catch (error) {
      console.error('Error generating dashboard charts:', error);
    }

    return charts;
  }

  /**
   * Get risk dashboard widgets
   */
  static async getDashboardWidgets(req, res) {
    try {
      const { portfolio_id } = req.params;
      const { widgets } = req.query; // comma-separated list of widgets

      const requestedWidgets = widgets ? widgets.split(',') : ['summary', 'alerts', 'limits', 'trends'];

      const widgetData = {};

      for (const widget of requestedWidgets) {
        switch (widget) {
          case 'summary':
            widgetData.summary = await this.getSummaryWidget(portfolioId);
            break;
          case 'alerts':
            widgetData.alerts = await this.getAlertsWidget(portfolioId);
            break;
          case 'limits':
            widgetData.limits = await this.getLimitsWidget(portfolioId);
            break;
          case 'trends':
            widgetData.trends = await this.getTrendsWidget(portfolioId);
            break;
          case 'scenarios':
            widgetData.scenarios = await this.getScenariosWidget(portfolioId);
            break;
        }
      }

      res.json({ widgets: widgetData });

    } catch (error) {
      console.error('Error fetching dashboard widgets:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get summary widget data
   */
  static async getSummaryWidget(portfolioId) {
    const latestAssessment = await RiskAssessment.findOne({
      where: { portfolio_id: portfolioId },
      order: [['assessment_date', 'DESC']]
    });

    const unreadAlerts = await RiskAlert.count({
      where: { portfolio_id: portfolioId, is_read: false }
    });

    const breachedLimits = await RiskLimit.count({
      where: { portfolio_id: portfolioId, is_active: true, alert_triggered: true }
    });

    return {
      risk_score: latestAssessment?.risk_score || 0,
      risk_level: RiskVisualizationService.getRiskLevel(latestAssessment?.risk_score || 0),
      unread_alerts: unreadAlerts,
      breached_limits: breachedLimits,
      last_assessment: latestAssessment?.assessment_date || null
    };
  }

  /**
   * Get alerts widget data
   */
  static async getAlertsWidget(portfolioId) {
    const recentAlerts = await RiskAlert.findAll({
      where: { portfolio_id: portfolioId },
      order: [['alert_date', 'DESC']],
      limit: 5
    });

    return {
      recent: recentAlerts,
      unread_count: recentAlerts.filter(a => !a.is_read).length,
      critical_count: recentAlerts.filter(a => a.severity === 'CRITICAL').length
    };
  }

  /**
   * Get limits widget data
   */
  static async getLimitsWidget(portfolioId) {
    const limits = await RiskLimit.findAll({
      where: { portfolio_id: portfolioId, is_active: true }
    });

    return {
      limits: limits.map(l => ({
        type: l.limit_type,
        threshold: l.threshold,
        current_value: l.current_value,
        status: l.alert_triggered ? 'BREACHED' : 'COMPLIANT'
      })),
      compliance_rate: limits.length > 0 ? (limits.filter(l => !l.alert_triggered).length / limits.length) * 100 : 100
    };
  }

  /**
   * Get trends widget data
   */
  static async getTrendsWidget(portfolioId) {
    const assessments = await RiskAssessment.findAll({
      where: { portfolio_id: portfolioId },
      order: [['assessment_date', 'ASC']],
      limit: 10
    });

    if (assessments.length === 0) return { trends: [] };

    const trends = assessments.map(a => ({
      date: a.assessment_date,
      risk_score: a.risk_score,
      volatility: a.volatility,
      sharpe_ratio: a.sharpe_ratio
    }));

    return { trends };
  }

  /**
   * Get scenarios widget data
   */
  static async getScenariosWidget(portfolioId) {
    const scenarios = await ScenarioAnalysis.findAll({
      where: { portfolio_id: portfolioId },
      order: [['created_date', 'DESC']],
      limit: 3
    });

    return {
      recent: scenarios,
      count: scenarios.length
    };
  }

  /**
   * Export dashboard data
   */
  static async exportDashboard(req, res) {
    try {
      const { portfolio_id } = req.params;
      const { format = 'json' } = req.query;

      const dashboard = await this.getDashboard({ params: { portfolio_id }, query: {} }, { json: (data) => data });

      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=risk-dashboard-${portfolio_id}.json`);
        res.json(dashboard);
      } else {
        // For other formats, you could implement PDF or Excel export
        res.status(400).json({ error: 'Unsupported export format' });
      }

    } catch (error) {
      console.error('Error exporting dashboard:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Helper methods

  static groupAlertsByType(alerts) {
    return alerts.reduce((acc, alert) => {
      acc[alert.alert_type] = (acc[alert.alert_type] || 0) + 1;
      return acc;
    }, {});
  }

  static calculateTrendDirection(values) {
    if (values.length < 2) return 'stable';

    const recent = values.slice(-5); // Last 5 values
    const older = values.slice(-10, -5); // Previous 5 values

    if (recent.length === 0 || older.length === 0) return 'stable';

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

    const change = (recentAvg - olderAvg) / Math.abs(olderAvg);

    if (change > 0.05) return 'increasing';
    if (change < -0.05) return 'decreasing';
    return 'stable';
  }

  static async getMockVaRChart(portfolioId) {
    const mockReturns = Array.from({ length: 100 }, () => (Math.random() - 0.5) * 0.1);
    return RiskVisualizationService.generateVaRChartData(mockReturns, 0.95);
  }

  static async getMockCorrelationHeatmap(portfolioId) {
    const numAssets = 5;
    const mockCorrelationMatrix = Array(numAssets).fill().map(() =>
      Array(numAssets).fill().map(() => Math.random() * 2 - 1)
    );
    for (let i = 0; i < numAssets; i++) {
      mockCorrelationMatrix[i][i] = 1;
    }
    const assetNames = ['Stocks', 'Bonds', 'Commodities', 'Real Estate', 'Cash'];
    return RiskVisualizationService.generateCorrelationHeatmapData(mockCorrelationMatrix, assetNames);
  }
}

module.exports = RiskDashboardController;