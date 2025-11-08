const express = require('express')
const router = express.Router()

const db = require('../models')
const OrderExecution = db.order_executions
const orderExecutionService = require('../services/order-execution.service')

// Create a new order execution
router.post('/', async (req, res) => {
  try {
    const {
      order_id,
      executed_quantity,
      execution_price,
      execution_time,
      commission,
      execution_type,
    } = req.body

    if (!order_id) {
      return res.status(400).json({ message: 'order_id est requis' })
    }

    const created = await OrderExecution.create({
      order_id,
      executed_quantity,
      execution_price,
      execution_time,
      commission,
      execution_type,
    })

    return res.status(201).json(created)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
  }
})

// Retrieve all order executions (optional filter by order_id)
router.get('/', async (req, res) => {
  try {
    const { order_id } = req.query
    const where = {}
    if (order_id) where.order_id = order_id

    const items = await OrderExecution.findAll({ where, order: [['createdAt', 'DESC']] })
    return res.json(items)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
  }
})

// Retrieve one order execution by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const item = await OrderExecution.findByPk(id)
    if (!item) return res.status(404).json({ message: 'Exécution introuvable' })
    return res.json(item)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
  }
})

// Update an order execution
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const [count] = await OrderExecution.update(req.body, { where: { execution_id: id } })
    if (count === 0) return res.status(404).json({ message: "Exécution introuvable ou pas de modification" })
    const updated = await OrderExecution.findByPk(id)
    return res.json(updated)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
  }
})

// Delete an order execution
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const count = await OrderExecution.destroy({ where: { execution_id: id } })
    if (count === 0) return res.status(404).json({ message: 'Exécution introuvable' })
    return res.status(204).send()
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
  }
})

// Get executions in range for an asset
router.get('/range/:assetId', async (req, res) => {
  try {
    const { assetId } = req.params
    const { from, to } = req.query

    if (!from || !to) {
      return res.status(400).json({ message: 'from et to sont requis' })
    }

    const executions = await orderExecutionService.getExecutionsInRange(assetId, from, to)
    return res.json(executions)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
  }
})

// Get VWAP for an asset in range
router.get('/vwap/:assetId', async (req, res) => {
  try {
    const { assetId } = req.params
    const { from, to } = req.query

    if (!from || !to) {
      return res.status(400).json({ message: 'from et to sont requis' })
    }

    const vwap = await orderExecutionService.getVWAP(assetId, from, to)
    return res.json({ assetId, vwap, from, to })
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
  }
})

// Get last trade for an asset
router.get('/last-trade/:assetId', async (req, res) => {
  try {
    const { assetId } = req.params
    const lastTrade = await orderExecutionService.getLastTrade(assetId)
    return res.json(lastTrade)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
  }
})

// Aggregate executions by order
router.get('/aggregate/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params
    const aggregate = await orderExecutionService.aggregateByOrder(orderId)
    return res.json({ orderId, ...aggregate })
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
  }
})

module.exports = router