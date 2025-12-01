module.exports = (app) => {
  const express = require('express');
  const router = express.Router();
  const portfolioController = require('../controllers/portfolio.controller');
  const positionsController = require('../controllers/positions.controller');

  console.log('Portfolio routes loaded');

  app.use('/api/v1/portfolios', router);

  // Créer un portfolio
  router.post('/', portfolioController.create);

  // Lire un portfolio
  router.get('/:id', portfolioController.findOne);

  // Mettre à jour un portfolio
  router.put('/:id', portfolioController.update);

  // Supprimer un portfolio
  router.delete('/:id', portfolioController.delete);

  // Lister les portfolios avec filtres
  router.get('/', portfolioController.findAll);

  // Obtenir les soldes d'un portfolio
  router.get('/:id/balances', portfolioController.getPortfolioBalances);

  // Gestion Multi-Devises Avancée
  router.get('/:id/currency-exposure', portfolioController.getCurrencyExposure);

  // Analyse de Performance Détaillée
  router.get('/:id/performance', portfolioController.getPerformance);

  // Allocation d'Actifs Intelligente
  router.post('/:id/rebalance', portfolioController.rebalance);
  router.get('/:id/optimize', portfolioController.optimize);

  // Refresh portfolio calculations
  router.post('/:id/refresh', portfolioController.refresh);
  router.post('/refresh', portfolioController.refresh);

  // Position management routes
  router.post('/:portfolio_id/positions', positionsController.create);
  router.get('/:portfolio_id/positions', positionsController.findByPortfolio);
  router.get('/positions/:id', positionsController.findOne);
  router.put('/positions/:id', positionsController.update);
  router.patch('/positions/:id/archive', positionsController.archive);
  router.delete('/positions/:id', positionsController.delete);
  router.get('/positions/:id/performance', positionsController.getPerformance);
};