const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');

class TimeManagerService extends EventEmitter {
  constructor() {
    super();
    this.simulationState = this.initializeSimulationState();
    this.eventQueue = [];
    this.intervalId = null;
    this.lastTickTime = null;
  }

  initializeSimulationState() {
    return {
      simulation_id: null,
      current_time: new Date(),
      start_time: null,
      end_time: null,
      mode: 'REAL', // 'REAL', 'FAST', 'BACKTEST'
      speed_multiplier: 1,
      status: 'STOPPED', // 'STOPPED', 'RUNNING', 'PAUSED'
      events_processed: 0,
      ticks_generated: 0,
      tick_interval: '1m', // '1s', '1m', '5m', '1h'
      auto_generate_data: true,
      metrics: {
        simulation_duration: 0,
        real_duration: 0,
        effective_speed: 0,
        events_per_second: 0,
        cpu_usage: 0,
        memory_usage: 0,
        orders_placed: 0,
        orders_executed: 0,
        trades_count: 0
      }
    };
  }

  // Basic control functions
  startSimulation(config = {}) {
    if (this.simulationState.status === 'RUNNING') {
      throw new Error('Simulation is already running');
    }

    this.simulationState.simulation_id = uuidv4();
    this.simulationState.start_time = new Date();
    this.simulationState.status = 'RUNNING';
    this.simulationState.mode = config.mode || 'REAL';
    this.simulationState.speed_multiplier = config.speed_multiplier || 1;
    this.simulationState.tick_interval = config.tick_interval || '1m';
    this.simulationState.auto_generate_data = config.auto_generate_data !== false;

    if (config.start_time) {
      this.simulationState.current_time = new Date(config.start_time);
    }

    if (config.end_time) {
      this.simulationState.end_time = new Date(config.end_time);
    }

    this.lastTickTime = Date.now();
    this.startTickLoop();

    this.emit('simulation-started', this.simulationState);
    return this.simulationState;
  }

  pauseSimulation() {
    if (this.simulationState.status !== 'RUNNING') {
      throw new Error('Simulation is not running');
    }

    this.simulationState.status = 'PAUSED';
    this.stopTickLoop();

    this.emit('simulation-paused', this.simulationState);
    return this.simulationState;
  }

  resumeSimulation() {
    if (this.simulationState.status !== 'PAUSED') {
      throw new Error('Simulation is not paused');
    }

    this.simulationState.status = 'RUNNING';
    this.startTickLoop();

    this.emit('simulation-resumed', this.simulationState);
    return this.simulationState;
  }

  stopSimulation() {
    if (this.simulationState.status === 'STOPPED') {
      return this.simulationState;
    }

    this.simulationState.status = 'STOPPED';
    this.stopTickLoop();

    // Calculate final metrics
    if (this.simulationState.start_time) {
      this.simulationState.metrics.real_duration = Date.now() - this.simulationState.start_time.getTime();
      this.simulationState.metrics.simulation_duration = this.simulationState.current_time.getTime() - this.simulationState.start_time.getTime();
      if (this.simulationState.metrics.real_duration > 0) {
        this.simulationState.metrics.effective_speed = this.simulationState.metrics.simulation_duration / this.simulationState.metrics.real_duration;
      }
    }

    this.emit('simulation-stopped', this.simulationState);
    return this.simulationState;
  }

  resetSimulation() {
    this.stopSimulation();
    this.simulationState = this.initializeSimulationState();
    this.eventQueue = [];
    this.emit('simulation-reset', this.simulationState);
    return this.simulationState;
  }

  // Time management functions
  getCurrentTime() {
    return this.simulationState.current_time;
  }

  setSpeed(multiplier) {
    this.simulationState.speed_multiplier = multiplier;
    this.emit('speed-changed', { speed: multiplier });
    return this.simulationState;
  }

  advanceTime(duration) {
    // duration in milliseconds
    this.simulationState.current_time = new Date(this.simulationState.current_time.getTime() + duration);
    this.processPendingEvents();
    this.emit('time-advanced', { newTime: this.simulationState.current_time });
    return this.simulationState;
  }

  jumpToDate(date) {
    this.simulationState.current_time = new Date(date);
    this.processPendingEvents();
    this.emit('time-jumped', { newTime: this.simulationState.current_time });
    return this.simulationState;
  }

  // Event scheduling system
  scheduleEvent(event, scheduledTime) {
    const eventItem = {
      id: uuidv4(),
      event,
      scheduledTime: new Date(scheduledTime),
      createdAt: new Date()
    };

    this.eventQueue.push(eventItem);
    this.eventQueue.sort((a, b) => a.scheduledTime - b.scheduledTime);

    return eventItem.id;
  }

  processPendingEvents() {
    const now = this.simulationState.current_time;
    const pendingEvents = this.eventQueue.filter(e => e.scheduledTime <= now);

    pendingEvents.forEach(eventItem => {
      this.emit('event-triggered', eventItem);
      this.simulationState.events_processed++;
    });

    this.eventQueue = this.eventQueue.filter(e => e.scheduledTime > now);
  }

  // Tick generation
  startTickLoop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    const intervalMs = this.getTickIntervalMs();

    this.intervalId = setInterval(() => {
      if (this.simulationState.status !== 'RUNNING') return;

      this.generateTick();
    }, intervalMs);
  }

  stopTickLoop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  getTickIntervalMs() {
    const interval = this.simulationState.tick_interval;
    const baseInterval = {
      '1s': 1000,
      '1m': 60000,
      '5m': 300000,
      '1h': 3600000
    }[interval] || 60000;

    // Adjust for speed multiplier
    if (this.simulationState.mode === 'FAST') {
      return Math.max(100, baseInterval / this.simulationState.speed_multiplier);
    }

    return baseInterval;
  }

  generateTick() {
    const now = Date.now();
    const timeDelta = now - this.lastTickTime;
    this.lastTickTime = now;

    // Advance simulation time based on mode
    let simulationTimeAdvance = timeDelta;

    if (this.simulationState.mode === 'FAST') {
      simulationTimeAdvance = timeDelta * this.simulationState.speed_multiplier;
    } else if (this.simulationState.mode === 'BACKTEST') {
      // In backtest mode, time advances based on data availability
      simulationTimeAdvance = this.getNextDataPointTime() - this.simulationState.current_time.getTime();
    }

    this.advanceTime(simulationTimeAdvance);

    // Generate market data if auto_generate is enabled
    if (this.simulationState.auto_generate_data) {
      this.generateMarketData();
    }

    this.simulationState.ticks_generated++;
    this.emit('tick-generated', {
      tickNumber: this.simulationState.ticks_generated,
      simulationTime: this.simulationState.current_time
    });
  }

  getNextDataPointTime() {
    // In backtest mode, this would return the next historical data timestamp
    // For now, return current time + tick interval
    const intervalMs = {
      '1s': 1000,
      '1m': 60000,
      '5m': 300000,
      '1h': 3600000
    }[this.simulationState.tick_interval] || 60000;

    return this.simulationState.current_time.getTime() + intervalMs;
  }

  // Market data generation using GBM
  generateMarketData() {
    // This will be implemented with GBM logic
    // For now, emit a placeholder event
    this.emit('market-data-generated', {
      timestamp: this.simulationState.current_time,
      prices: {} // Will contain generated OHLCV data
    });
  }

  // Snapshot functionality
  saveSnapshot() {
    const snapshot = {
      simulation_id: this.simulationState.simulation_id,
      timestamp: new Date(),
      time_state: {
        current_time: this.simulationState.current_time,
        speed: this.simulationState.speed_multiplier,
        mode: this.simulationState.mode
      },
      market_state: {
        // Will include prices, order book, etc.
      },
      portfolio_state: {
        // Will include cash, positions, etc.
      },
      strategy_state: {
        // Will include active strategies, signals, etc.
      },
      event_queue: this.eventQueue
    };

    this.emit('snapshot-saved', snapshot);
    return snapshot;
  }

  loadSnapshot(snapshot) {
    this.stopSimulation();

    this.simulationState.simulation_id = snapshot.simulation_id;
    this.simulationState.current_time = new Date(snapshot.time_state.current_time);
    this.simulationState.speed_multiplier = snapshot.time_state.speed;
    this.simulationState.mode = snapshot.time_state.mode;

    this.eventQueue = snapshot.event_queue || [];

    this.emit('snapshot-loaded', snapshot);
    return this.simulationState;
  }

  // Get current state
  getState() {
    return { ...this.simulationState };
  }

  // Update metrics
  updateMetrics(updates) {
    Object.assign(this.simulationState.metrics, updates);
  }
}

module.exports = new TimeManagerService();