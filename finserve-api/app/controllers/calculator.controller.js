const express = require('express')
const router = express.Router()
const calculatorService = require('../services/calculator.service')

// Calculate SMA for given prices
const calculateSMA = async (req, res) => {
  try {
    const { prices, period } = req.body

    if (!Array.isArray(prices) || !period || period < 1) {
      return res.status(400).json({
        message: 'Invalid input: prices must be an array and period must be a positive number'
      })
    }

    const smaValues = calculatorService.calculateSMA(prices, period)
    return res.json({
      success: true,
      data: {
        type: 'SMA',
        period,
        values: smaValues,
        count: smaValues.length
      },
      message: 'SMA calculated successfully'
    })
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
  }
}

// Calculate EMA for given prices
const calculateEMA = async (req, res) => {
  try {
    const { prices, period } = req.body

    if (!Array.isArray(prices) || !period || period < 1) {
      return res.status(400).json({
        message: 'Invalid input: prices must be an array and period must be a positive number'
      })
    }

    const emaValues = calculatorService.calculateEMA(prices, period)
    return res.json({
      success: true,
      data: {
        type: 'EMA',
        period,
        values: emaValues,
        count: emaValues.length
      },
      message: 'EMA calculated successfully'
    })
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
  }
}

// Calculate RSI for given prices
const calculateRSI = async (req, res) => {
  try {
    const { prices, period = 14 } = req.body

    if (!Array.isArray(prices) || !period || period < 1) {
      return res.status(400).json({
        message: 'Invalid input: prices must be an array and period must be a positive number'
      })
    }

    const rsiValues = calculatorService.calculateRSI(prices, period)
    return res.json({
      success: true,
      data: {
        type: 'RSI',
        period,
        values: rsiValues,
        count: rsiValues.length,
        latest: rsiValues[rsiValues.length - 1]
      },
      message: 'RSI calculated successfully'
    })
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
  }
}

// Calculate MACD for given prices
const calculateMACD = async (req, res) => {
  try {
    const { prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9 } = req.body

    if (!Array.isArray(prices)) {
      return res.status(400).json({
        message: 'Invalid input: prices must be an array'
      })
    }

    const macdResult = calculatorService.calculateMACD(prices, fastPeriod, slowPeriod, signalPeriod)
    return res.json({
      success: true,
      data: {
        type: 'MACD',
        parameters: { fastPeriod, slowPeriod, signalPeriod },
        macd: macdResult.macd,
        signal: macdResult.signal,
        histogram: macdResult.histogram,
        count: macdResult.macd.length,
        latest: {
          macd: macdResult.macd[macdResult.macd.length - 1],
          signal: macdResult.signal[macdResult.signal.length - 1],
          histogram: macdResult.histogram[macdResult.histogram.length - 1]
        }
      },
      message: 'MACD calculated successfully'
    })
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
  }
}

// Calculate Bollinger Bands for given prices
const calculateBollingerBands = async (req, res) => {
  try {
    const { prices, period = 20, stdDev = 2 } = req.body

    if (!Array.isArray(prices) || !period || period < 1) {
      return res.status(400).json({
        message: 'Invalid input: prices must be an array and period must be a positive number'
      })
    }

    const bbResult = calculatorService.calculateBollingerBands(prices, period, stdDev)
    return res.json({
      success: true,
      data: {
        type: 'BOLLINGER_BANDS',
        parameters: { period, stdDev },
        upper: bbResult.upper,
        middle: bbResult.middle,
        lower: bbResult.lower,
        count: bbResult.middle.length,
        latest: {
          upper: bbResult.upper[bbResult.upper.length - 1],
          middle: bbResult.middle[bbResult.middle.length - 1],
          lower: bbResult.lower[bbResult.lower.length - 1]
        }
      },
      message: 'Bollinger Bands calculated successfully'
    })
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
  }
}

// Generate trading signal based on indicator value
const generateSignal = async (req, res) => {
  try {
    const { indicatorType, currentValue, previousValue, parameters = {} } = req.body

    if (!indicatorType || currentValue === undefined) {
      return res.status(400).json({
        message: 'Invalid input: indicatorType and currentValue are required'
      })
    }

    const signal = calculatorService.generateSignal(indicatorType, currentValue, previousValue, parameters)
    return res.json({
      success: true,
      data: {
        indicatorType,
        currentValue,
        previousValue,
        signal,
        parameters
      },
      message: 'Signal generated successfully'
    })
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
  }
}

// Calculate multiple indicators at once
const calculateMultiple = async (req, res) => {
  try {
    const { prices, indicators } = req.body

    if (!Array.isArray(prices) || !Array.isArray(indicators)) {
      return res.status(400).json({
        message: 'Invalid input: prices and indicators must be arrays'
      })
    }

    const results = {}

    for (const indicator of indicators) {
      const { type, parameters = {} } = indicator

      try {
        switch (type.toUpperCase()) {
          case 'SMA':
            results.sma = calculatorService.calculateSMA(prices, parameters.period || 20)
            break
          case 'EMA':
            results.ema = calculatorService.calculateEMA(prices, parameters.period || 20)
            break
          case 'RSI':
            results.rsi = calculatorService.calculateRSI(prices, parameters.period || 14)
            break
          case 'MACD':
            results.macd = calculatorService.calculateMACD(
              prices,
              parameters.fastPeriod || 12,
              parameters.slowPeriod || 26,
              parameters.signalPeriod || 9
            )
            break
          case 'BB':
          case 'BOLLINGER_BANDS':
            results.bollingerBands = calculatorService.calculateBollingerBands(
              prices,
              parameters.period || 20,
              parameters.stdDev || 2
            )
            break
          default:
            results[type] = { error: `Unsupported indicator type: ${type}` }
        }
      } catch (error) {
        results[type] = { error: error.message }
      }
    }

    return res.json({
      success: true,
      data: results,
      message: 'Multiple indicators calculated successfully'
    })
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
  }
}

// Validate calculation parameters
const validateParameters = async (req, res) => {
  try {
    const { indicatorType, parameters } = req.body

    if (!indicatorType || !parameters) {
      return res.status(400).json({
        message: 'Invalid input: indicatorType and parameters are required'
      })
    }

    // Simple validation logic
    let isValid = false
    let errors = []

    switch (indicatorType.toUpperCase()) {
      case 'SMA':
      case 'EMA':
      case 'RSI':
        isValid = parameters.period && parameters.period > 0 && parameters.period <= 200
        if (!isValid) errors.push('Period must be between 1 and 200')
        break
      case 'MACD':
        isValid = parameters.fastPeriod && parameters.slowPeriod && parameters.signalPeriod &&
                  parameters.fastPeriod < parameters.slowPeriod && parameters.slowPeriod > parameters.signalPeriod
        if (!isValid) {
          errors.push('Fast period must be < slow period, and slow period must be > signal period')
        }
        break
      case 'BB':
      case 'BOLLINGER_BANDS':
        isValid = parameters.period && parameters.period > 0 && parameters.stdDev && parameters.stdDev > 0
        if (!isValid) errors.push('Period and stdDev must be positive numbers')
        break
      default:
        errors.push(`Unsupported indicator type: ${indicatorType}`)
    }

    return res.json({
      success: true,
      data: {
        indicatorType,
        parameters,
        isValid,
        errors
      },
      message: isValid ? 'Parameters are valid' : 'Parameters validation failed'
    })
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
  }
}

// Get calculation examples
const getExamples = async (req, res) => {
  try {
    const examples = {
      sma: {
        description: 'Simple Moving Average',
        formula: 'SMA(N) = (P₁ + P₂ + ... + Pₙ) / N',
        example: {
          prices: [100, 102, 101, 103, 105],
          period: 5,
          result: 102.2
        }
      },
      ema: {
        description: 'Exponential Moving Average',
        formula: 'EMA(today) = Price × K + EMA(yesterday) × (1-K), where K = 2/(N+1)',
        example: {
          prices: [100, 102, 101, 103, 105],
          period: 5,
          result: [100, 101.33, 101.22, 102.15, 103.43]
        }
      },
      rsi: {
        description: 'Relative Strength Index',
        formula: 'RSI = 100 - (100 / (1 + RS)), where RS = Avg Gains / Avg Losses',
        example: {
          prices: [100, 102, 101, 105, 103, 106, 108, 107, 110, 112, 111, 113, 115, 114, 116],
          period: 14,
          result: 81.35
        }
      },
      macd: {
        description: 'Moving Average Convergence Divergence',
        formula: 'MACD = EMA(12) - EMA(26), Signal = EMA(9) of MACD',
        example: {
          prices: Array.from({length: 40}, (_, i) => 100 + Math.sin(i/5) * 10),
          result: {
            macd: [2.3],
            signal: [1.8],
            histogram: [0.5]
          }
        }
      },
      bollingerBands: {
        description: 'Bollinger Bands',
        formula: 'Upper = SMA + (2 × σ), Lower = SMA - (2 × σ)',
        example: {
          prices: [100, 102, 101, 103, 105],
          period: 5,
          stdDev: 2,
          result: {
            upper: 105.64,
            middle: 102.2,
            lower: 98.76
          }
        }
      }
    }

    return res.json({
      success: true,
      data: examples,
      message: 'Calculation examples retrieved successfully'
    })
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(error) })
  }
}

router.post('/sma', calculateSMA)
router.post('/ema', calculateEMA)
router.post('/rsi', calculateRSI)
router.post('/macd', calculateMACD)
router.post('/bollinger-bands', calculateBollingerBands)
router.post('/signal', generateSignal)
router.post('/multiple', calculateMultiple)
router.post('/validate', validateParameters)
router.get('/examples', getExamples)

module.exports = router