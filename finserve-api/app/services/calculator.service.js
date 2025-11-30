/**
 * Calculator Service - Mathematical formulas for technical indicators
 * Pure functions, no side effects, easily testable
 */

function calculateSMA(prices, period) {
  if (!Array.isArray(prices) || prices.length < period) {
    throw new Error(`Not enough data points. Need at least ${period}, got ${prices.length}`)
  }

  const smaValues = []

  for (let i = period - 1; i < prices.length; i++) {
    const sum = prices.slice(i - period + 1, i + 1).reduce((acc, price) => acc + Number(price), 0)
    const sma = sum / period
    smaValues.push(Number(sma.toFixed(6)))
  }

  return smaValues
}

function calculateEMA(prices, period) {
  if (!Array.isArray(prices) || prices.length < period) {
    throw new Error(`Not enough data points. Need at least ${period}, got ${prices.length}`)
  }

  const emaValues = []
  const multiplier = 2 / (period + 1)

  // First EMA is SMA
  const firstSMA = prices.slice(0, period).reduce((acc, price) => acc + Number(price), 0) / period
  emaValues.push(Number(firstSMA.toFixed(6)))

  // Calculate subsequent EMAs
  for (let i = period; i < prices.length; i++) {
    const currentPrice = Number(prices[i])
    const previousEMA = emaValues[emaValues.length - 1]
    const ema = (currentPrice * multiplier) + (previousEMA * (1 - multiplier))
    emaValues.push(Number(ema.toFixed(6)))
  }

  return emaValues
}

function calculateRSI(prices, period = 14) {
  if (!Array.isArray(prices) || prices.length < period + 1) {
    throw new Error(`Not enough data points. Need at least ${period + 1}, got ${prices.length}`)
  }

  const rsiValues = []
  const gains = []
  const losses = []

  // Calculate price changes
  for (let i = 1; i < prices.length; i++) {
    const change = Number(prices[i]) - Number(prices[i - 1])
    gains.push(change > 0 ? change : 0)
    losses.push(change < 0 ? Math.abs(change) : 0)
  }

  // Calculate initial averages
  let avgGain = gains.slice(0, period).reduce((acc, gain) => acc + gain, 0) / period
  let avgLoss = losses.slice(0, period).reduce((acc, loss) => acc + loss, 0) / period

  // Calculate RSI for the first period
  if (avgLoss === 0) {
    rsiValues.push(100)
  } else {
    const rs = avgGain / avgLoss
    const rsi = 100 - (100 / (1 + rs))
    rsiValues.push(Number(rsi.toFixed(2)))
  }

  // Calculate subsequent RSIs using Wilder's smoothing
  for (let i = period; i < gains.length; i++) {
    avgGain = ((avgGain * (period - 1)) + gains[i]) / period
    avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period

    if (avgLoss === 0) {
      rsiValues.push(100)
    } else {
      const rs = avgGain / avgLoss
      const rsi = 100 - (100 / (1 + rs))
      rsiValues.push(Number(rsi.toFixed(2)))
    }
  }

  return rsiValues
}

function calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  if (!Array.isArray(prices) || prices.length < slowPeriod + signalPeriod) {
    throw new Error(`Not enough data points. Need at least ${slowPeriod + signalPeriod}, got ${prices.length}`)
  }

  // Calculate EMAs
  const fastEMA = calculateEMA(prices, fastPeriod)
  const slowEMA = calculateEMA(prices, slowPeriod)

  // Calculate MACD line (Fast EMA - Slow EMA)
  const macdLine = []
  const startIndex = slowPeriod - fastPeriod

  for (let i = 0; i < slowEMA.length; i++) {
    const macd = fastEMA[i + startIndex] - slowEMA[i]
    macdLine.push(Number(macd.toFixed(6)))
  }

  // Calculate Signal line (EMA of MACD line)
  const signalLine = calculateEMA(macdLine, signalPeriod)

  // Calculate Histogram (MACD - Signal)
  const histogram = []
  const histStartIndex = signalPeriod - 1

  for (let i = 0; i < signalLine.length; i++) {
    const hist = macdLine[i + histStartIndex] - signalLine[i]
    histogram.push(Number(hist.toFixed(6)))
  }

  return {
    macd: macdLine,
    signal: signalLine,
    histogram: histogram
  }
}

function calculateBollingerBands(prices, period = 20, stdDev = 2) {
  if (!Array.isArray(prices) || prices.length < period) {
    throw new Error(`Not enough data points. Need at least ${period}, got ${prices.length}`)
  }

  const upperBand = []
  const middleBand = []
  const lowerBand = []

  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1)
    const sma = slice.reduce((acc, price) => acc + Number(price), 0) / period

    // Calculate standard deviation
    const squaredDiffs = slice.map(price => Math.pow(Number(price) - sma, 2))
    const variance = squaredDiffs.reduce((acc, diff) => acc + diff, 0) / period
    const standardDeviation = Math.sqrt(variance)

    const upper = sma + (stdDev * standardDeviation)
    const lower = sma - (stdDev * standardDeviation)

    upperBand.push(Number(upper.toFixed(6)))
    middleBand.push(Number(sma.toFixed(6)))
    lowerBand.push(Number(lower.toFixed(6)))
  }

  return {
    upper: upperBand,
    middle: middleBand,
    lower: lowerBand
  }
}

function generateSignal(indicatorType, currentValue, previousValue, parameters = {}) {
  switch (indicatorType.toUpperCase()) {
    case 'RSI':
      if (currentValue < 30) return 'BUY'
      if (currentValue > 70) return 'SELL'
      return 'HOLD'

    case 'SMA':
      // For SMA crossover signals, we need more context
      // This is a simplified version
      return 'HOLD'

    case 'MACD':
      // MACD signals based on histogram direction and zero line
      const histogram = parameters.histogram
      if (!histogram || histogram.length < 2) return 'HOLD'

      const currentHist = histogram[histogram.length - 1]
      const prevHist = histogram[histogram.length - 2]

      // Histogram crossing above zero
      if (prevHist <= 0 && currentHist > 0) return 'BUY'
      // Histogram crossing below zero
      if (prevHist >= 0 && currentHist < 0) return 'SELL'

      return 'HOLD'

    case 'BB': // Bollinger Bands
      // This would need price comparison
      return 'HOLD'

    default:
      return 'HOLD'
  }
}

module.exports = {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  generateSignal,
}