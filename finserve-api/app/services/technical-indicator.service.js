const { Op } = require('sequelize')
const db = require('../models')
const calculatorService = require('./calculator.service')
const priceService = require('./price.service')

async function createTechnicalIndicator(indicatorData) {
  try {
    const indicator = await db.technical_indicators.create(indicatorData)
    return indicator
  } catch (error) {
    throw new Error(`Error creating technical indicator: ${error.message}`)
  }
}

async function getTechnicalIndicators(options = {}) {
  try {
    const indicators = await db.technical_indicators.findAll(options)
    return indicators
  } catch (error) {
    throw new Error(`Error finding technical indicators: ${error.message}`)
  }
}

async function getTechnicalIndicatorById(indicatorId) {
  try {
    const indicator = await db.technical_indicators.findByPk(indicatorId)
    if (!indicator) {
      throw new Error('Technical indicator not found')
    }
    return indicator
  } catch (error) {
    throw new Error(`Error finding technical indicator: ${error.message}`)
  }
}

async function updateTechnicalIndicator(indicatorId, updateData) {
  try {
    const [updatedRowsCount] = await db.technical_indicators.update(updateData, {
      where: { indicator_id: indicatorId },
    })
    if (updatedRowsCount === 0) {
      throw new Error('Technical indicator not found or no changes made')
    }
    return await getTechnicalIndicatorById(indicatorId)
  } catch (error) {
    throw new Error(`Error updating technical indicator: ${error.message}`)
  }
}

async function deleteTechnicalIndicator(indicatorId) {
  try {
    const deletedRowsCount = await db.technical_indicators.destroy({
      where: { indicator_id: indicatorId },
    })
    if (deletedRowsCount === 0) {
      throw new Error('Technical indicator not found')
    }
    return { message: 'Technical indicator deleted successfully' }
  } catch (error) {
    throw new Error(`Error deleting technical indicator: ${error.message}`)
  }
}

async function getTechnicalIndicatorsByAssetId(assetId) {
  try {
    const indicators = await db.technical_indicators.findAll({
      where: { asset_id: assetId },
    })
    return indicators
  } catch (error) {
    throw new Error(`Error finding technical indicators by asset ID: ${error.message}`)
  }
}

async function getTechnicalIndicatorsByType(indicatorType) {
  try {
    const indicators = await db.technical_indicators.findAll({
      where: { indicator_type: indicatorType },
    })
    return indicators
  } catch (error) {
    throw new Error(`Error finding technical indicators by type: ${error.message}`)
  }
}

async function calculateTechnicalIndicator(indicatorId) {
  try {
    const indicator = await getTechnicalIndicatorById(indicatorId)

    // Get price history for the asset
    const prices = await priceService.getPriceHistory(indicator.asset_id, null, null, '1d')
    if (!prices || prices.length === 0) {
      throw new Error('No price data available for this asset')
    }

    // Extract close prices
    const closePrices = prices.map(p => Number(p.close || p.price || 0)).filter(p => p > 0)
    if (closePrices.length === 0) {
      throw new Error('No valid price data found')
    }

    let calculatedValues = []
    let additionalData = {}

    // Calculate based on indicator type
    switch (indicator.indicator_type.toUpperCase()) {
      case 'SMA':
        const smaPeriod = indicator.parameters?.period || 20
        calculatedValues = calculatorService.calculateSMA(closePrices, smaPeriod)
        break

      case 'EMA':
        const emaPeriod = indicator.parameters?.period || 20
        calculatedValues = calculatorService.calculateEMA(closePrices, emaPeriod)
        break

      case 'RSI':
        const rsiPeriod = indicator.parameters?.period || 14
        calculatedValues = calculatorService.calculateRSI(closePrices, rsiPeriod)
        break

      case 'MACD':
        const fastPeriod = indicator.parameters?.fastPeriod || 12
        const slowPeriod = indicator.parameters?.slowPeriod || 26
        const signalPeriod = indicator.parameters?.signalPeriod || 9
        const macdResult = calculatorService.calculateMACD(closePrices, fastPeriod, slowPeriod, signalPeriod)
        calculatedValues = macdResult.macd
        additionalData = {
          signal: macdResult.signal,
          histogram: macdResult.histogram
        }
        break

      case 'BB':
      case 'BOLLINGER_BANDS':
        const bbPeriod = indicator.parameters?.period || 20
        const bbStdDev = indicator.parameters?.stdDev || 2
        const bbResult = calculatorService.calculateBollingerBands(closePrices, bbPeriod, bbStdDev)
        calculatedValues = bbResult.middle
        additionalData = {
          upper: bbResult.upper,
          lower: bbResult.lower
        }
        break

      default:
        throw new Error(`Unsupported indicator type: ${indicator.indicator_type}`)
    }

    // Store calculated values
    const valuesToStore = []
    const startIndex = closePrices.length - calculatedValues.length

    for (let i = 0; i < calculatedValues.length; i++) {
      const timestamp = prices[startIndex + i]?.timestamp || new Date(Date.now() - (calculatedValues.length - 1 - i) * 24 * 60 * 60 * 1000)

      // Generate signal
      const signal = calculatorService.generateSignal(
        indicator.indicator_type.toUpperCase(),
        calculatedValues[i],
        i > 0 ? calculatedValues[i - 1] : null,
        additionalData
      )

      valuesToStore.push({
        indicator_id: indicatorId,
        timestamp: timestamp,
        value: calculatedValues[i],
        additional_data: additionalData,
        signal: signal
      })
    }

    // Bulk insert/update values
    for (const valueData of valuesToStore) {
      await db.indicator_values.upsert(valueData)
    }

    // Update indicator last calculation date
    await db.technical_indicators.update(
      { last_calculation_date: new Date() },
      { where: { indicator_id: indicatorId } }
    )

    return {
      indicator_id: indicatorId,
      type: indicator.indicator_type,
      values_calculated: calculatedValues.length,
      latest_value: calculatedValues[calculatedValues.length - 1],
      latest_signal: valuesToStore[valuesToStore.length - 1]?.signal,
      calculation_date: new Date()
    }

  } catch (error) {
    throw new Error(`Error calculating technical indicator: ${error.message}`)
  }
}

async function getTechnicalIndicatorValues(indicatorId, limit = 100) {
  try {
    const values = await db.indicator_values.findAll({
      where: { indicator_id: indicatorId },
      order: [['timestamp', 'DESC']],
      limit: limit,
    })
    return values
  } catch (error) {
    throw new Error(`Error getting technical indicator values: ${error.message}`)
  }
}

module.exports = {
  createTechnicalIndicator,
  getTechnicalIndicators,
  getTechnicalIndicatorById,
  updateTechnicalIndicator,
  deleteTechnicalIndicator,
  getTechnicalIndicatorsByAssetId,
  getTechnicalIndicatorsByType,
  calculateTechnicalIndicator,
  getTechnicalIndicatorValues,
}