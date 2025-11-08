const { Op } = require('sequelize')
const db = require('../models')
const orderBookService = require('./order-book.service')

async function validateOrder(portfolioId, assetId, side, quantity, price, commission = 0) {
  if (side === 'BUY') {
    // Check if portfolio has enough cash
    const portfolio = await db.portfolios.findByPk(portfolioId)
    if (!portfolio) throw new Error('Portfolio not found')

    const totalCost = Number(quantity) * Number(price) + Number(commission)
    if (Number(portfolio.current_balance) < totalCost) {
      throw new Error(`Insufficient funds. Required: ${totalCost}, Available: ${portfolio.current_balance}`)
    }
  } else if (side === 'SELL') {
    // Check if portfolio has enough position
    const position = await db.positions.findOne({
      where: { portfolio_id: portfolioId, asset_id: assetId }
    })

    if (!position || Number(position.quantity) < Number(quantity)) {
      const available = position ? position.quantity : 0
      throw new Error(`Insufficient position. Required: ${quantity}, Available: ${available}`)
    }
  }
}

async function updateStatus(orderId, status) {
  return db.orders.update({ status }, { where: { order_id: orderId } })
}

async function addExecutedQuantity(orderId, quantityToAdd) {
  const order = await db.orders.findByPk(orderId)
  if (!order) return [0]
  const newExecuted = Number(order.executed_quantity || 0) + Number(quantityToAdd)
  const newStatus = Number(order.quantity) > newExecuted ? 'PENDING' : 'EXECUTED'
  return db.orders.update({ executed_quantity: newExecuted, status: newStatus }, { where: { order_id: orderId } })
}

async function replaceOrder(orderId, updates) {
  const order = await db.orders.findByPk(orderId)
  if (!order) return [0]
  
  // Update order in database
  const result = await db.orders.update(updates, { where: { order_id: orderId } })
  
  // Sync with order book
  if (updates.quantity || updates.price) {
    await orderBookService.removeOrderFromBook(orderId)
    const updatedOrder = await db.orders.findByPk(orderId)
    await orderBookService.addOrderToBook(updatedOrder)
  }
  
  return result
}

async function cancelAll(portfolioId = null, assetId = null) {
  const where = { status: { [Op.in]: ['PENDING', 'PARTIALLY_FILLED'] } }
  if (portfolioId) where.portfolio_id = portfolioId
  if (assetId) where.asset_id = assetId
  
  const orders = await db.orders.findAll({ where })
  const orderIds = orders.map(o => o.order_id)
  
  // Remove from order book
  for (const orderId of orderIds) {
    await orderBookService.removeOrderFromBook(orderId)
  }
  
  // Update status in database
  return db.orders.update({ status: 'CANCELLED' }, { where })
}

async function getOpenOrders(portfolioId = null, assetId = null) {
  const where = { status: { [Op.in]: ['PENDING', 'PARTIALLY_FILLED'] } }
  if (portfolioId) where.portfolio_id = portfolioId
  if (assetId) where.asset_id = assetId
  
  return db.orders.findAll({
    where,
    order: [['createdAt', 'DESC']],
    include: [
      { model: db.assets, as: 'asset' },
      { model: db.portfolios, as: 'portfolio' }
    ]
  })
}

async function getOrderHistory(portfolioId, { from, to, status = null }) {
  const where = { portfolio_id: portfolioId }
  if (from) where.createdAt = { ...where.createdAt, [Op.gte]: new Date(from) }
  if (to) where.createdAt = { ...where.createdAt, [Op.lte]: new Date(to) }
  if (status) where.status = status
  
  return db.orders.findAll({
    where,
    order: [['createdAt', 'DESC']],
    include: [
      { model: db.assets, as: 'asset' },
      { model: db.portfolios, as: 'portfolio' },
      { model: db.order_executions, as: 'executions' }
    ]
  })
}

async function computeFillRatio(orderId) {
  const order = await db.orders.findByPk(orderId)
  if (!order) return null
  
  const executed = Number(order.executed_quantity || 0)
  const total = Number(order.quantity)
  return total > 0 ? executed / total : 0
}

module.exports = {
  validateOrder,
  updateStatus,
  addExecutedQuantity,
  replaceOrder,
  cancelAll,
  getOpenOrders,
  getOrderHistory,
  computeFillRatio,
}