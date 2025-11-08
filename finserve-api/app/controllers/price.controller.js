const express = require('express')
const router = express.Router()
const priceService = require('../services/price.service')
const ohlcvService = require('../services/ohlcv.service')

// Get current price for an asset
const getCurrentPrice = async (req, res) => {
  try {
    const { assetId } = req.params
    const { method = 'midPrice' } = req.query

    const priceData = await priceService.getCurrentPrice(assetId, method)

    if (!priceData) {
      return res.status(404).json({ message: 'No price data available for this asset' })
    }

    return res.json(priceData)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
  }
}

// Get price history for an asset
const getPriceHistory = async (req, res) => {
  try {
    const { assetId } = req.params
    const { from, to, interval = '1h' } = req.query

    const history = await priceService.getPriceHistory(assetId, from, to, interval)
    return res.json(history)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
  }
}

// Get VWAP for an asset
const getVWAP = async (req, res) => {
  try {
    const { assetId } = req.params
    const { period = '1h' } = req.query

    const vwapData = await priceService.getVWAP(assetId, period)

    if (!vwapData) {
      return res.status(404).json({ message: 'No VWAP data available for this asset' })
    }

    return res.json(vwapData)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
  }
}

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

// Get ticker information (24h summary)
const getTicker = async (req, res) => {
  try {
    const { assetId } = req.params

    // Get current price
    const currentPrice = await priceService.getCurrentPrice(assetId, 'midPrice')

    // Get 24h OHLCV data
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const ohlcv24h = await ohlcvService.getOHLCV(assetId, '1d', yesterday.toISOString(), new Date().toISOString(), 1)

    const ticker = {
      assetId,
      currentPrice: currentPrice ? currentPrice.price : null,
      priceChange24h: null,
      priceChangePercent24h: null,
      volume24h: null,
      high24h: null,
      low24h: null,
    }

    if (ohlcv24h.length > 0) {
      const ohlc = ohlcv24h[0]
      ticker.volume24h = Number(ohlc.volume)
      ticker.high24h = Number(ohlc.high)
      ticker.low24h = Number(ohlc.low)

      if (currentPrice && currentPrice.price) {
        const priceChange = currentPrice.price - Number(ohlc.close)
        ticker.priceChange24h = priceChange
        ticker.priceChangePercent24h = (priceChange / Number(ohlc.close)) * 100
      }
    }

    return res.json(ticker)
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
  }
}

// Generate OHLCV data (admin endpoint)
const generateOHLCV = async (req, res) => {
  try {
    const { assetId } = req.params
    const { interval = '1h', hoursBack = 24 } = req.body

    const ohlcvData = await ohlcvService.generateOHLCV(assetId, interval, new Date(Date.now() - (hoursBack * 60 * 60 * 1000)))

    return res.json({
      message: 'OHLCV data generated successfully',
      assetId,
      interval,
      count: ohlcvData.length
    })
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
  }
}

// Generate OHLCV data for all assets (admin endpoint)
const generateAllOHLCV = async (req, res) => {
  try {
    const { interval = '1h', hoursBack = 24 } = req.body

    const results = await ohlcvService.generateAllOHLCV(interval, hoursBack)

    return res.json({
      message: 'OHLCV data generated for all assets',
      results
    })
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
  }
}

router.get('/:assetId/current', getCurrentPrice)
router.get('/:assetId/history', getPriceHistory)
router.get('/:assetId/vwap', getVWAP)
router.get('/:assetId/ohlcv', getOHLCV)
router.get('/:assetId/ticker', getTicker)
router.post('/:assetId/ohlcv/generate', generateOHLCV)
router.post('/ohlcv/generate-all', generateAllOHLCV)

module.exports = router