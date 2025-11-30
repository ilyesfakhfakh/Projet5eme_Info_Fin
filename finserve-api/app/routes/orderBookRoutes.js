const express = require('express')
const { Op } = require('sequelize')
const router = express.Router()
const orderBookController = require('../controllers/order-book.controller')

// Récupérer les ordres
router.get('/orders', async (req, res) => {
  try {
    const { portfolio_id, asset_id } = req.query
    const where = {}
    if (portfolio_id) where.portfolio_id = portfolio_id
    if (asset_id) where.asset_id = asset_id
    where.status = { [Op.ne]: 'CANCELLED' } // Exclure les ordres annulés

    const orders = await require('../models').orders.findAll({
      where,
      order: [['creation_date', 'DESC']],
    })
    return res.json(orders)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message })
  }
})

// Placer un ordre et matcher
router.post('/orders', async (req, res) => {
  try {
    const orderData = req.body

    if (!orderData.portfolio_id || !orderData.asset_id || !orderData.order_type || !orderData.side || !orderData.quantity) {
      return res.status(400).json({ message: 'Champs requis manquants' })
    }

    // Créer l'ordre
    const order = await require('../models').orders.create(orderData)
    await require('../services/order-book.service').addOrderToBook(order)

    // Matching automatique
    const matches = await require('../services/order-book.service').matchOrders()
    const executions = []

    for (const m of matches) {
      const { buy, sell, quantity, price } = m

      // Créer OrderExecution pour BUY
      const executionBuy = await require('../models').order_executions.create({
        order_id: buy.order_id,
        executed_quantity: quantity,
        execution_price: price,
        execution_time: new Date(),
        commission: quantity * price * 0.001,
        execution_type: 'MATCH',
      })

      // Créer OrderExecution pour SELL
      const executionSell = await require('../models').order_executions.create({
        order_id: sell.order_id,
        executed_quantity: quantity,
        execution_price: price,
        execution_time: new Date(),
        commission: quantity * price * 0.001,
        execution_type: 'MATCH',
      })

      executions.push(executionBuy, executionSell)
    }

    return res.status(201).json({ order, executions })
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message })
  }
})

// Annuler un ordre
router.delete('/orders/:id', async (req, res) => {
  try {
    const orderId = req.params.id
    await require('../services/order-book.service').removeOrderFromBook(orderId)
    await require('../models').orders.update({ status: 'CANCELLED' }, { where: { order_id: orderId } })
    return res.status(204).send()
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message })
  }
})

// Voir le order book (route principale avec et sans slash)
router.get(['/', '/order-book'], async (req, res) => {
  try {
    const { portfolio_id, asset_id } = req.query
    const buyOrders = await require('../services/order-book.service').getOrders('BUY', { portfolioId: portfolio_id, assetId: asset_id })
    const sellOrders = await require('../services/order-book.service').getOrders('SELL', { portfolioId: portfolio_id, assetId: asset_id })
    return res.json({ buyOrders, sellOrders })
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message })
  }
})

// Voir les exécutions d'un ordre
router.get('/executions/:orderId', async (req, res) => {
  try {
    const orderId = req.params.orderId
    const executions = await require('../models').order_executions.findAll({
      where: { order_id: orderId },
      order: [['execution_time', 'DESC']],
    })
    return res.json(executions)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message })
  }
})

// Market data endpoints
router.get(['/best-bid/:assetId', '/best-bid/', '/best-bid'], async (req, res) => {
  try {
    const assetId = req.params.assetId || req.query.asset_id
    if (!assetId) {
      return res.status(400).json({ message: 'asset_id est requis' })
    }
    const bid = await require('../services/order-book.service').getBestBid(assetId)
    return res.json(bid)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message })
  }
})

router.get(['/best-ask/:assetId', '/best-ask/', '/best-ask'], async (req, res) => {
  try {
    const assetId = req.params.assetId || req.query.asset_id
    if (!assetId) {
      return res.status(400).json({ message: 'asset_id est requis' })
    }
    const ask = await require('../services/order-book.service').getBestAsk(assetId)
    return res.json(ask)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message })
  }
})

router.get('/depth/:assetId', async (req, res) => {
  try {
    const { assetId } = req.params
    const { side, levels = 10 } = req.query
    if (!side || !['BUY', 'SELL'].includes(side)) {
      return res.status(400).json({ message: 'side doit être BUY ou SELL' })
    }
    const depth = await require('../services/order-book.service').getDepth(assetId, side, parseInt(levels))
    return res.json(depth)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message })
  }
})

router.get(['/spread/:assetId', '/spread/', '/spread'], async (req, res) => {
  try {
    const assetId = req.params.assetId || req.query.asset_id
    if (!assetId) {
      return res.status(400).json({ message: 'asset_id est requis' })
    }
    const spread = await require('../services/order-book.service').getSpread(assetId)
    return res.json({ assetId, spread })
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message })
  }
})

router.get('/top/:assetId', async (req, res) => {
  try {
    const { assetId } = req.params
    const top = await require('../services/order-book.service').getTopOfBook(assetId)
    return res.json(top)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message })
  }
})

router.get('/snapshot/:assetId', async (req, res) => {
  try {
    const { assetId } = req.params
    const snapshot = await require('../services/order-book.service').snapshot(assetId)
    return res.json(snapshot)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message })
  }
})

// Get all executions
router.get('/executions', async (req, res) => {
  try {
    const executions = await require('../models').order_executions.findAll({
      order: [['execution_time', 'DESC']],
    })
    return res.json(executions)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message })
  }
})

// Match orders now
router.post('/match-now', async (req, res) => {
  try {
    const matches = await require('../services/order-book.service').matchOrders()
    return res.json({ message: 'Matching effectué', matches: matches.length })
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message })
  }
})

// Cancel expired orders
router.post('/cancel-expired', async (req, res) => {
  try {
    const result = await require('../services/order-book.service').cancelExpiredOrders()
    return res.json({ message: 'Ordres expirés annulés', count: result[0] })
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message })
  }
})

// Order management
router.post('/purge-stale', async (req, res) => {
  try {
    const { cutoffDate } = req.body
    if (!cutoffDate) {
      return res.status(400).json({ message: 'cutoffDate est requis' })
    }
    const result = await require('../services/order-book.service').purgeStaleOrders(new Date(cutoffDate))
    return res.json({ message: 'Ordres obsolètes supprimés', count: result[0] })
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message })
  }
})

router.put('/reopen/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params
    const result = await require('../services/order-book.service').reopenOrder(orderId)
    if (result[0] === 0) {
      return res.status(404).json({ message: 'Ordre introuvable' })
    }
    return res.json({ message: 'Ordre rouvert', count: result[0] })
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message })
  }
})

module.exports = router