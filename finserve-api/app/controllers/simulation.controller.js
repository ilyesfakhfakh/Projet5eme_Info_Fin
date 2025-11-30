const timeManager = require('../services/time-manager.service');
const dataGenerator = require('../services/data-generator.service');
const dataImport = require('../services/data-import.service');

class SimulationController {
  // Get current simulation state
  async getState(req, res) {
    try {
      const state = timeManager.getState();
      res.json({
        success: true,
        data: state
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Start simulation
  async start(req, res) {
    try {
      const config = req.body;
      const state = timeManager.startSimulation(config);

      res.json({
        success: true,
        data: state,
        message: 'Simulation started successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // Pause simulation
  async pause(req, res) {
    try {
      const state = timeManager.pauseSimulation();
      res.json({
        success: true,
        data: state,
        message: 'Simulation paused'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // Resume simulation
  async resume(req, res) {
    try {
      const state = timeManager.resumeSimulation();
      res.json({
        success: true,
        data: state,
        message: 'Simulation resumed'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // Stop simulation
  async stop(req, res) {
    try {
      const state = timeManager.stopSimulation();
      res.json({
        success: true,
        data: state,
        message: 'Simulation stopped'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // Reset simulation
  async reset(req, res) {
    try {
      const state = timeManager.resetSimulation();
      res.json({
        success: true,
        data: state,
        message: 'Simulation reset'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Set simulation speed
  async setSpeed(req, res) {
    try {
      const { speed } = req.body;
      if (typeof speed !== 'number' || speed <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Speed must be a positive number'
        });
      }

      const state = timeManager.setSpeed(speed);
      res.json({
        success: true,
        data: state,
        message: `Speed set to ${speed}x`
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // Jump to specific date
  async jumpToDate(req, res) {
    try {
      const { date } = req.body;
      if (!date) {
        return res.status(400).json({
          success: false,
          error: 'Date is required'
        });
      }

      const state = timeManager.jumpToDate(date);
      res.json({
        success: true,
        data: state,
        message: `Jumped to ${new Date(date).toISOString()}`
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

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
        data: { asset, price, timestamp: timeManager.getCurrentTime() }
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

  // Import data from CSV
  async importCSV(req, res) {
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

  // Import data from Yahoo Finance
  async importYahooFinance(req, res) {
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

  // Import data from Alpha Vantage
  async importAlphaVantage(req, res) {
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

  // Get imported data
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

  // Save simulation snapshot
  async saveSnapshot(req, res) {
    try {
      const snapshot = timeManager.saveSnapshot();

      // In a real implementation, you'd save this to a database or file
      // For now, we'll just return it
      res.json({
        success: true,
        data: snapshot,
        message: 'Snapshot saved'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Load simulation snapshot
  async loadSnapshot(req, res) {
    try {
      const { snapshot } = req.body;

      if (!snapshot) {
        return res.status(400).json({
          success: false,
          error: 'Snapshot data is required'
        });
      }

      const state = timeManager.loadSnapshot(snapshot);

      res.json({
        success: true,
        data: state,
        message: 'Snapshot loaded'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get simulation metrics
  async getMetrics(req, res) {
    try {
      const state = timeManager.getState();
      res.json({
        success: true,
        data: state.metrics
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Schedule an event
  async scheduleEvent(req, res) {
    try {
      const { event, scheduledTime } = req.body;

      if (!event || !scheduledTime) {
        return res.status(400).json({
          success: false,
          error: 'Event and scheduledTime are required'
        });
      }

      const eventId = timeManager.scheduleEvent(event, scheduledTime);

      res.json({
        success: true,
        data: { eventId },
        message: 'Event scheduled'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new SimulationController();