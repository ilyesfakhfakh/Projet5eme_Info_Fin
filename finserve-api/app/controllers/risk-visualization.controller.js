const RiskAssessment = require('../models/risk/risk-assessment.model');
const RiskAlert = require('../models/risk/risk-alert.model');
const RiskLimit = require('../models/risk/risk-limit.model');
const ScenarioAnalysis = require('../models/risk/scenario-analysis.model');
const RiskVisualizationService = require('../services/risk-visualization.service');
const RiskCalculatorService = require('../services/risk-calculator.service');

class RiskVisualizationController {
  /**
   * Get VaR distribution chart data
   */
  static async getVaRChart(req, res) {
    try {
      const { portfolio_id } = req.params;
      const { confidence_level = 0.95 } = req.query;

      // Get recent returns data (this would typically come from market data)
      // For now, we'll use mock data - in real implementation, fetch from database
      const mockReturns = Array.from({ length: 100 }, () =>
        (Math.random() - 0.5) * 0.1
      );

      const chartData = RiskVisualizationService.generateVaRChartData(
        mockReturns,
        parseFloat(confidence_level)
      );

      res.json({
        chart_type: 'histogram',
        title: `VaR Distribution (${(confidence_level * 100).toFixed(0)}% Confidence)`,
        data: chartData
      });

    } catch (error) {
      console.error('Error generating VaR chart:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get drawdown chart data
   */
  static async getDrawdownChart(req, res) {
    try {
      const { portfolio_id } = req.params;

      // Mock portfolio values - in real implementation, fetch historical portfolio values
      const mockPortfolioValues = Array.from({ length: 50 }, (_, i) => {
        const baseValue = 100000;
        const trend = i * 100; // Upward trend
        const volatility = (Math.random() - 0.5) * 5000; // Random volatility
        return Math.max(baseValue + trend + volatility, baseValue * 0.5); // Prevent negative values
      });

      const chartData = RiskVisualizationService.generateDrawdownChartData(mockPortfolioValues);

      res.json({
        chart_type: 'area',
        title: 'Portfolio Drawdown Over Time',
        data: chartData
      });

    } catch (error) {
      console.error('Error generating drawdown chart:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get correlation heatmap data
   */
  static async getCorrelationHeatmap(req, res) {
    try {
      const { portfolio_id } = req.params;

      // Mock correlation matrix - in real implementation, calculate from asset returns
      const numAssets = 5;
      const mockCorrelationMatrix = Array(numAssets).fill().map(() =>
        Array(numAssets).fill().map(() => Math.random() * 2 - 1)
      );

      // Make diagonal 1 (perfect correlation with itself)
      for (let i = 0; i < numAssets; i++) {
        mockCorrelationMatrix[i][i] = 1;
      }

      const assetNames = ['Stocks', 'Bonds', 'Commodities', 'Real Estate', 'Cash'];

      const heatmapData = RiskVisualizationService.generateCorrelationHeatmapData(
        mockCorrelationMatrix,
        assetNames
      );

      res.json({
        chart_type: 'heatmap',
        title: 'Asset Correlation Matrix',
        data: heatmapData
      });

    } catch (error) {
      console.error('Error generating correlation heatmap:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get risk metrics time series
   */
  static async getRiskMetricsTimeSeries(req, res) {
    try {
      const { portfolio_id } = req.params;
      const { limit = 30 } = req.query;

      const assessments = await RiskAssessment.findAll({
        where: { portfolio_id },
        order: [['assessment_date', 'ASC']],
        limit: parseInt(limit)
      });

      const chartData = RiskVisualizationService.generateRiskMetricsTimeSeries(assessments);

      res.json({
        chart_type: 'line',
        title: 'Risk Metrics Over Time',
        data: chartData,
        yAxes: [
          { id: 'y', position: 'left', title: 'Risk Score' },
          { id: 'y1', position: 'right', title: 'Metrics (%)' }
        ]
      });

    } catch (error) {
      console.error('Error generating risk metrics time series:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get stress test visualization
   */
  static async getStressTestVisualization(req, res) {
    try {
      const { scenario_id } = req.params;

      const scenario = await ScenarioAnalysis.findByPk(scenario_id);
      if (!scenario) {
        return res.status(404).json({ error: 'Scenario analysis not found' });
      }

      const chartData = RiskVisualizationService.generateStressTestChart(scenario.results);

      res.json({
        chart_type: 'bar',
        title: `Stress Test Results: ${scenario.scenario_name}`,
        data: chartData
      });

    } catch (error) {
      console.error('Error generating stress test visualization:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get risk dashboard summary
   */
  static async getRiskDashboard(req, res) {
    try {
      const { portfolio_id } = req.params;

      // Get latest assessment
      const latestAssessment = await RiskAssessment.findOne({
        where: { portfolio_id },
        order: [['assessment_date', 'DESC']]
      });

      // Get recent alerts
      const alerts = await RiskAlert.findAll({
        where: { portfolio_id },
        order: [['alert_date', 'DESC']],
        limit: 10
      });

      // Get active limits
      const limits = await RiskLimit.findAll({
        where: { portfolio_id, is_active: true }
      });

      const dashboardData = RiskVisualizationService.generateDashboardSummary(
        latestAssessment,
        alerts,
        limits
      );

      res.json({
        portfolio_id,
        dashboard: dashboardData,
        last_updated: latestAssessment?.assessment_date || null
      });

    } catch (error) {
      console.error('Error generating risk dashboard:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get alerts timeline visualization
   */
  static async getAlertsTimeline(req, res) {
    try {
      const { portfolio_id } = req.params;
      const { days = 30 } = req.query;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      const alerts = await RiskAlert.findAll({
        where: {
          portfolio_id,
          alert_date: { [require('sequelize').Op.gte]: startDate }
        },
        order: [['alert_date', 'ASC']]
      });

      const chartData = RiskVisualizationService.generateAlertsTimeline(alerts);

      res.json({
        chart_type: 'bar',
        title: `Risk Alerts Timeline (Last ${days} days)`,
        data: chartData
      });

    } catch (error) {
      console.error('Error generating alerts timeline:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get comprehensive risk report data
   */
  static async getRiskReport(req, res) {
    try {
      const { portfolio_id } = req.params;

      // Get latest assessment
      const latestAssessment = await RiskAssessment.findOne({
        where: { portfolio_id },
        order: [['assessment_date', 'DESC']]
      });

      // Get recent alerts
      const recentAlerts = await RiskAlert.findAll({
        where: { portfolio_id },
        order: [['alert_date', 'DESC']],
        limit: 5
      });

      // Get active limits
      const limits = await RiskLimit.findAll({
        where: { portfolio_id, is_active: true }
      });

      // Get recent scenarios
      const recentScenarios = await ScenarioAnalysis.findAll({
        where: { portfolio_id },
        order: [['created_date', 'DESC']],
        limit: 3
      });

      const report = {
        portfolio_id,
        generated_at: new Date(),
        summary: RiskVisualizationService.generateDashboardSummary(
          latestAssessment,
          recentAlerts,
          limits
        ),
        latest_assessment: latestAssessment,
        recent_alerts: recentAlerts,
        active_limits: limits,
        recent_scenarios: recentScenarios,
        charts: {
          var_distribution: await this.getVaRChartData(portfolio_id),
          drawdown: await this.getDrawdownChartData(portfolio_id),
          correlation: await this.getCorrelationHeatmapData(portfolio_id),
          risk_trends: await this.getRiskMetricsTimeSeriesData(portfolio_id)
        }
      };

      res.json(report);

    } catch (error) {
      console.error('Error generating risk report:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Helper methods for internal use
  static async getVaRChartData(portfolio_id) {
    const mockReturns = Array.from({ length: 100 }, () => (Math.random() - 0.5) * 0.1);
    return RiskVisualizationService.generateVaRChartData(mockReturns, 0.95);
  }

  static async getDrawdownChartData(portfolio_id) {
    const mockPortfolioValues = Array.from({ length: 50 }, (_, i) => {
      const baseValue = 100000;
      const trend = i * 100;
      const volatility = (Math.random() - 0.5) * 5000;
      return Math.max(baseValue + trend + volatility, baseValue * 0.5);
    });
    return RiskVisualizationService.generateDrawdownChartData(mockPortfolioValues);
  }

  static async getCorrelationHeatmapData(portfolio_id) {
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

  static async getRiskMetricsTimeSeriesData(portfolio_id) {
    const assessments = await RiskAssessment.findAll({
      where: { portfolio_id },
      order: [['assessment_date', 'ASC']],
      limit: 30
    });
    return RiskVisualizationService.generateRiskMetricsTimeSeries(assessments);
  }
}

module.exports = RiskVisualizationController;