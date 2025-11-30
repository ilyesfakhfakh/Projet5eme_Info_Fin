const db = require('../models')

async function generateOHLCV(assetId, interval = '1h', startTime = null, endTime = null) {
  const intervalMs = getIntervalInMs(interval)
  const start = startTime || new Date(Date.now() - (24 * 60 * 60 * 1000)) // Default: last 24h
  const end = endTime || new Date()

  // Get all executions for the asset in the time range
  const executions = await db.order_executions.findAll({
    where: {
      execution_time: { [db.Sequelize.Op.between]: [start, end] },
      order_id: { [db.Sequelize.Op.in]: db.Sequelize.literal(`(SELECT order_id FROM orders WHERE asset_id = '${assetId}')`) },
    },
    order: [['execution_time', 'ASC']],
  })

  if (executions.length === 0) return []

  // Group executions by interval periods
  const ohlcvData = {}
  executions.forEach(execution => {
    const periodStart = getPeriodStart(execution.execution_time, interval)
    const periodKey = periodStart.toISOString()

    if (!ohlcvData[periodKey]) {
      ohlcvData[periodKey] = {
        asset_id: assetId,
        timestamp: periodStart,
        interval,
        open: Number(execution.execution_price),
        high: Number(execution.execution_price),
        low: Number(execution.execution_price),
        close: Number(execution.execution_price),
        volume: Number(execution.executed_quantity),
        trades_count: 1,
      }
    } else {
      const data = ohlcvData[periodKey]
      data.high = Math.max(data.high, Number(execution.execution_price))
      data.low = Math.min(data.low, Number(execution.execution_price))
      data.close = Number(execution.execution_price)
      data.volume += Number(execution.executed_quantity)
      data.trades_count += 1
    }
  })

  // Convert to array and sort by timestamp
  const ohlcvArray = Object.values(ohlcvData).sort((a, b) => a.timestamp - b.timestamp)

  // Save to database
  const savedRecords = []
  for (const data of ohlcvArray) {
    const [record, created] = await db.ohlcvs.upsert(data, {
      returning: true,
    })
    savedRecords.push(record)
  }

  return savedRecords
}

async function getOHLCV(assetId, interval = '1h', from = null, to = null, limit = 100) {
  const where = { asset_id: assetId, interval }

  if (from || to) {
    where.timestamp = {}
    if (from) where.timestamp[db.Sequelize.Op.gte] = new Date(from)
    if (to) where.timestamp[db.Sequelize.Op.lte] = new Date(to)
  }

  return db.ohlcvs.findAll({
    where,
    order: [['timestamp', 'ASC']],
    limit: parseInt(limit),
  })
}

async function getLatestOHLCV(assetId, interval = '1h') {
  return db.ohlcvs.findOne({
    where: { asset_id: assetId, interval },
    order: [['timestamp', 'DESC']],
  })
}

async function aggregateOHLCV(assetId, targetInterval, sourceInterval = '1m') {
  // This would aggregate smaller intervals into larger ones
  // For example, aggregate 1m data into 1h data
  // Implementation depends on specific requirements
  throw new Error('Not implemented yet')
}

function getPeriodStart(timestamp, interval) {
  const date = new Date(timestamp)
  const intervalMs = getIntervalInMs(interval)

  return new Date(Math.floor(date.getTime() / intervalMs) * intervalMs)
}

function getIntervalInMs(interval) {
  const intervals = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
    '1w': 7 * 24 * 60 * 60 * 1000,
  }
  return intervals[interval] || intervals['1h']
}

async function getOHLCVStats(assetId, interval = '1h', days = 30) {
  const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000))

  const ohlcvData = await db.ohlcvs.findAll({
    where: {
      asset_id: assetId,
      interval,
      timestamp: { [db.Sequelize.Op.gte]: startDate }
    },
    order: [['timestamp', 'ASC']],
  })

  if (ohlcvData.length === 0) {
    return {
      assetId,
      interval,
      days,
      count: 0,
      averageVolume: 0,
      maxPrice: 0,
      minPrice: 0,
      volatility: 0,
    }
  }

  const prices = ohlcvData.map(d => Number(d.close))
  const volumes = ohlcvData.map(d => Number(d.volume))

  const maxPrice = Math.max(...prices)
  const minPrice = Math.min(...prices)
  const averageVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length

  // Calculate volatility (standard deviation of returns)
  const returns = []
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i-1]) / prices[i-1])
  }
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length
  const variance = returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / returns.length
  const volatility = Math.sqrt(variance)

  return {
    assetId,
    interval,
    days,
    count: ohlcvData.length,
    averageVolume,
    maxPrice,
    minPrice,
    volatility,
  }
}

async function generateAllOHLCV(interval = '1h', hoursBack = 24) {
  // Get all unique asset_ids from executions
  const assets = await db.order_executions.findAll({
    attributes: [
      [db.Sequelize.literal('DISTINCT (SELECT asset_id FROM orders WHERE orders.order_id = order_executions.order_id)'), 'asset_id']
    ],
    raw: true,
  })

  const assetIds = assets.map(a => a.asset_id).filter(id => id)

  const results = []
  for (const assetId of assetIds) {
    try {
      const ohlcv = await generateOHLCV(assetId, interval, new Date(Date.now() - (hoursBack * 60 * 60 * 1000)))
      results.push({ assetId, count: ohlcv.length })
    } catch (error) {
      console.error(`Error generating OHLCV for asset ${assetId}:`, error)
    }
  }

  return results
}

module.exports = {
  generateOHLCV,
  getOHLCV,
  getLatestOHLCV,
  getOHLCVStats,
  aggregateOHLCV,
  generateAllOHLCV,
}