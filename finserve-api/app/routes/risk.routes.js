const express = require('express');
const router = express.Router();
const riskController = require('../controllers/risk.controller');
const { authenticateJWT } = require('../middlewares/auth.middleware');

// All routes require authentication
router.use(authenticateJWT);

// Exposure calculations
router.get('/exposure', riskController.getExposure);

// Risk metrics
router.get('/metrics', riskController.getRiskMetrics);
router.post('/calculate/var', riskController.calculateVaR);
router.post('/calculate/cvar', riskController.calculateCVaR);
router.post('/calculate/sharpe', riskController.calculateSharpeRatio);
router.post('/calculate/max-drawdown', riskController.calculateMaxDrawdown);
router.post('/calculate/historical-var', riskController.calculateHistoricalVaR);

// Risk limits CRUD
router.get('/limits', riskController.getLimits);
router.post('/limits', riskController.createLimit);
router.put('/limits/:id', riskController.updateLimit);
router.delete('/limits/:id', riskController.deleteLimit);

// Alerts
router.get('/alerts', riskController.getAlerts);
router.put('/alerts/:id/acknowledge', riskController.acknowledgeAlert);

// Stress testing
router.post('/stress/run', riskController.runStressTest);
router.get('/stress/scenarios', riskController.getStressScenarios);

// Risk aggregation
router.get('/aggregate/exposure', riskController.getAggregatedExposure);
router.get('/aggregate/metrics', riskController.getAggregatedRiskMetrics);
router.post('/aggregate/var', riskController.calculateAggregatedVaR);

// Scenario validation and approval
router.post('/scenarios/:id/validate', riskController.validateScenario);
router.post('/scenarios/:id/approve', riskController.approveScenario);
router.post('/scenarios/:id/reject', riskController.rejectScenario);

// Risk monitoring and assessment
router.post('/monitor/limits', riskController.monitorRiskLimits);
router.post('/assessment/run', riskController.runRiskAssessment);

module.exports = router;