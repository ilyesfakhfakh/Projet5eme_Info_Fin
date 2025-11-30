const db = require('../models')
const orderBookService = require('./order-book.service')

async function getCurrentPrice(assetId, method = 'lastTrade') {
  switch (method) {
    case 'lastTrade':
      return getLastTradePrice(assetId)
    case 'midPrice':
      return getMidPrice(assetId)
    case 'vwap':
      return getVWAP(assetId, '1h') // Default to 1 hour
    default:
      throw new Error(`Unknown price method: ${method}`)
  }
}

async function getLastTradePrice(assetId) {
  const execution = await db.order_executions.findOne({
    where: { order_id: { [db.Sequelize.Op.in]: db.Sequelize.literal(`(SELECT order_id FROM orders WHERE asset_id = '${assetId}')`) } },
    order: [['execution_time', 'DESC']],
  })

  if (!execution) return null

  return {
    assetId,
    price: Number(execution.execution_price),
    method: 'lastTrade',
    timestamp: execution.execution_time,
  }
}

async function getMidPrice(assetId) {
  const [bestBid, bestAsk] = await Promise.all([
    orderBookService.getBestBid(assetId),
    orderBookService.getBestAsk(assetId),
  ])

  if (!bestBid || !bestAsk) return null

  const bidPrice = Number(bestBid.price)
  const askPrice = Number(bestAsk.price)
  const midPrice = (bidPrice + askPrice) / 2

  return {
    assetId,
    price: midPrice,
    bid: bidPrice,
    ask: askPrice,
    method: 'midPrice',
    timestamp: new Date(),
  }
}

async function getVWAP(assetId, period = '1h') {
  const periodMs = getPeriodInMs(period)
  const startTime = new Date(Date.now() - periodMs)

  const executions = await db.order_executions.findAll({
    where: {
      execution_time: { [db.Sequelize.Op.gte]: startTime },
      order_id: { [db.Sequelize.Op.in]: db.Sequelize.literal(`(SELECT order_id FROM orders WHERE asset_id = '${assetId}')`) },
    },
    order: [['execution_time', 'ASC']],
  })

  if (executions.length === 0) return null

  let totalValue = 0
  let totalVolume = 0

  executions.forEach(execution => {
    const price = Number(execution.execution_price)
    const volume = Number(execution.executed_quantity)
    totalValue += price * volume
    totalVolume += volume
  })

  const vwap = totalVolume > 0 ? totalValue / totalVolume : 0

  return {
    assetId,
    price: vwap,
    totalValue,
    totalVolume,
    period,
    method: 'vwap',
    timestamp: new Date(),
  }
}

async function getPriceHistory(assetId, from, to, interval = '1h') {
  // This would be implemented with OHLCV data when available
  // For now, return executions in the time range
  const executions = await db.order_executions.findAll({
    where: {
      execution_time: {
        [db.Sequelize.Op.between]: [new Date(from), new Date(to)]
      },
      order_id: { [db.Sequelize.Op.in]: db.Sequelize.literal(`(SELECT order_id FROM orders WHERE asset_id = '${assetId}')`) },
    },
    order: [['execution_time', 'ASC']],
  })

  return executions.map(exec => ({
    timestamp: exec.execution_time,
    price: Number(exec.execution_price),
    volume: Number(exec.executed_quantity),
  }))
}

function getPeriodInMs(period) {
  const periods = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
    '1w': 7 * 24 * 60 * 60 * 1000,
  }
  return periods[period] || periods['1h']
}

async function getSpread(assetId) {
  const orderBookService = require('./order-book.service')
  const [bid, ask] = await Promise.all([orderBookService.getBestBid(assetId), orderBookService.getBestAsk(assetId)])

  if (!bid || !ask) return null

  const bidPrice = Number(bid.price)
  const askPrice = Number(ask.price)
  const spread = askPrice - bidPrice
  const spreadPercent = ((spread / bidPrice) * 100)

  return {
    assetId,
    bid: bidPrice,
    ask: askPrice,
    spread,
    spreadPercent,
    timestamp: new Date(),
  }
}

module.exports = {
  getCurrentPrice,
  getLastTradePrice,
  getMidPrice,
  getVWAP,
  getPriceHistory,
  getSpread,
}