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

  // Get orders and their executions using raw SQL to avoid association issues
  const [orders] = await db.sequelize.query(`
    SELECT 
      o.*,
      COUNT(DISTINCT oe.execution_id) as execution_count,
      COALESCE(SUM(oe.executed_quantity), 0) as total_executed_qty,
      COALESCE(SUM(oe.executed_quantity * oe.execution_price), 0) as total_executed_value
    FROM orders o
    LEFT JOIN order_executions oe ON o.order_id = oe.order_id
    WHERE o.creation_date >= :from
      AND o.creation_date <= :to
    GROUP BY o.order_id
    ORDER BY o.creation_date DESC
  `, {
    replacements: { from: new Date(from), to: new Date(to) },
    type: db.Sequelize.QueryTypes.SELECT
  })

  // Calculate comprehensive metrics
  const totalOrders = orders.length
  const executedOrders = orders.filter(o => o.status === 'EXECUTED' || o.status === 'FILLED').length
  const partiallyFilledOrders = orders.filter(o => o.status === 'PARTIALLY_FILLED').length
  const cancelledOrders = orders.filter(o => o.status === 'CANCELLED').length
  const pendingOrders = orders.filter(o => o.status === 'PENDING').length

  const totalVolume = orders.reduce((sum, o) => sum + Number(o.total_executed_qty || 0), 0)
  const totalValue = orders.reduce((sum, o) => sum + Number(o.total_executed_value || 0), 0)
  const avgPrice = totalVolume > 0 ? totalValue / totalVolume : 0
  
  const executionRate = totalOrders > 0 ? executedOrders / totalOrders : 0
  const fillRate = totalOrders > 0 ? (executedOrders + partiallyFilledOrders) / totalOrders : 0

  // Calculate profit/loss (simplified - assumes all executed orders)
  const buyOrders = orders.filter(o => o.side === 'BUY')
  const sellOrders = orders.filter(o => o.side === 'SELL')
  
  const totalBuyValue = buyOrders.reduce((sum, o) => sum + Number(o.total_executed_value || 0), 0)
  const totalSellValue = sellOrders.reduce((sum, o) => sum + Number(o.total_executed_value || 0), 0)
  const profitLoss = totalSellValue - totalBuyValue
  const profitLossPercent = totalBuyValue > 0 ? (profitLoss / totalBuyValue) * 100 : 0

  // Win/Loss analysis
  const profitableOrders = orders.filter(o => {
    const executedValue = Number(o.total_executed_value || 0)
    const quantity = Number(o.total_executed_qty || 0)
    const avgExecutionPrice = quantity > 0 ? executedValue / quantity : 0
    const orderPrice = Number(o.price || 0)
    
    if (o.side === 'BUY') {
      return avgExecutionPrice < orderPrice
    } else {
      return avgExecutionPrice > orderPrice
    }
  })
  const winRate = executedOrders > 0 ? profitableOrders.length / executedOrders : 0

  return {
    strategyId,
    period: { from, to },
    metrics: {
      totalOrders,
      executedOrders,
      partiallyFilledOrders,
      cancelledOrders,
      pendingOrders,
      executionRate: Math.round(executionRate * 10000) / 100,
      fillRate: Math.round(fillRate * 10000) / 100,
      winRate: Math.round(winRate * 10000) / 100,
    },
    volume: {
      totalVolume: Math.round(totalVolume * 100) / 100,
      totalValue: Math.round(totalValue * 100) / 100,
      avgPrice: Math.round(avgPrice * 100) / 100,
    },
    performance: {
      profitLoss: Math.round(profitLoss * 100) / 100,
      profitLossPercent: Math.round(profitLossPercent * 100) / 100,
      totalBuyValue: Math.round(totalBuyValue * 100) / 100,
      totalSellValue: Math.round(totalSellValue * 100) / 100,
    },
    orders: orders.map(o => ({
      order_id: o.order_id,
      asset_id: o.asset_id,
      side: o.side,
      quantity: o.quantity,
      price: o.price,
      status: o.status,
      executed_quantity: o.total_executed_qty,
      executed_value: o.total_executed_value,
      creation_date: o.creation_date,
    }))
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
  if (!strategy) throw new Error('Strategy not found')
  
  if (!strategy.is_active) {
    throw new Error('Strategy is not active')
  }

  // Parse strategy parameters
  const params = strategy.parameters || {}
  const asset_id = params.asset_id || params.symbol || 'BTC'
  const portfolio_id = params.portfolio_id || strategy.user_id
  
  // Get current market data (simplified - using last trade price)
  let currentPrice = null
  
  try {
    const [marketData] = await db.sequelize.query(`
      SELECT 
        o.asset_id,
        oe.execution_price as last_price,
        oe.execution_time
      FROM order_executions oe
      INNER JOIN orders o ON oe.order_id = o.order_id
      WHERE o.asset_id = :asset_id
      ORDER BY oe.execution_time DESC
      LIMIT 1
    `, {
      replacements: { asset_id },
      type: db.Sequelize.QueryTypes.SELECT
    })

    if (marketData.length > 0) {
      currentPrice = Number(marketData[0].last_price)
    }
  } catch (error) {
    console.warn('Could not fetch market data:', error.message)
  }
  
  // Fallback to default price if no market data available
  if (!currentPrice) {
    currentPrice = params.default_price || 50000 // Default fallback price
    console.log(`Using default price ${currentPrice} for asset ${asset_id}`)
  }

  // Generate trading signals based on strategy type
  const signals = generateTradingSignals(strategy, currentPrice, params)
  
  if (!signals || signals.length === 0) {
    return {
      strategyId,
      timestamp: new Date(),
      signals: [],
      orders: [],
      message: 'No trading signals generated - no action taken'
    }
  }

  // Create orders based on signals
  const createdOrders = []
  
  for (const signal of signals) {
    // Risk management checks
    const quantity = calculatePositionSize(signal, params, currentPrice)
    
    if (quantity <= 0) {
      continue // Skip if position size is too small
    }

    // Create order in database
    const orderData = {
      portfolio_id,
      asset_id,
      order_type: signal.order_type || 'LIMIT',
      side: signal.side,
      quantity,
      price: signal.price || currentPrice,
      stop_price: signal.stop_price || null,
      time_in_force: params.time_in_force || 'GTC',
      status: 'PENDING',
      creation_date: new Date(),
    }

    try {
      const order = await db.orders.create(orderData)
      createdOrders.push(order)
      
      // Add to order book if it's a limit order (optional - may not have this table)
      if (orderData.order_type === 'LIMIT' && db.order_books) {
        try {
          await db.order_books.create({
            order_id: order.order_id,
            asset_id: order.asset_id,
            side: order.side,
            price: order.price,
            quantity: order.quantity,
            remaining_quantity: order.quantity,
            status: 'OPEN',
          })
        } catch (bookError) {
          // Silently fail if order_books table doesn't exist
          console.log('Could not add to order book (table may not exist):', bookError.message)
        }
      }
    } catch (error) {
      console.error('Error creating order:', error)
      // Don't throw - continue with other signals
    }
  }

  // Update strategy performance tracking
  const performance = strategy.performance || {}
  performance.lastRun = new Date()
  performance.totalRuns = (performance.totalRuns || 0) + 1
  performance.ordersGenerated = (performance.ordersGenerated || 0) + createdOrders.length
  
  await db.trading_strategies.update(
    { performance },
    { where: { strategy_id: strategyId } }
  )

  return {
    strategyId,
    timestamp: new Date(),
    currentPrice,
    signals,
    orders: createdOrders.map(o => ({
      order_id: o.order_id,
      asset_id: o.asset_id,
      side: o.side,
      order_type: o.order_type,
      quantity: o.quantity,
      price: o.price,
      status: o.status,
    })),
    message: `Strategy executed successfully - ${createdOrders.length} order(s) created`
  }
}

// Helper function to generate trading signals
function generateTradingSignals(strategy, currentPrice, params) {
  const signals = []
  const strategyType = strategy.strategy_type || params.type || 'MOMENTUM'
  
  // Simple signal generation based on strategy type
  switch (strategyType.toUpperCase()) {
    case 'MOMENTUM':
      // Buy if price is trending up (simplified)
      const threshold = params.threshold || 0.02 // 2% move
      const referencePrice = params.reference_price || currentPrice * 0.98
      
      if (currentPrice > referencePrice * (1 + threshold)) {
        signals.push({
          side: 'BUY',
          order_type: 'LIMIT',
          price: currentPrice * 0.999, // Slightly below current
          confidence: 0.7,
          reason: 'Momentum breakout detected'
        })
      } else if (currentPrice < referencePrice * (1 - threshold)) {
        signals.push({
          side: 'SELL',
          order_type: 'LIMIT',
          price: currentPrice * 1.001, // Slightly above current
          confidence: 0.7,
          reason: 'Momentum breakdown detected'
        })
      }
      break
      
    case 'MEAN_REVERSION':
      // Buy low, sell high (simplified)
      const mean = params.mean_price || currentPrice
      const deviation = params.deviation || 0.05 // 5%
      
      if (currentPrice < mean * (1 - deviation)) {
        signals.push({
          side: 'BUY',
          order_type: 'LIMIT',
          price: currentPrice,
          confidence: 0.8,
          reason: 'Price below mean - reversion expected'
        })
      } else if (currentPrice > mean * (1 + deviation)) {
        signals.push({
          side: 'SELL',
          order_type: 'LIMIT',
          price: currentPrice,
          confidence: 0.8,
          reason: 'Price above mean - reversion expected'
        })
      }
      break
      
    case 'BREAKOUT':
      // Buy on resistance break, sell on support break
      const resistance = params.resistance || currentPrice * 1.05
      const support = params.support || currentPrice * 0.95
      
      if (currentPrice >= resistance) {
        signals.push({
          side: 'BUY',
          order_type: 'MARKET',
          price: null,
          confidence: 0.9,
          reason: 'Resistance breakout'
        })
      } else if (currentPrice <= support) {
        signals.push({
          side: 'SELL',
          order_type: 'MARKET',
          price: null,
          confidence: 0.9,
          reason: 'Support breakdown'
        })
      }
      break
      
    default:
      // Default: no signal
      break
  }
  
  return signals
}

// Helper function to calculate position size based on risk management
function calculatePositionSize(signal, params, currentPrice) {
  const riskPerTrade = params.risk_per_trade || 0.02 // 2% risk per trade
  const accountBalance = params.account_balance || 10000 // Default $10k
  const maxPositionSize = params.max_position_size || 1000 // Max quantity
  
  // Calculate position size based on risk
  const riskAmount = accountBalance * riskPerTrade
  const pricePerUnit = signal.price || currentPrice
  
  let quantity = Math.floor(riskAmount / pricePerUnit)
  
  // Apply max position size limit
  quantity = Math.min(quantity, maxPositionSize)
  
  // Ensure minimum quantity
  const minQuantity = params.min_quantity || 0.01
  if (quantity < minQuantity) {
    return 0 // Too small, skip
  }
  
  return quantity
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