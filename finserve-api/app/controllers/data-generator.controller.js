const dataGenerator = require('../services/data-generator.service');

class DataGeneratorController {
  // Initialize asset for data generation
  async initializeAsset(req, res) {
    try {
      const { asset, initialPrice, params } = req.body;

      if (!asset || !initialPrice) {
        return res.status(400).json({
          success: false,
          error: 'Asset and initialPrice are required'
        });
      }

      dataGenerator.initializeAsset(asset, initialPrice, params);

      res.json({
        success: true,
        message: `Asset ${asset} initialized with price ${initialPrice}`
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get current price for asset
  async getCurrentPrice(req, res) {
    try {
      const { asset } = req.params;
      const price = dataGenerator.getCurrentPrice(asset);

      if (price === undefined) {
        return res.status(404).json({
          success: false,
          error: `Asset ${asset} not found`
        });
      }

      res.json({
        success: true,
        data: { asset, price }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get price history for asset
  async getPriceHistory(req, res) {
    try {
      const { asset } = req.params;
      const { limit } = req.query;

      const history = dataGenerator.getPriceHistory(asset, limit ? parseInt(limit) : null);

      res.json({
        success: true,
        data: { asset, history }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Generate next price for asset
  async generateNextPrice(req, res) {
    try {
      const { asset } = req.params;
      const newPrice = dataGenerator.generateNextPrice(asset);

      res.json({
        success: true,
        data: { asset, price: newPrice }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // Generate OHLCV data for asset
  async generateOHLCV(req, res) {
    try {
      const { asset } = req.params;
      const { interval } = req.query;

      const ohlcv = dataGenerator.generateOHLCV(asset, interval);

      res.json({
        success: true,
        data: { asset, ohlcv }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // Generate correlated prices for multiple assets
  async generateCorrelatedPrices(req, res) {
    try {
      const { assets, correlations } = req.body;

      if (!assets || !Array.isArray(assets) || assets.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Assets array is required'
        });
      }

      const prices = dataGenerator.generateCorrelatedPrices(assets, correlations || {});

      res.json({
        success: true,
        data: { prices }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // Generate historical data for backtesting
  async generateHistoricalData(req, res) {
    try {
      const { asset, startDate, endDate, interval } = req.body;

      if (!asset || !startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'Asset, startDate, and endDate are required'
        });
      }

      const data = dataGenerator.generateHistoricalData(asset, startDate, endDate, interval);

      res.json({
        success: true,
        data: { asset, data },
        message: `Generated ${data.length} data points`
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get all initialized assets
  async getAssets(req, res) {
    try {
      const assets = dataGenerator.getAssets();
      res.json({
        success: true,
        data: { assets }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Update GBM parameters for asset
  async updateParameters(req, res) {
    try {
      const { asset } = req.params;
      const { params } = req.body;

      if (!params) {
        return res.status(400).json({
          success: false,
          error: 'Parameters are required'
        });
      }

      dataGenerator.updateParameters(asset, params);

      res.json({
        success: true,
        message: `Parameters updated for ${asset}`
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // Reset asset data
  async resetAsset(req, res) {
    try {
      const { asset } = req.params;
      dataGenerator.resetAsset(asset);

      res.json({
        success: true,
        message: `Asset ${asset} reset`
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get GBM parameters for asset
  async getParameters(req, res) {
    try {
      const { asset } = req.params;

      // This would need to be added to the service
      // For now, return a placeholder
      res.json({
        success: true,
        data: {
          asset,
          params: {
            drift: 0.1,
            volatility: 0.2,
            timeStep: 1/252
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Generate multiple ticks for asset
  async generateTicks(req, res) {
    try {
      const { asset, count } = req.body;

      if (!asset || !count) {
        return res.status(400).json({
          success: false,
          error: 'Asset and count are required'
        });
      }

      const ticks = [];
      for (let i = 0; i < count; i++) {
        const ohlcv = dataGenerator.generateOHLCV(asset);
        ticks.push(ohlcv);
      }

      res.json({
        success: true,
        data: { asset, ticks },
        message: `Generated ${count} ticks`
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new DataGeneratorController();