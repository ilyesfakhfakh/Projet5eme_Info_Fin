const express = require('express')
const router = express.Router()

const db = require('../models')
const TradingStrategies = db.trading_strategies
const tradingStrategyService = require('../services/trading-strategy.service')

// Create a new trading strategy
router.post('/', async (req, res) => {
  try {
    const {
      user_id,
      strategy_name,
      description,
      parameters,
      is_active,
      creation_date,
      last_execution_date,
      performance,
    } = req.body

    if (!user_id || !strategy_name) {
      return res.status(400).json({ message: 'user_id et strategy_name sont requis' })
    }

    const created = await TradingStrategies.create({
      user_id,
      strategy_name,
      description,
      parameters,
      is_active,
      creation_date,
      last_execution_date,
      performance,
    })

    return res.status(201).json(created)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
  }
})

// List trading strategies (filters optional)
router.get('/', async (req, res) => {
  try {
    const { user_id, is_active } = req.query
    const where = {}
    if (user_id) where.user_id = user_id
    if (typeof is_active !== 'undefined') where.is_active = String(is_active) === 'true'

    const items = await TradingStrategies.findAll({ where, order: [['createdAt', 'DESC']] })
    return res.json(items)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
  }
})

// Get one trading strategy by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const item = await TradingStrategies.findByPk(id)
    if (!item) return res.status(404).json({ message: 'Stratégie introuvable' })
    return res.json(item)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
  }
})

// Update a trading strategy
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const [count] = await TradingStrategies.update(req.body, { where: { strategy_id: id } })
    if (count === 0) return res.status(404).json({ message: 'Stratégie introuvable ou pas de modification' })
    const updated = await TradingStrategies.findByPk(id)
    return res.json(updated)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
  }
})

// Delete a trading strategy
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const count = await TradingStrategies.destroy({ where: { strategy_id: id } })
    if (count === 0) return res.status(404).json({ message: 'Stratégie introuvable' })
    return res.status(204).send()
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
  }
})

// Backtest a strategy
router.post('/:id/backtest', async (req, res) => {
  try {
    const { id } = req.params
    const { from, to } = req.body

    if (!from || !to) {
      return res.status(400).json({ message: 'from et to sont requis' })
    }

    const results = await tradingStrategyService.backtest(id, { from, to })
    if (!results) return res.status(404).json({ message: 'Stratégie introuvable' })

    return res.json(results)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
  }
})

// Get performance history
router.get('/:id/performance', async (req, res) => {
  try {
    const { id } = req.params
    const performance = await tradingStrategyService.getPerformanceHistory(id)
    if (!performance) return res.status(404).json({ message: 'Stratégie introuvable' })

    return res.json(performance)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
  }
})

// Activate a strategy
router.put('/:id/activate', async (req, res) => {
  try {
    const { id } = req.params
    const result = await tradingStrategyService.activateStrategy(id)
    if (result[0] === 0) return res.status(404).json({ message: 'Stratégie introuvable' })

    return res.json({ message: 'Stratégie activée', count: result[0] })
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
  }
})

// Run strategy once
router.post('/:id/run', async (req, res) => {
  try {
    const { id } = req.params
    const result = await tradingStrategyService.runStrategyOnce(id)
    if (!result) return res.status(404).json({ message: 'Stratégie introuvable' })

    return res.json(result)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
  }
})

module.exports = router