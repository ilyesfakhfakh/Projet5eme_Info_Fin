const timeManager = require('./time-manager.service');

class DataGeneratorService {
  constructor() {
    this.priceHistory = new Map(); // asset -> price history
    this.lastPrices = new Map(); // asset -> last price
    this.parameters = new Map(); // asset -> GBM parameters
  }

  // Initialize asset with GBM parameters
  initializeAsset(asset, initialPrice, params = {}) {
    const defaultParams = {
      drift: 0.1,        // μ - annual drift (10%)
      volatility: 0.2,   // σ - annual volatility (20%)
      timeStep: 1/252    // Δt - daily time step (252 trading days per year)
    };

    const gbmParams = { ...defaultParams, ...params };
    this.parameters.set(asset, gbmParams);
    this.lastPrices.set(asset, initialPrice);
    this.priceHistory.set(asset, [{
      timestamp: timeManager.getCurrentTime(),
      price: initialPrice
    }]);
  }

  // Generate next price using Geometric Brownian Motion
  generateNextPrice(asset) {
    const params = this.parameters.get(asset);
    if (!params) {
      throw new Error(`Asset ${asset} not initialized`);
    }

    const lastPrice = this.lastPrices.get(asset);
    const { drift, volatility, timeStep } = params;

    // Generate random normal variable (Box-Muller transform)
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

    // GBM formula: S(t+1) = S(t) * exp((μ - σ²/2) * Δt + σ * √Δt * Z)
    const driftTerm = (drift - Math.pow(volatility, 2) / 2) * timeStep;
    const diffusionTerm = volatility * Math.sqrt(timeStep) * z;
    const returnRate = driftTerm + diffusionTerm;

    const newPrice = lastPrice * Math.exp(returnRate);

    // Update state
    this.lastPrices.set(asset, newPrice);
    const pricePoint = {
      timestamp: timeManager.getCurrentTime(),
      price: newPrice
    };
    this.priceHistory.get(asset).push(pricePoint);

    return newPrice;
  }

  // Generate OHLCV data for a time period
  generateOHLCV(asset, interval = '1m') {
    const currentPrice = this.generateNextPrice(asset);
    const history = this.priceHistory.get(asset);

    if (history.length < 2) {
      // First data point
      return {
        timestamp: timeManager.getCurrentTime(),
        open: currentPrice,
        high: currentPrice,
        low: currentPrice,
        close: currentPrice,
        volume: Math.random() * 1000 + 100 // Random volume
      };
    }

    const previousPrice = history[history.length - 2].price;

    // Generate OHLC based on current price movement
    const volatility = this.parameters.get(asset).volatility;
    const range = currentPrice * volatility * Math.sqrt(1/252); // Daily range

    const open = previousPrice;
    const close = currentPrice;
    const high = Math.max(open, close) + Math.random() * range;
    const low = Math.min(open, close) - Math.random() * range;

    const volume = Math.random() * 10000 + 1000; // Random volume

    return {
      timestamp: timeManager.getCurrentTime(),
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume: Math.round(volume)
    };
  }

  // Generate multiple assets with correlation
  generateCorrelatedPrices(assets, correlations) {
    const results = {};

    // Generate base innovations
    const innovations = {};
    assets.forEach(asset => {
      const u1 = Math.random();
      const u2 = Math.random();
      innovations[asset] = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    });

    // Apply correlations and generate prices
    assets.forEach(asset => {
      const params = this.parameters.get(asset);
      if (!params) return;

      const lastPrice = this.lastPrices.get(asset);
      const { drift, volatility, timeStep } = params;

      // Apply correlation to innovation
      let correlatedZ = innovations[asset];
      assets.forEach(otherAsset => {
        if (otherAsset !== asset && correlations[asset] && correlations[asset][otherAsset]) {
          correlatedZ = correlatedZ * (1 - correlations[asset][otherAsset]) +
                        innovations[otherAsset] * correlations[asset][otherAsset];
        }
      });

      // GBM formula
      const driftTerm = (drift - Math.pow(volatility, 2) / 2) * timeStep;
      const diffusionTerm = volatility * Math.sqrt(timeStep) * correlatedZ;
      const returnRate = driftTerm + diffusionTerm;

      const newPrice = lastPrice * Math.exp(returnRate);
      results[asset] = newPrice;

      // Update state
      this.lastPrices.set(asset, newPrice);
      this.priceHistory.get(asset).push({
        timestamp: timeManager.getCurrentTime(),
        price: newPrice
      });
    });

    return results;
  }

  // Generate historical data for backtesting
  generateHistoricalData(asset, startDate, endDate, interval = '1d') {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const data = [];

    // Save current state
    const currentTime = timeManager.getCurrentTime();
    const currentPrice = this.lastPrices.get(asset);

    // Reset to start date
    timeManager.jumpToDate(start);
    this.lastPrices.set(asset, currentPrice); // Keep initial price

    let current = new Date(start);
    while (current <= end) {
      const ohlcv = this.generateOHLCV(asset, interval);
      data.push(ohlcv);

      // Advance time
      const intervalMs = {
        '1m': 60000,
        '5m': 300000,
        '1h': 3600000,
        '1d': 86400000
      }[interval] || 86400000;

      current = new Date(current.getTime() + intervalMs);
      timeManager.jumpToDate(current);
    }

    // Restore original time
    timeManager.jumpToDate(currentTime);

    return data;
  }

  // Get current price for asset
  getCurrentPrice(asset) {
    return this.lastPrices.get(asset);
  }

  // Get price history for asset
  getPriceHistory(asset, limit = null) {
    const history = this.priceHistory.get(asset) || [];
    return limit ? history.slice(-limit) : history;
  }

  // Reset asset data
  resetAsset(asset) {
    this.priceHistory.delete(asset);
    this.lastPrices.delete(asset);
    this.parameters.delete(asset);
  }

  // Get all assets
  getAssets() {
    return Array.from(this.parameters.keys());
  }

  // Update GBM parameters for asset
  updateParameters(asset, newParams) {
    const currentParams = this.parameters.get(asset);
    if (currentParams) {
      this.parameters.set(asset, { ...currentParams, ...newParams });
    }
  }
}

module.exports = new DataGeneratorService();