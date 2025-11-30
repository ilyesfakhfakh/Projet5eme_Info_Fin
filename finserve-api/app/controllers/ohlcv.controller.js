const express = require('express')
const router = express.Router()
const ohlcvService = require('../services/ohlcv.service')

// Get OHLCV data for an asset
const getOHLCV = async (req, res) => {
  try {
    const { assetId } = req.params
    const { interval = '1h', from, to, limit = 100 } = req.query

    const ohlcvData = await ohlcvService.getOHLCV(assetId, interval, from, to, limit)
    return res.json(ohlcvData)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
  }
}

// Get latest OHLCV data for an asset
const getLatestOHLCV = async (req, res) => {
  try {
    const { assetId } = req.params
    const { interval = '1h' } = req.query

    const latestData = await ohlcvService.getLatestOHLCV(assetId, interval)

    if (!latestData) {
      return res.status(404).json({ message: 'No OHLCV data available for this asset' })
    }

    return res.json(latestData)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
  }
}

// Generate OHLCV data for an asset
const generateOHLCV = async (req, res) => {
  try {
    const { assetId } = req.params
    const { interval = '1h', hoursBack = 24 } = req.body

    const ohlcvData = await ohlcvService.generateOHLCV(assetId, interval, new Date(Date.now() - (hoursBack * 60 * 60 * 1000)))

    return res.json({
      message: 'OHLCV data generated successfully',
      assetId,
      interval,
      count: ohlcvData.length,
      data: ohlcvData
    })
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
  }
}

// Generate OHLCV data for all assets
const generateAllOHLCV = async (req, res) => {
  try {
    const { interval = '1h', hoursBack = 24 } = req.body

    const results = await ohlcvService.generateAllOHLCV(interval, hoursBack)

    return res.json({
      message: 'OHLCV data generation completed',
      interval,
      hoursBack,
      results
    })
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
  }
}

// Aggregate OHLCV data (convert smaller intervals to larger ones)
const aggregateOHLCV = async (req, res) => {
  try {
    const { assetId } = req.params
    const { targetInterval, sourceInterval = '1m' } = req.body

    const result = await ohlcvService.aggregateOHLCV(assetId, targetInterval, sourceInterval)

    return res.json({
      message: 'OHLCV aggregation completed',
      assetId,
      targetInterval,
      sourceInterval,
      result
    })
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
  }
}

// Get OHLCV statistics for an asset
const getOHLCVStats = async (req, res) => {
  try {
    const { assetId } = req.params
    const { interval = '1h', days = 30 } = req.query

    const endDate = new Date()
    const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000))

    const ohlcvData = await ohlcvService.getOHLCV(assetId, interval, startDate.toISOString(), endDate.toISOString(), 1000)

    if (ohlcvData.length === 0) {
      return res.status(404).json({ message: 'No OHLCV data available for the specified period' })
    }

    // Calculate statistics
    const prices = ohlcvData.map(d => Number(d.close))
    const volumes = ohlcvData.map(d => Number(d.volume))

    const stats = {
      assetId,
      interval,
      period: `${days} days`,
      count: ohlcvData.length,
      price: {
        min: Math.min(...prices),
        max: Math.max(...prices),
        avg: prices.reduce((a, b) => a + b, 0) / prices.length,
        first: prices[0],
        last: prices[prices.length - 1],
        change: prices[prices.length - 1] - prices[0],
        changePercent: ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100
      },
      volume: {
        total: volumes.reduce((a, b) => a + b, 0),
        avg: volumes.reduce((a, b) => a + b, 0) / volumes.length,
        max: Math.max(...volumes),
        min: Math.min(...volumes)
      }
    }

    return res.json(stats)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
  }
}

router.get('/:assetId', getOHLCV)
router.get('/:assetId/latest', getLatestOHLCV)
router.get('/:assetId/stats', getOHLCVStats)
router.post('/:assetId/generate', generateOHLCV)
router.post('/generate-all', generateAllOHLCV)
router.post('/:assetId/aggregate', aggregateOHLCV)

module.exports = router