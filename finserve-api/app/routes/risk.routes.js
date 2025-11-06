const express = require('express');
const router = express.Router();

// Import controllers
const RiskController = require('../controllers/risk.controller');
const RiskVisualizationController = require('../controllers/risk-visualization.controller');
const RiskLimitsController = require('../controllers/risk-limits.controller');
const RiskDashboardController = require('../controllers/risk-dashboard.controller');

// Risk Assessment Routes
router.post('/portfolios/:portfolio_id/assessment', RiskController.calculateRiskAssessment);
router.get('/portfolios/:portfolio_id/assessments', RiskController.getRiskAssessments);

// Risk Alerts Routes
router.get('/portfolios/:portfolio_id/alerts', RiskController.getRiskAlerts);
router.put('/alerts/read', RiskController.markAlertsAsRead);

// Scenario Analysis Routes
router.post('/portfolios/:portfolio_id/scenarios', RiskController.performScenarioAnalysis);
router.get('/portfolios/:portfolio_id/scenarios', RiskController.getScenarioAnalyses);

// Risk Limits Routes
router.get('/portfolios/:portfolio_id/limits', RiskLimitsController.getRiskLimits);
router.post('/portfolios/:portfolio_id/limits', RiskLimitsController.setRiskLimit);
router.put('/portfolios/:portfolio_id/limits/bulk', RiskLimitsController.bulkUpdateLimits);
router.delete('/limits/:limit_id', RiskLimitsController.deactivateLimit);
router.get('/portfolios/:portfolio_id/limits/breaches', RiskLimitsController.getLimitBreaches);
router.put('/portfolios/:portfolio_id/limits/reset', RiskLimitsController.resetLimitAlerts);
router.get('/limits/templates', RiskLimitsController.getLimitTemplates);
router.post('/portfolios/:portfolio_id/limits/templates', RiskLimitsController.applyLimitTemplate);
router.get('/portfolios/:portfolio_id/limits/compliance', RiskLimitsController.getComplianceReport);

// Risk Monitoring Routes
router.post('/portfolios/:portfolio_id/monitoring/toggle', RiskLimitsController.toggleMonitoring);
router.get('/monitoring/status', RiskLimitsController.getMonitoringStatus);
router.post('/portfolios/:portfolio_id/monitoring/check', RiskLimitsController.triggerRiskCheck);

// Visualization Routes
router.get('/portfolios/:portfolio_id/charts/var', RiskVisualizationController.getVaRChart);
router.get('/portfolios/:portfolio_id/charts/drawdown', RiskVisualizationController.getDrawdownChart);
router.get('/portfolios/:portfolio_id/charts/correlation', RiskVisualizationController.getCorrelationHeatmap);
router.get('/portfolios/:portfolio_id/charts/metrics', RiskVisualizationController.getRiskMetricsTimeSeries);
router.get('/scenarios/:scenario_id/charts/stress-test', RiskVisualizationController.getStressTestVisualization);
router.get('/portfolios/:portfolio_id/charts/alerts-timeline', RiskVisualizationController.getAlertsTimeline);
router.get('/portfolios/:portfolio_id/reports/comprehensive', RiskVisualizationController.getRiskReport);

// Dashboard Routes
router.get('/portfolios/:portfolio_id/dashboard', RiskDashboardController.getDashboard);
router.get('/portfolios/:portfolio_id/dashboard/widgets', RiskDashboardController.getDashboardWidgets);
router.get('/portfolios/:portfolio_id/dashboard/export', RiskDashboardController.exportDashboard);

// Health check route
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Risk Management API',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;