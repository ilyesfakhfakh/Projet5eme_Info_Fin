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
  // Get executions for orders with this asset_id in the time range using raw SQL
  const [results] = await db.sequelize.query(`
    SELECT oe.*
    FROM order_executions oe
    INNER JOIN orders o ON oe.order_id = o.order_id
    WHERE o.asset_id = :assetId
      AND oe.execution_time >= :from
      AND oe.execution_time <= :to
    ORDER BY oe.execution_time DESC
  `, {
    replacements: { 
      assetId, 
      from: new Date(from), 
      to: new Date(to) 
    },
    type: db.Sequelize.QueryTypes.SELECT
  })

  return results
}

async function getVWAP(assetId, from, to) {
  // Get all executions for orders with this asset_id in the time range
  const [results] = await db.sequelize.query(`
    SELECT 
      SUM(oe.executed_quantity * oe.execution_price) as totalValue,
      SUM(oe.executed_quantity) as totalQuantity
    FROM order_executions oe
    INNER JOIN orders o ON oe.order_id = o.order_id
    WHERE o.asset_id = :assetId
      AND oe.execution_time >= :from
      AND oe.execution_time <= :to
  `, {
    replacements: { 
      assetId, 
      from: new Date(from), 
      to: new Date(to) 
    },
    type: db.Sequelize.QueryTypes.SELECT
  })

  const result = results[0] || {}
  const totalValue = Number(result.totalValue || 0)
  const totalQuantity = Number(result.totalQuantity || 0)

  return totalQuantity > 0 ? totalValue / totalQuantity : 0
}

async function getLastTrade(assetId) {
  // Get the most recent execution for this asset using raw SQL
  const [results] = await db.sequelize.query(`
    SELECT oe.*
    FROM order_executions oe
    INNER JOIN orders o ON oe.order_id = o.order_id
    WHERE o.asset_id = :assetId
      AND oe.execution_time >= :since
    ORDER BY oe.execution_time DESC
    LIMIT 1
  `, {
    replacements: { 
      assetId, 
      since: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
    },
    type: db.Sequelize.QueryTypes.SELECT
  })

  return results[0] || null
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