const express = require('express')
const router = express.Router()
const portfolioService = require('../services/portfolio.service')

// Get portfolio summary with current valuation
router.get('/:portfolioId/summary', async (req, res) => {
  try {
    const { portfolioId } = req.params
    const summary = await portfolioService.getPortfolioSummary(portfolioId)
    return res.json(summary)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
  }
})

// Calculate and update portfolio value
router.post('/:portfolioId/calculate-value', async (req, res) => {
  try {
    const { portfolioId } = req.params
    const valuation = await portfolioService.calculatePortfolioValue(portfolioId)
    return res.json(valuation)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
  }
})

// Update all portfolio values (admin endpoint)
router.post('/update-all-values', async (req, res) => {
  try {
    const results = await portfolioService.updateAllPortfolioValues()
    return res.json({
      message: 'Portfolio values updated',
      results
    })
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
  }
})

module.exports = router