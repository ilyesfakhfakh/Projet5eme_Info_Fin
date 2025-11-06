import { http } from './http';

export const listUsers = async (params = {}) => {
  console.log('Paramètres de la requête listUsers:', params);
  const response = await http.get('/users', { params });
  console.log('Réponse de listUsers:', response);
  if (response && response.data) {
    console.log('Premier utilisateur de la liste:', response.data[0]);
  }
  return response;
};

export const getUser = async (id) => {
  try {
    console.log(`Tentative de récupération de l'utilisateur avec l'ID: ${id}`);
    const response = await http.get(`/users/${id}`);
    console.log('Réponse du serveur pour getUser:', response);
    
    if (!response) {
      console.error('Aucune réponse du serveur');
      throw new Error('Aucune réponse du serveur');
    }
    
    if (!response.success && response.message) {
      console.error('Erreur du serveur:', response.message);
      throw new Error(response.message);
    }
    
    // Retourne les données de l'utilisateur si elles existent, sinon retourne null
    return response.data || null;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    throw error;
  }
};

export const createUser = async (userData) => {
  const response = await http.post('/users', userData);
  return response.data;
};

export const updateUser = async (id, userData) => {
  const response = await http.put(`/users/${id}`, userData);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await http.delete(`/users/${id}`);
  return response.data;
};

export const setUserRoles = async (id, roles) => {
  const response = await http.put(`/users/${id}/roles`, { roles });
  return response.data;
};

export const getUserStats = async (id) => {
  try {
    console.log(`Tentative de récupération des statistiques pour l'utilisateur ID: ${id}`);
    const response = await http.get(`/users/${id}/stats`);
    console.log('Réponse du serveur pour getUserStats:', response);
    
    if (!response) {
      console.error('Aucune réponse du serveur pour les statistiques');
      return {
        activity: {
          recent_actions: 0,
          total_portfolios: 0
        },
        sessions: []
      };
    }
    
    // S'assurer que la réponse a la structure attendue
    return {
      activity: {
        recent_actions: response.activity?.recent_actions || 0,
        total_portfolios: response.activity?.total_portfolios || 0
      },
      sessions: response.sessions || []
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    // Retourner une structure par défaut en cas d'erreur
    return {
      activity: {
        recent_actions: 0,
        total_portfolios: 0
      },
      sessions: []
    };
  }
};

export const unlockUser = async (id) => {
  const response = await http.put(`/users/${id}/unlock`);
  return response.data;
};

export const resetPassword = async (id, passwordData) => {
  const response = await http.post(`/user/${id}/reset-password`, passwordData);
  return response.data;
};

/**
 * Récupère les informations de sécurité d'un utilisateur
 */
export const getUserSecurityInfo = async (id) => {
  try {
    console.log(`Tentative de récupération des informations de sécurité pour l'utilisateur ID: ${id}`);
    const response = await http.get(`/user/${id}`);
    console.log('Réponse du serveur pour getUserSecurityInfo:', response);
    
    if (!response || !response.data) {
      console.error('Aucune donnée dans la réponse du serveur');
      throw new Error('Aucune donnée reçue du serveur');
    }
    
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des informations de sécurité:', error);
    throw error;
  }
};

/**
 * Met à jour les paramètres de sécurité d'un utilisateur
 */
export const updateUserSecurity = async (id, securityData) => {
  try {
    console.log(`Mise à jour des paramètres de sécurité pour l'utilisateur ID: ${id}`, securityData);
    const response = await http.put(`/user/${id}/security`, securityData);
    console.log('Réponse du serveur pour updateUserSecurity:', response);
    
    if (!response || !response.success) {
      const errorMessage = response?.message || 'Échec de la mise à jour des paramètres de sécurité';
      console.error('Erreur du serveur:', errorMessage);
      throw new Error(errorMessage);
    }
    
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres de sécurité:', error);
    throw error;
  }
};

/**
 * Active ou désactive l'authentification à deux facteurs
 */
export const toggleTwoFactorAuth = async (id, enable) => {
  try {
    console.log(`${enable ? 'Activation' : 'Désactivation'} de l'authentification à deux facteurs pour l'utilisateur ID: ${id}`);
    const response = await http.post(`/users/${id}/two-factor`, { enable });
    console.log('Réponse du serveur pour toggleTwoFactorAuth:', response);
    
    if (!response || !response.success) {
      const errorMessage = response?.message || `Échec de ${enable ? 'l\'activation' : 'la désactivation'} de l'authentification à deux facteurs`;
      console.error('Erreur du serveur:', errorMessage);
      throw new Error(errorMessage);
    }
    
    return response.data || response; // S'assurer de retourner les données même si elles sont à la racine
  } catch (error) {
    console.error('Erreur lors de la modification de l\'authentification à deux facteurs:', error);
    throw error;
  }
};

export const getUserAuditLogs = async (id, params = {}) => {
  try {
    console.log(`Tentative de récupération des logs d'audit pour l'utilisateur ID: ${id}`);
    const response = await http.get(`/users/${id}/audit-logs`, { 
      ...params,
      page: params.page || 1,
      pageSize: params.pageSize || 10
    });
    
    console.log('Réponse du serveur pour getUserAuditLogs:', response);
    
    // S'assurer que la réponse a la structure attendue
    return {
      data: Array.isArray(response.data) ? response.data : [],
      total: response.total || 0,
      page: response.page || 1,
      pageSize: response.pageSize || 10
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des logs d\'audit:', error);
    // Retourner une structure par défaut en cas d'erreur
    return {
      data: [],
      total: 0,
      page: params.page || 1,
      pageSize: params.pageSize || 10
    };
  }
};

export const exportUsers = async (params = {}) => {
  const response = await http.get('/users/export', { 
    params,
    responseType: 'blob'
  });
  return response;
};