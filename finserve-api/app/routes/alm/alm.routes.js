module.exports = (app) => {
  const express = require('express');
  const router = express.Router();
  const almController = require('../../controllers/alm/alm.controller');

  console.log('ALM routes loaded');
  console.log('ALM controller:', !!almController);
  console.log('getYieldCurves function:', !!almController.getYieldCurves);

  app.use('/api/v1/alm', router);

  // Test route to verify ALM routes are loaded
  router.get('/test', (req, res) => {
    res.json({ message: 'ALM routes are working!', timestamp: new Date().toISOString() });
  });

  // Debug route
  router.get('/debug', (req, res) => {
    console.log('=== ALM DEBUG ROUTE CALLED ===');
    res.json({ message: 'Debug route works', timestamp: new Date().toISOString() });
  });

  // TODO: Implémenter le middleware d'authentification selon votre système
  // const { authenticateToken } = require('../auth/auth.middleware');

  // Yield curve routes
  router.post('/yield-curves', almController.createYieldCurve);
  router.post('/yield-curves/generate', almController.generateYieldCurve);
  router.get('/yield-curves', (req, res) => almController.getYieldCurves(req, res));
  router.get('/yield-curves/:id', (req, res) => almController.getYieldCurveById(req, res));

  // Cashflow projections
  router.post('/cashflow-projections', almController.projectCashflows);

  // PV calculations
  router.post('/pv-calculation', almController.calculatePV);

  // Duration and convexity
  router.post('/duration-convexity', almController.calculateDurationConvexity);

  // Liquidity gap
  router.post('/liquidity-gap', almController.calculateLiquidityGap);

  // Interest rate sensitivity
  router.post('/interest-rate-sensitivity', almController.calculateInterestRateSensitivity);

  // Liquidity ratios
  router.get('/liquidity-ratios/:portfolio_id', almController.calculateLiquidityRatios);

  // Duration gap
  router.get('/duration-gap/:portfolio_id', almController.calculateDurationGap);
};