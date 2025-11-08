const { Op } = require('sequelize')
const db = require('../models')

async function getActiveStrategies(userId) {
  const where = { is_active: true }
  if (userId) where.user_id = userId
  return db.trading_strategies.findAll({ where, order: [['createdAt', 'DESC']] })
}

async function updatePerformance(strategyId, perfData) {
  return db.trading_strategies.update({ performance: perfData }, { where: { strategy_id: strategyId } })
}

async function deactivateStrategy(strategyId) {
  return db.trading_strategies.update({ is_active: false }, { where: { strategy_id: strategyId } })
}

async function backtest(strategyId, { from, to }) {
  const strategy = await db.trading_strategies.findByPk(strategyId)
  if (!strategy) return null

  // Get orders created by this strategy in the date range
  const orders = await db.orders.findAll({
    where: {
      created_at: {
        [Op.gte]: new Date(from),
        [Op.lte]: new Date(to),
      },
    },
    include: [
      {
        model: db.order_executions,
        as: 'executions',
        required: false,
      },
    ],
  })

  // Calculate basic metrics
  const totalOrders = orders.length
  const executedOrders = orders.filter(o => o.status === 'EXECUTED').length
  const cancelledOrders = orders.filter(o => o.status === 'CANCELLED').length

  const totalVolume = orders.reduce((sum, o) => sum + Number(o.executed_quantity || 0), 0)
  const totalValue = orders.reduce((sum, o) => {
    const executions = o.executions || []
    return sum + executions.reduce((execSum, exec) =>
      execSum + (Number(exec.executed_quantity) * Number(exec.execution_price)), 0)
  }, 0)

  const avgPrice = totalVolume > 0 ? totalValue / totalVolume : 0
  const executionRate = totalOrders > 0 ? executedOrders / totalOrders : 0

  return {
    strategyId,
    period: { from, to },
    totalOrders,
    executedOrders,
    cancelledOrders,
    totalVolume,
    totalValue,
    avgPrice,
    executionRate,
    successRate: executionRate,
  }
}

async function getPerformanceHistory(strategyId) {
  const strategy = await db.trading_strategies.findByPk(strategyId)
  if (!strategy) return null

  // Get performance data from the strategy's performance JSON field
  const performance = strategy.performance || {}

  // If no performance data, return empty structure
  if (!performance.history) {
    return {
      strategyId,
      history: [],
      summary: {
        totalReturn: 0,
        maxDrawdown: 0,
        sharpeRatio: 0,
        winRate: 0,
      }
    }
  }

  return {
    strategyId,
    history: performance.history,
    summary: performance.summary || {
      totalReturn: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      winRate: 0,
    }
  }
}

async function activateStrategy(strategyId) {
  return db.trading_strategies.update({ is_active: true }, { where: { strategy_id: strategyId } })
}

async function runStrategyOnce(strategyId) {
  const strategy = await db.trading_strategies.findByPk(strategyId)
  if (!strategy) return null

  // This is a stub implementation - in a real system, this would:
  // 1. Load strategy parameters
  // 2. Get current market data
  // 3. Run the strategy logic
  // 4. Generate orders based on signals
  // 5. Return the generated orders

  const mockOrders = [
    {
      portfolio_id: strategy.user_id, // Assuming user has a default portfolio
      asset_id: 'default-asset',
      order_type: 'MARKET',
      side: 'BUY',
      quantity: 100,
      price: null,
      time_in_force: 'DAY',
      status: 'PENDING',
      strategy_generated: true,
    }
  ]

  // In a real implementation, you would:
  // - Validate market conditions
  // - Check risk limits
  // - Create actual orders in the database
  // - Return the created orders

  return {
    strategyId,
    timestamp: new Date(),
    orders: mockOrders,
    message: 'Strategy execution completed (stub implementation)',
  }
}

module.exports = {
  getActiveStrategies,
  updatePerformance,
  deactivateStrategy,
  backtest,
  getPerformanceHistory,
  activateStrategy,
  runStrategyOnce,
}