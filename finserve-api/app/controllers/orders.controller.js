const express = require('express')
const router = express.Router()

const db = require('../models')
const Orders = db.orders
const orderService = require('../services/order.service')

router.post('/', async (req, res) => {
  try {
    const {
      portfolio_id,
      asset_id,
      order_type,
      side,
      quantity,
      price,
      stop_price,
      time_in_force,
      status,
      creation_date,
      execution_date,
      executed_quantity,
      executed_price,
    } = req.body

    if (!portfolio_id || !asset_id || !order_type || !side || !quantity) {
      return res.status(400).json({ message: 'Champs requis manquants' })
    }

    // Validate financial constraints
    try {
      await orderService.validateOrder(portfolio_id, asset_id, side, quantity, price || 0)
    } catch (validationError) {
      return res.status(400).json({ message: validationError.message })
    }

    const created = await Orders.create({
      portfolio_id,
      asset_id,
      order_type,
      side,
      quantity,
      price,
      stop_price,
      time_in_force,
      status,
      creation_date,
      execution_date,
      executed_quantity,
      executed_price,
    })

    return res.status(201).json(created)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
  }
})

router.get('/', async (req, res) => {
  try {
    const { portfolio_id, asset_id, status, side } = req.query
    const where = {}
    if (portfolio_id) where.portfolio_id = portfolio_id
    if (asset_id) where.asset_id = asset_id
    if (status) where.status = status
    if (side) where.side = side

    const items = await Orders.findAll({ where, order: [['createdAt', 'DESC']] })
    return res.json(items)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const item = await Orders.findByPk(id)
    if (!item) return res.status(404).json({ message: 'Ordre introuvable' })
    return res.json(item)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
  }
})
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const [count] = await Orders.update(req.body, { where: { order_id: id } })
    if (count === 0) return res.status(404).json({ message: 'Ordre introuvable ou pas de modification' })
    const updated = await Orders.findByPk(id)
    return res.json(updated)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
  }
})

  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params
      const count = await Orders.destroy({ where: { order_id: id } })
      if (count === 0) return res.status(404).json({ message: 'Ordre introuvable' })
      return res.status(204).send()
    } catch (error) {
      return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
    }
  })

  router.put('/:id/replace', async (req, res) => {
    try {
      const { id } = req.params
      const updates = req.body

      if (!updates.quantity && !updates.price) {
        return res.status(400).json({ message: 'quantity ou price requis' })
      }

      const result = await orderService.replaceOrder(id, updates)
      if (result[0] === 0) return res.status(404).json({ message: 'Ordre introuvable' })

      const updated = await Orders.findByPk(id)
      return res.json(updated)
    } catch (error) {
      return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
    }
  })

  router.delete('/cancel-all', async (req, res) => {
    try {
      const { portfolio_id, asset_id } = req.query
      const result = await orderService.cancelAll(portfolio_id, asset_id)
      return res.json({ message: 'Ordres annulés', count: result[0] })
    } catch (error) {
      return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
    }
  })

  // Get open orders
  router.get('/open', async (req, res) => {
    try {
      const { portfolio_id, asset_id } = req.query
      const orders = await orderService.getOpenOrders(portfolio_id, asset_id)
      return res.json(orders)
    } catch (error) {
      return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
    }
  })

  // Get order history
  router.get('/history/:portfolioId', async (req, res) => {
    try {
      const { portfolioId } = req.params
      const { from, to, status } = req.query
      const orders = await orderService.getOrderHistory(portfolioId, { from, to, status })
      return res.json(orders)
    } catch (error) {
      return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
    }
  })




  // Compute fill ratio for an order
  router.get('/:id/fill-ratio', async (req, res) => {
    try {
      const { id } = req.params
      const ratio = await orderService.computeFillRatio(id)
      if (ratio === null) return res.status(404).json({ message: 'Ordre introuvable' })
      return res.json({ order_id: id, fill_ratio: ratio })
    } catch (error) {
      return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
    }
  })

  module.exports = router