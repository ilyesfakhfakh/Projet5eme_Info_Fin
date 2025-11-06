import { http } from './http';

// Récupérer les métriques de risque pour un portfolio
export const getRiskMetrics = async (portfolioId) => {
  try {
    console.log(`Tentative de récupération des métriques de risque pour le portfolio ID: ${portfolioId}`);
    const response = await http.get(`/risk/metrics/${portfolioId}`);
    console.log('Réponse du serveur pour getRiskMetrics:', response);
    return response;
  } catch (error) {
    console.error('Erreur lors de la récupération des métriques de risque:', error);
    throw error;
  }
};

// Récupérer les alertes de risque
export const getRiskAlerts = async (portfolioId) => {
  try {
    console.log(`Tentative de récupération des alertes de risque pour le portfolio ID: ${portfolioId}`);
    const response = await http.get(`/risk/alerts/${portfolioId}`);
    console.log('Réponse du serveur pour getRiskAlerts:', response);
    return response;
  } catch (error) {
    console.error('Erreur lors de la récupération des alertes de risque:', error);
    throw error;
  }
};

// Calculer l'évaluation des risques
export const calculateRiskAssessment = async (portfolioId, data) => {
  try {
    console.log(`Calcul de l'évaluation des risques pour le portfolio ID: ${portfolioId}`, data);
    const response = await http.post(`/risk/assessment/${portfolioId}`, data);
    console.log('Réponse du serveur pour calculateRiskAssessment:', response);
    return response;
  } catch (error) {
    console.error('Erreur lors du calcul de l\'évaluation des risques:', error);
    throw error;
  }
};

// Récupérer les limites de risque
export const getRiskLimits = async (portfolioId) => {
  try {
    console.log(`Tentative de récupération des limites de risque pour le portfolio ID: ${portfolioId}`);
    const response = await http.get(`/risk/limits/${portfolioId}`);
    console.log('Réponse du serveur pour getRiskLimits:', response);
    return response;
  } catch (error) {
    console.error('Erreur lors de la récupération des limites de risque:', error);
    throw error;
  }
};

// Mettre à jour les limites de risque
export const updateRiskLimits = async (portfolioId, limits) => {
  try {
    console.log(`Mise à jour des limites de risque pour le portfolio ID: ${portfolioId}`, limits);
    const response = await http.put(`/risk/limits/${portfolioId}`, limits);
    console.log('Réponse du serveur pour updateRiskLimits:', response);
    return response;
  } catch (error) {
    console.error('Erreur lors de la mise à jour des limites de risque:', error);
    throw error;
  }
};

// Analyser les scénarios de risque
export const runScenarioAnalysis = async (portfolioId, scenario) => {
  try {
    console.log(`Analyse de scénario pour le portfolio ID: ${portfolioId}`, scenario);
    const response = await http.post(`/risk/scenario/${portfolioId}`, scenario);
    console.log('Réponse du serveur pour runScenarioAnalysis:', response);
    return response;
  } catch (error) {
    console.error('Erreur lors de l\'analyse de scénario:', error);
    throw error;
  }
};

// Récupérer le tableau de bord des risques
export const getRiskDashboard = async (portfolioId) => {
  try {
    console.log(`Tentative de récupération du tableau de bord des risques pour le portfolio ID: ${portfolioId}`);
    const response = await http.get(`/risk/dashboard/${portfolioId}`);
    console.log('Réponse du serveur pour getRiskDashboard:', response);
    return response;
  } catch (error) {
    console.error('Erreur lors de la récupération du tableau de bord des risques:', error);
    throw error;
  }
};

// Récupérer les données de visualisation des risques
export const getRiskVisualization = async (portfolioId, params = {}) => {
  try {
    console.log(`Tentative de récupération des données de visualisation pour le portfolio ID: ${portfolioId}`);
    const response = await http.get(`/risk/visualization/${portfolioId}`, { params });
    console.log('Réponse du serveur pour getRiskVisualization:', response);
    return response;
  } catch (error) {
    console.error('Erreur lors de la récupération des données de visualisation:', error);
    throw error;
  }
};