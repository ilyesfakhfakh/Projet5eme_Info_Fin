import api from './api';

export const simulationService = {
  // Get all available simulation scenarios
  getScenarios: async () => {
    try {
      const response = await api.get('/simulation/scenarios');
      return response.data;
    } catch (error) {
      console.error('Error fetching simulation scenarios:', error);
      throw error;
    }
  },

  // Get a specific scenario by ID
  getScenario: async (scenarioId) => {
    try {
      const response = await api.get(`/simulation/scenarios/${scenarioId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching scenario:', error);
      throw error;
    }
  },

  // Start a new simulation
  startSimulation: async (scenarioId, parameters = {}) => {
    try {
      const response = await api.post(`/simulation/start/${scenarioId}`, parameters);
      return response.data;
    } catch (error) {
      console.error('Error starting simulation:', error);
      throw error;
    }
  },

  // Get simulation status
  getSimulationStatus: async (simulationId) => {
    try {
      const response = await api.get(`/simulation/status/${simulationId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting simulation status:', error);
      throw error;
    }
  },

  // Get simulation results
  getSimulationResults: async (simulationId) => {
    try {
      const response = await api.get(`/simulation/results/${simulationId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting simulation results:', error);
      throw error;
    }
  },

  // Stop a running simulation
  stopSimulation: async (simulationId) => {
    try {
      const response = await api.post(`/simulation/stop/${simulationId}`);
      return response.data;
    } catch (error) {
      console.error('Error stopping simulation:', error);
      throw error;
    }
  },

  // Get simulation history
  getSimulationHistory: async (limit = 10, offset = 0) => {
    try {
      const response = await api.get(`/simulation/history?limit=${limit}&offset=${offset}`);
      return response.data;
    } catch (error) {
      console.error('Error getting simulation history:', error);
      throw error;
    }
  }
};

export default simulationService;
