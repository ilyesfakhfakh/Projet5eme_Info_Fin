const { Op } = require('sequelize')
const db = require('../models')

async function getExecutionsByOrder(orderId) {
  return db.order_executions.findAll({
    where: { order_id: orderId },
    order: [['execution_time', 'DESC']],
  })
}

async function createExecution(data) {
  return db.order_executions.create(data)
}

async function getExecutionsInRange(assetId, from, to) {
  const where = {
    execution_time: {
      [Op.gte]: new Date(from),
      [Op.lte]: new Date(to),
    },
  }

  // Join with orders to filter by asset_id
  return db.order_executions.findAll({
    where,
    include: [
      {
        model: db.orders,
        as: 'order',
        where: { asset_id: assetId },
        attributes: ['asset_id'],
      },
    ],
    order: [['execution_time', 'DESC']],
  })
}

async function getVWAP(assetId, from, to) {
  const result = await db.order_executions.findOne({
    attributes: [
      [db.Sequelize.fn('SUM', db.Sequelize.literal('executed_quantity * execution_price')), 'totalValue'],
      [db.Sequelize.fn('SUM', db.Sequelize.col('executed_quantity')), 'totalQuantity'],
    ],
    where: {
      execution_time: {
        [Op.gte]: new Date(from),
        [Op.lte]: new Date(to),
      },
    },
    include: [
      {
        model: db.orders,
        as: 'order',
        where: { asset_id: assetId },
        attributes: [],
      },
    ],
    raw: true,
  })

  const totalValue = Number(result.totalValue || 0)
  const totalQuantity = Number(result.totalQuantity || 0)

  return totalQuantity > 0 ? totalValue / totalQuantity : 0
}

async function getLastTrade(assetId) {
  return db.order_executions.findOne({
    where: {
      execution_time: {
        [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
    },
    include: [
      {
        model: db.orders,
        as: 'order',
        where: { asset_id: assetId },
        attributes: ['asset_id'],
      },
    ],
    order: [['execution_time', 'DESC']],
  })
}

async function aggregateByOrder(orderId) {
  const result = await db.order_executions.findOne({
    attributes: [
      [db.Sequelize.fn('SUM', db.Sequelize.col('executed_quantity')), 'totalQty'],
      [db.Sequelize.fn('AVG', db.Sequelize.col('execution_price')), 'avgPrice'],
      [db.Sequelize.fn('SUM', db.Sequelize.col('commission')), 'totalFees'],
    ],
    where: { order_id: orderId },
    raw: true,
  })

  return {
    totalQty: Number(result.totalQty || 0),
    avgPrice: Number(result.avgPrice || 0),
    fees: Number(result.totalFees || 0),
  }
}

module.exports = {
  getExecutionsByOrder,
  createExecution,
  getExecutionsInRange,
  getVWAP,
  getLastTrade,
  aggregateByOrder,
}