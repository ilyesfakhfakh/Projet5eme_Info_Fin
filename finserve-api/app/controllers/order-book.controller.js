const express = require('express')
const router = express.Router()

const db = require('../models')
const orderBookService = require('../services/order-book.service')

// Placer un ordre et matcher
router.post('/orders', async (req, res) => {
    try {
      const orderData = req.body

      if (!orderData.portfolio_id || !orderData.asset_id || !orderData.order_type || !orderData.side || !orderData.quantity) {
        return res.status(400).json({ message: 'Champs requis manquants' })
      }

      // Créer l'ordre
      const order = await db.orders.create(orderData)
      await orderBookService.addOrderToBook(order)

      // Matching automatique
      const matches = await orderBookService.matchOrders()
      const executions = []

      for (const m of matches) {
        const { buy, sell, quantity, price } = m

        // Créer OrderExecution pour BUY
        const executionBuy = await db.order_executions.create({
          order_id: buy.order_id,
          executed_quantity: quantity,
          execution_price: price,
          execution_time: new Date(),
          commission: quantity * price * 0.001,
          execution_type: 'MATCH',
        })

        // Créer OrderExecution pour SELL
        const executionSell = await db.order_executions.create({
          order_id: sell.order_id,
          executed_quantity: quantity,
          execution_price: price,
          execution_time: new Date(),
          commission: quantity * price * 0.001,
          execution_type: 'MATCH',
        })

        // Recharger lignes actuelles pour éviter décalage
        const buyDb = await db.orders.findByPk(buy.order_id)
        const sellDb = await db.orders.findByPk(sell.order_id)

        // Mise à jour orders
        await db.orders.update(
          { executed_quantity: Number(buyDb.executed_quantity || 0) + quantity, status: Number(buyDb.quantity) > Number(buyDb.executed_quantity || 0) + quantity ? 'PENDING' : 'EXECUTED' },
          { where: { order_id: buy.order_id } }
        )
        await db.orders.update(
          { executed_quantity: Number(sellDb.executed_quantity || 0) + quantity, status: Number(sellDb.quantity) > Number(sellDb.executed_quantity || 0) + quantity ? 'PENDING' : 'EXECUTED' },
          { where: { order_id: sell.order_id } }
        )

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
      await orderBookService.removeOrderFromBook(orderId)
      await db.orders.update({ status: 'CANCELLED' }, { where: { order_id: orderId } })
      return res.status(204).send()
    } catch (error) {
      return res.status(500).json({ message: 'Erreur serveur', error: error.message })
    }
})

// Voir le order book
router.get('/', async (req, res) => {
  const { portfolio_id: portfolioId, asset_id: assetId } = req.query
  const buyOrders = await orderBookService.getOrders('BUY', { portfolioId, assetId })
  const sellOrders = await orderBookService.getOrders('SELL', { portfolioId, assetId })
  return res.json({ buyOrders, sellOrders })
})

// Récupérer toutes les exécutions pour un ordre
router.get('/executions/:orderId', async (req, res) => {
    try {
      const orderId = req.params.orderId
      const executions = await db.order_executions.findAll({
        where: { order_id: orderId },
        order: [['execution_time', 'DESC']],
      })
      return res.json(executions)
    } catch (error) {
      return res.status(500).json({ message: 'Erreur serveur', error: error.message })
    }
})

// Get best bid for an asset
router.get('/best-bid/:assetId', async (req, res) => {
    try {
      const { assetId } = req.params
      const bid = await orderBookService.getBestBid(assetId)
      return res.json(bid)
    } catch (error) {
      return res.status(500).json({ message: 'Erreur serveur', error: error.message })
    }
})

// Get best ask for an asset
router.get('/best-ask/:assetId', async (req, res) => {
    try {
      const { assetId } = req.params
      const ask = await orderBookService.getBestAsk(assetId)
      return res.json(ask)
    } catch (error) {
      return res.status(500).json({ message: 'Erreur serveur', error: error.message })
    }
})

// Get market depth for an asset
router.get('/depth/:assetId', async (req, res) => {
    try {
      const { assetId } = req.params
      const { side, levels = 10 } = req.query
      if (!side || !['BUY', 'SELL'].includes(side)) {
        return res.status(400).json({ message: 'side doit être BUY ou SELL' })
      }
      const depth = await orderBookService.getDepth(assetId, side, parseInt(levels))
      return res.json(depth)
    } catch (error) {
      return res.status(500).json({ message: 'Erreur serveur', error: error.message })
    }
})

// Get spread for an asset
router.get('/spread/:assetId', async (req, res) => {
    try {
      const { assetId } = req.params
      const spread = await orderBookService.getSpread(assetId)
      return res.json({ assetId, spread })
    } catch (error) {
      return res.status(500).json({ message: 'Erreur serveur', error: error.message })
    }
})

// Get top of book for an asset
router.get('/top/:assetId', async (req, res) => {
    try {
      const { assetId } = req.params
      const top = await orderBookService.getTopOfBook(assetId)
      return res.json(top)
    } catch (error) {
      return res.status(500).json({ message: 'Erreur serveur', error: error.message })
    }
})

// Get market snapshot for an asset
router.get('/snapshot/:assetId', async (req, res) => {
    try {
      const { assetId } = req.params
      const snapshot = await orderBookService.snapshot(assetId)
      return res.json(snapshot)
    } catch (error) {
      return res.status(500).json({ message: 'Erreur serveur', error: error.message })
    }
})

// Purge stale orders
router.post('/purge-stale', async (req, res) => {
    try {
      const { cutoffDate } = req.body
      if (!cutoffDate) {
        return res.status(400).json({ message: 'cutoffDate est requis' })
      }
      const result = await orderBookService.purgeStaleOrders(new Date(cutoffDate))
      return res.json({ message: 'Ordres obsolètes supprimés', count: result[0] })
    } catch (error) {
      return res.status(500).json({ message: 'Erreur serveur', error: error.message })
    }
})

// Reopen an order
router.put('/reopen/:orderId', async (req, res) => {
    try {
      const { orderId } = req.params
      const result = await orderBookService.reopenOrder(orderId)
      if (result[0] === 0) {
        return res.status(404).json({ message: 'Ordre introuvable' })
      }
      return res.json({ message: 'Ordre rouvert', count: result[0] })
    } catch (error) {
      return res.status(500).json({ message: 'Erreur serveur', error: error.message })
    }
})

// Cancel expired orders based on Time-In-Force
router.post('/cancel-expired', async (req, res) => {
  try {
    const count = await orderBookService.cancelExpiredOrders()
    return res.json({ message: 'Ordres expirés annulés', count })
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message })
  }
})

// Force matching cycle now (manual trigger for testing)
router.post('/match-now', async (req, res) => {
  try {
    const summary = await orderBookService.matchNow()
    return res.json({ message: 'Matching effectué', ...summary })
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message })
  }
})

module.exports = router;