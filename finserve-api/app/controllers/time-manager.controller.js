const timeManager = require('../services/time-manager.service');

class TimeManagerController {
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

  // Advance time manually
  async advanceTime(req, res) {
    try {
      const { duration } = req.body;

      if (typeof duration !== 'number') {
        return res.status(400).json({
          success: false,
          error: 'Duration must be a number (milliseconds)'
        });
      }

      const state = timeManager.advanceTime(duration);
      res.json({
        success: true,
        data: state,
        message: `Advanced time by ${duration}ms`
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get current simulation time
  async getCurrentTime(req, res) {
    try {
      const currentTime = timeManager.getCurrentTime();
      res.json({
        success: true,
        data: { currentTime }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new TimeManagerController();