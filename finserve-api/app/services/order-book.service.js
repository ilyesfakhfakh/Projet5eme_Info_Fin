const { Op } = require('sequelize')
const db = require('../models')

async function addOrderToBook(order) {
  const remaining = Number(order.quantity) - Number(order.executed_quantity || 0)
  return db.order_books.create({
    order_id: order.order_id,
    asset_id: order.asset_id,
    side: order.side,
    price: order.price,
    quantity: order.quantity,
    remaining_quantity: remaining,
    status: 'OPEN',
  })
}

async function removeOrderFromBook(orderId) {
  return db.order_books.update({ status: 'CANCELLED', remaining_quantity: 0 }, { where: { order_id: orderId } })
}

async function getOrders(side, { portfolioId = null, assetId = null } = {}) {
  const where = { status: { [Op.in]: ['OPEN', 'PARTIALLY_FILLED'] } }
  if (side) where.side = side
  if (assetId) where.asset_id = assetId

  const include = []
  if (portfolioId) {
    include.push({
      model: db.orders,
      where: { portfolio_id: portfolioId },
      attributes: [],
      required: true,
    })
  }

  const orderClause = side === 'BUY'
    ? [[db.sequelize.literal('price IS NULL'), 'ASC'], ['price', 'DESC'], ['createdAt', 'ASC']]
    : [[db.sequelize.literal('price IS NULL'), 'ASC'], ['price', 'ASC'], ['createdAt', 'ASC']]

  return db.order_books.findAll({ where, include, order: orderClause })
}

async function matchOrders() {
  // Enhanced matching with proper price-time priority
  const buyBooks = await getOrders('BUY')
  const sellBooks = await getOrders('SELL')
  const matches = []

  // Group orders by asset for proper matching
  const assetGroups = {}
  
  // Group buy orders by asset
  buyBooks.forEach(order => {
    if (!assetGroups[order.asset_id]) {
      assetGroups[order.asset_id] = { buy: [], sell: [] }
    }
    assetGroups[order.asset_id].buy.push(order)
  })
  
  // Group sell orders by asset
  sellBooks.forEach(order => {
    if (!assetGroups[order.asset_id]) {
      assetGroups[order.asset_id] = { buy: [], sell: [] }
    }
    assetGroups[order.asset_id].sell.push(order)
  })

  // Match orders for each asset
  for (const [assetId, orders] of Object.entries(assetGroups)) {
    const assetMatches = await matchOrdersForAsset(orders.buy, orders.sell)
    matches.push(...assetMatches)
  }

  return matches
}

// Full matching cycle that executes trades and updates the book
async function matchNow() {
  const summary = { trades: 0, executions: 0 }
  const buyBooks = await getOrders('BUY')
  const sellBooks = await getOrders('SELL')

  // Group by asset
  const assetGroups = {}
  buyBooks.forEach(o => { (assetGroups[o.asset_id] ||= { buy: [], sell: [] }).buy.push(o) })
  sellBooks.forEach(o => { (assetGroups[o.asset_id] ||= { buy: [], sell: [] }).sell.push(o) })

  for (const [, group] of Object.entries(assetGroups)) {
    const buyOrders = group.buy.sort((a, b) => {
      const d = Number(b.price || 0) - Number(a.price || 0)
      return d !== 0 ? d : new Date(a.createdAt) - new Date(b.createdAt)
    })
    const sellOrders = group.sell.sort((a, b) => {
      const d = Number(a.price || 0) - Number(b.price || 0)
      return d !== 0 ? d : new Date(a.createdAt) - new Date(b.createdAt)
    })

    let bi = 0
    let si = 0
    while (bi < buyOrders.length && si < sellOrders.length) {
      const buy = buyOrders[bi]
      const sell = sellOrders[si]
      const buyIsMarket = !buy.price || Number(buy.price) === 0
      const sellIsMarket = !sell.price || Number(sell.price) === 0
      const canCross = buyIsMarket || sellIsMarket || Number(buy.price || 0) >= Number(sell.price || 0)
      if (!canCross) break

      const remainingBuy = Number(buy.remaining_quantity)
      const remainingSell = Number(sell.remaining_quantity)
      const quantity = Math.min(remainingBuy, remainingSell)
      if (quantity <= 0) {
        if (remainingBuy <= 0) bi++
        if (remainingSell <= 0) si++
        continue
      }

      let price
      if (buyIsMarket && !sellIsMarket) price = Number(sell.price)
      else if (!buyIsMarket && sellIsMarket) price = Number(buy.price)
      else if (buyIsMarket && sellIsMarket) {
        // Both are market orders - use market price
        const marketPrice = await getMarketPrice(buy.asset_id)
        price = marketPrice || Number(sell.price || buy.price || 0)
      }
      else price = new Date(buy.createdAt) <= new Date(sell.createdAt) ? Number(buy.price) : Number(sell.price)

      const [execBuy, execSell] = await executeTrade(buy, sell, quantity, price)
      await updateOrderBook(buy, sell, quantity)

      summary.trades += 1
      summary.executions += 2

      // refresh local remaining after DB update
      buy.remaining_quantity = Math.max(0, remainingBuy - quantity)
      sell.remaining_quantity = Math.max(0, remainingSell - quantity)
      if (buy.remaining_quantity <= 0) bi++
      if (sell.remaining_quantity <= 0) si++
    }
  }

  return summary
}

// Create executions and update orders for a matched trade
async function executeTrade(buyOrderRef, sellOrderRef, quantity, price) {
  // Create executions for both sides
  const executionBuy = await db.order_executions.create({
    order_id: buyOrderRef.order_id,
    executed_quantity: quantity,
    execution_price: price,
    execution_time: new Date(),
    commission: quantity * price * 0.001,
    execution_type: 'MATCH',
  })

  const executionSell = await db.order_executions.create({
    order_id: sellOrderRef.order_id,
    executed_quantity: quantity,
    execution_price: price,
    execution_time: new Date(),
    commission: quantity * price * 0.001,
    execution_type: 'MATCH',
  })

  // Refresh current order rows to avoid drift
  const buyDb = await db.orders.findByPk(buyOrderRef.order_id)
  const sellDb = await db.orders.findByPk(sellOrderRef.order_id)

  // Update orders executed quantities and status
  await db.orders.update(
    {
      executed_quantity: Number(buyDb.executed_quantity || 0) + quantity,
      status:
        Number(buyDb.quantity) > Number(buyDb.executed_quantity || 0) + quantity
          ? 'PENDING'
          : 'EXECUTED',
    },
    { where: { order_id: buyOrderRef.order_id } }
  )
  await db.orders.update(
    {
      executed_quantity: Number(sellDb.executed_quantity || 0) + quantity,
      status:
        Number(sellDb.quantity) > Number(sellDb.executed_quantity || 0) + quantity
          ? 'PENDING'
          : 'EXECUTED',
    },
    { where: { order_id: sellOrderRef.order_id } }
  )

  return [executionBuy, executionSell]
}

// Update order book entries quantities and status after a trade
async function updateOrderBook(buyBookEntry, sellBookEntry, quantity) {
  const newBuyRemaining = Math.max(0, Number(buyBookEntry.remaining_quantity) - quantity)
  const newSellRemaining = Math.max(0, Number(sellBookEntry.remaining_quantity) - quantity)

  await db.order_books.update(
    {
      remaining_quantity: newBuyRemaining,
      status: newBuyRemaining > 0 ? 'PARTIALLY_FILLED' : 'FILLED',
    },
    { where: { book_id: buyBookEntry.book_id } }
  )
  await db.order_books.update(
    {
      remaining_quantity: newSellRemaining,
      status: newSellRemaining > 0 ? 'PARTIALLY_FILLED' : 'FILLED',
    },
    { where: { book_id: sellBookEntry.book_id } }
  )

  return { newBuyRemaining, newSellRemaining }
}

// Cancel orders in the book based on Time-In-Force policy
async function cancelExpiredOrders() {
  // IOC orders should not rest; DAY orders older than today are expired
  const OpLocal = Op
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  // Cancel any IOC resting orders (safety) and DAY older than today
  const [count] = await db.order_books.update(
    { status: 'CANCELLED', remaining_quantity: 0 },
    {
      where: { status: { [OpLocal.in]: ['OPEN', 'PARTIALLY_FILLED'] } },
      include: [
        {
          model: db.orders,
          where: {
            [OpLocal.or]: [
              { time_in_force: 'IOC' },
              { time_in_force: 'DAY', createdAt: { [OpLocal.lt]: startOfToday } },
            ],
          },
          attributes: [],
          required: true,
        },
      ],
    }
  )

  return count
}

async function matchOrdersForAsset(buyOrders, sellOrders) {
  const matches = []
  
  // Sort orders by price-time priority
  buyOrders.sort((a, b) => {
    const priceDiff = Number(b.price || 0) - Number(a.price || 0)
    if (priceDiff !== 0) return priceDiff
    return new Date(a.createdAt) - new Date(b.createdAt)
  })
  
  sellOrders.sort((a, b) => {
    const priceDiff = Number(a.price || 0) - Number(b.price || 0)
    if (priceDiff !== 0) return priceDiff
    return new Date(a.createdAt) - new Date(b.createdAt)
  })

  let bi = 0
  let si = 0
  
  while (bi < buyOrders.length && si < sellOrders.length) {
    const buy = buyOrders[bi]
    const sell = sellOrders[si]
    
    const buyIsMarket = !buy.price || Number(buy.price) === 0
    const sellIsMarket = !sell.price || Number(sell.price) === 0
    
    // Check if orders can match
    const canCross = buyIsMarket || sellIsMarket || Number(buy.price || 0) >= Number(sell.price || 0)
    if (!canCross) break

    const quantity = Math.min(Number(buy.remaining_quantity), Number(sell.remaining_quantity))
    if (quantity <= 0) {
      if (Number(buy.remaining_quantity) <= 0) bi++
      if (Number(sell.remaining_quantity) <= 0) si++
      continue
    }

    // Determine execution price
    let price
    if (buyIsMarket && !sellIsMarket) {
      price = Number(sell.price)
    } else if (!buyIsMarket && sellIsMarket) {
      price = Number(buy.price)
    } else if (buyIsMarket && sellIsMarket) {
      // Both are market orders - use market price
      const marketPrice = await getMarketPrice(buy.asset_id)
      price = marketPrice || Number(sell.price || buy.price || 0)
    } else {
      // Price-time priority: use the price of the order that was placed first
      price = new Date(buy.createdAt) <= new Date(sell.createdAt) ? Number(buy.price) : Number(sell.price)
    }

    matches.push({ buy, sell, quantity, price })

    // Update remaining quantities
    buy.remaining_quantity = Number(buy.remaining_quantity) - quantity
    sell.remaining_quantity = Number(sell.remaining_quantity) - quantity
    buy.status = buy.remaining_quantity > 0 ? 'PARTIALLY_FILLED' : 'FILLED'
    sell.status = sell.remaining_quantity > 0 ? 'PARTIALLY_FILLED' : 'FILLED'

    // Update database
    await db.order_books.update(
      { remaining_quantity: buy.remaining_quantity, status: buy.status }, 
      { where: { book_id: buy.book_id } }
    )
    await db.order_books.update(
      { remaining_quantity: sell.remaining_quantity, status: sell.status }, 
      { where: { book_id: sell.book_id } }
    )

    // Remove fully filled orders
    if (buy.remaining_quantity <= 0) bi++
    if (sell.remaining_quantity <= 0) si++
  }

  return matches
}

async function getBestBid(assetId) {
  return db.order_books.findOne({
    where: {
      asset_id: assetId,
      side: 'BUY',
      status: { [Op.in]: ['OPEN', 'PARTIALLY_FILLED'] },
      price: { [Op.not]: null },
    },
    order: [['price', 'DESC'], ['createdAt', 'ASC']],
  })
}

async function getBestAsk(assetId) {
  return db.order_books.findOne({
    where: {
      asset_id: assetId,
      side: 'SELL',
      status: { [Op.in]: ['OPEN', 'PARTIALLY_FILLED'] },
      price: { [Op.not]: null },
    },
    order: [['price', 'ASC'], ['createdAt', 'ASC']],
  })
}

async function getDepth(assetId, side, levels = 10) {
  const orderDirection = side === 'BUY' ? 'DESC' : 'ASC'
  const rows = await db.order_books.findAll({
    attributes: [
      'price',
      [db.Sequelize.fn('SUM', db.Sequelize.col('remaining_quantity')), 'size'],
    ],
    where: {
      asset_id: assetId,
      side,
      status: { [Op.in]: ['OPEN', 'PARTIALLY_FILLED'] },
      price: { [Op.not]: null },
    },
    group: ['price'],
    order: [['price', orderDirection]],
    limit: levels,
    raw: true,
  })
  return rows.map(r => ({ price: Number(r.price), size: Number(r.size) }))
}

async function getSpread(assetId) {
  const [bid, ask] = await Promise.all([getBestBid(assetId), getBestAsk(assetId)])
  if (!bid || !ask) return null
  return Number(ask.price) - Number(bid.price)
}

async function getTopOfBook(assetId) {
  const [bid, ask] = await Promise.all([getBestBid(assetId), getBestAsk(assetId)])
  return { bid, ask }
}

async function purgeStaleOrders(cutoffDate) {
  return db.order_books.update(
    { status: 'CANCELLED', remaining_quantity: 0 },
    {
      where: {
        status: { [Op.in]: ['OPEN', 'PARTIALLY_FILLED'] },
        updatedAt: { [Op.lt]: cutoffDate },
      },
    }
  )
}

async function reopenOrder(orderId) {
  const order = await db.orders.findByPk(orderId)
  if (!order) return [0]
  const remaining = Math.max(0, Number(order.quantity) - Number(order.executed_quantity || 0))
  return db.order_books.update(
    { status: remaining > 0 ? 'OPEN' : 'FILLED', remaining_quantity: remaining },
    { where: { order_id: orderId } }
  )
}

async function snapshot(assetId) {
  const [bids, asks] = await Promise.all([
    getDepth(assetId, 'BUY', 50),
    getDepth(assetId, 'SELL', 50),
  ])
  return { bids, asks }
}

async function getMarketPrice(assetId) {
  // Try mid price first (most balanced)
  const midPrice = await getMidPrice(assetId)
  if (midPrice) return midPrice.price

  // Fallback to last trade price
  const lastTrade = await getLastTradePrice(assetId)
  if (lastTrade) return lastTrade.price

  // No price available
  return null
}

async function getMidPrice(assetId) {
  const [bestBid, bestAsk] = await Promise.all([
    getBestBid(assetId),
    getBestAsk(assetId),
  ])

  if (!bestBid || !bestAsk) return null

  const bidPrice = Number(bestBid.price)
  const askPrice = Number(bestAsk.price)
  return (bidPrice + askPrice) / 2
}

async function getLastTradePrice(assetId) {
  const execution = await db.order_executions.findOne({
    where: { order_id: { [db.Sequelize.Op.in]: db.Sequelize.literal(`(SELECT order_id FROM orders WHERE asset_id = '${assetId}')`) } },
    order: [['execution_time', 'DESC']],
  })

  return execution ? Number(execution.execution_price) : null
}

module.exports = {
  addOrderToBook,
  removeOrderFromBook,
  getOrders,
  matchOrders,
  getBestBid,
  getBestAsk,
  getDepth,
  getSpread,
  getTopOfBook,
  purgeStaleOrders,
  reopenOrder,
  snapshot,
  executeTrade,
  updateOrderBook,
  cancelExpiredOrders,
  matchNow,
  getMarketPrice,
  getMidPrice,
  getLastTradePrice,
}