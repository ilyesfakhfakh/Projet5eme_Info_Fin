const dataImport = require('../services/data-import.service');

class DataImportController {
  // Import data from CSV file
  async importFromCSV(req, res) {
    try {
      const { asset, filePath, options } = req.body;

      if (!asset || !filePath) {
        return res.status(400).json({
          success: false,
          error: 'Asset and filePath are required'
        });
      }

      const result = await dataImport.importFromCSV(asset, filePath, options);

      res.json({
        success: true,
        data: result,
        message: `Imported ${result.count} data points for ${asset}`
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // Import data from Yahoo Finance API
  async importFromYahooFinance(req, res) {
    try {
      const { asset, period, interval } = req.body;

      if (!asset) {
        return res.status(400).json({
          success: false,
          error: 'Asset is required'
        });
      }

      const result = await dataImport.importFromYahooFinance(asset, period, interval);

      res.json({
        success: true,
        data: result,
        message: `Imported ${result.count} data points for ${asset} from Yahoo Finance`
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // Import data from Alpha Vantage API
  async importFromAlphaVantage(req, res) {
    try {
      const { asset, apiKey, options } = req.body;

      if (!asset || !apiKey) {
        return res.status(400).json({
          success: false,
          error: 'Asset and apiKey are required'
        });
      }

      const result = await dataImport.importFromAlphaVantage(asset, apiKey, options);

      res.json({
        success: true,
        data: result,
        message: `Imported ${result.count} data points for ${asset} from Alpha Vantage`
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get imported data for asset
  async getImportedData(req, res) {
    try {
      const { asset } = req.params;
      const { startDate, endDate } = req.query;

      const data = dataImport.getImportedData(asset, startDate, endDate);

      res.json({
        success: true,
        data: { asset, data }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Validate imported data
  async validateData(req, res) {
    try {
      const { asset } = req.params;
      const validation = dataImport.validateData(asset);

      res.json({
        success: true,
        data: validation
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get next data point for backtesting
  async getNextDataPoint(req, res) {
    try {
      const { asset } = req.params;
      const { currentTime } = req.query;

      if (!currentTime) {
        return res.status(400).json({
          success: false,
          error: 'currentTime query parameter is required'
        });
      }

      const dataPoint = dataImport.getNextDataPoint(asset, currentTime);

      res.json({
        success: true,
        data: { asset, dataPoint }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get list of imported assets
  async getImportedAssets(req, res) {
    try {
      const assets = dataImport.getImportedAssets();
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

  // Clear imported data
  async clearData(req, res) {
    try {
      const { asset } = req.params;
      dataImport.clearData(asset);

      res.json({
        success: true,
        message: asset ? `Data cleared for ${asset}` : 'All imported data cleared'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Export data to CSV
  async exportToCSV(req, res) {
    try {
      const { asset, filePath } = req.body;

      if (!asset || !filePath) {
        return res.status(400).json({
          success: false,
          error: 'Asset and filePath are required'
        });
      }

      const result = await dataImport.exportToCSV(asset, filePath);

      res.json({
        success: true,
        data: result,
        message: `Exported ${result.exportedCount} data points to ${filePath}`
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get data statistics
  async getDataStats(req, res) {
    try {
      const { asset } = req.params;
      const validation = dataImport.validateData(asset);

      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          data: validation
        });
      }

      res.json({
        success: true,
        data: {
          asset,
          stats: validation.stats
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Bulk import multiple assets
  async bulkImport(req, res) {
    try {
      const { imports } = req.body;

      if (!imports || !Array.isArray(imports)) {
        return res.status(400).json({
          success: false,
          error: 'Imports array is required'
        });
      }

      const results = [];
      for (const importConfig of imports) {
        try {
          let result;
          switch (importConfig.type) {
            case 'csv':
              result = await dataImport.importFromCSV(
                importConfig.asset,
                importConfig.filePath,
                importConfig.options
              );
              break;
            case 'yahoo':
              result = await dataImport.importFromYahooFinance(
                importConfig.asset,
                importConfig.period,
                importConfig.interval
              );
              break;
            case 'alpha':
              result = await dataImport.importFromAlphaVantage(
                importConfig.asset,
                importConfig.apiKey,
                importConfig.options
              );
              break;
            default:
              throw new Error(`Unknown import type: ${importConfig.type}`);
          }
          results.push({ success: true, ...result });
        } catch (error) {
          results.push({
            success: false,
            asset: importConfig.asset,
            error: error.message
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      res.json({
        success: true,
        data: {
          results,
          summary: {
            total: results.length,
            successful: successCount,
            failed: failureCount
          }
        },
        message: `Bulk import completed: ${successCount} successful, ${failureCount} failed`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get supported asset mappings
  async getSupportedAssets(req, res) {
    try {
      const mappings = {
        'BTC': 'BTC-USD',
        'ETH': 'ETH-USD',
        'AAPL': 'AAPL',
        'GOOGL': 'GOOGL',
        'SPY': 'SPY',
        'EURUSD': 'EURUSD=X',
        'GBPUSD': 'GBPUSD=X'
      };

      res.json({
        success: true,
        data: { mappings }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new DataImportController();