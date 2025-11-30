import { http } from './http';

export async function login(email, password) {
  // Vérification des paramètres d'entrée
  if (!email || !password) {
    const error = new Error('Veuillez fournir un email et un mot de passe');
    error.status = 400;
    throw error;
  }

  const credentials = { 
    email: email.trim(),
    password: password
  };
  
  console.log('Tentative de connexion avec:', { email: credentials.email });
  
  try {
    const res = await http.post('/auth/login', credentials, { 
      auth: false,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return res; // { user, token, session_id }
  } catch (error) {
    console.error('Erreur de connexion détaillée:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data
      }
    });
    
    // Gestion des erreurs spécifiques
    if (error.response) {
      const { status, data } = error.response;
      
      if (status === 401) {
        if (data?.message?.includes('vérifier votre adresse email')) {
          const emailNotVerifiedError = new Error('Veuvez vérifier votre adresse email avant de vous connecter');
          emailNotVerifiedError.code = 'EMAIL_NOT_VERIFIED';
          throw emailNotVerifiedError;
        }
        
        const authError = new Error('Email ou mot de passe incorrect');
        authError.code = 'INVALID_CREDENTIALS';
        throw authError;
      }
      
      if (status >= 500) {
        const serverError = new Error('Erreur serveur. Veuillez réessayer plus tard.');
        serverError.code = 'SERVER_ERROR';
        throw serverError;
      }
    }
    
    // Pour les autres types d'erreurs (réseau, etc.)
    const networkError = new Error('Erreur de connexion. Vérifiez votre connexion internet.');
    networkError.code = 'NETWORK_ERROR';
    throw networkError;
  }
}

export async function register(payload) {
  try {
    // Si le payload est une instance de FormData, on ne veut pas de Content-Type JSON
    const isFormData = payload instanceof FormData;
    const options = { 
      auth: false,
      headers: isFormData ? {} : { 'Content-Type': 'application/json' }
    };
    const response = await http.post('/auth/register', payload, options);
    
    // Retourner la réponse du serveur telle quelle
    return response;
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    throw error;
  }
}

export async function me() {
  return http.get('/auth/me');
}

export async function logout() {
  return http.post('/auth/logout', {});
}

/**
 * Vérifie un code OTP pour la vérification d'email
 * @param {string} userId - L'ID de l'utilisateur
 * @param {string} otpCode - Le code OTP à 6 chiffres
 * @returns {Promise<Object>} - La réponse du serveur
 */
/**
 * Vérifie un email avec un code OTP
 * @param {string|Object} params - Soit un userId et otpCode, soit un objet avec email et otp
 * @param {string} [otpCode] - Le code OTP (si le premier paramètre est un userId)
 * @returns {Promise<Object>} - La réponse du serveur
 */
export async function verifyEmail(params, otpCode) {
  try {
    let data;
    
    // Gérer les deux signatures de fonction possibles
    if (typeof params === 'string' && otpCode) {
      // Ancienne signature: verifyEmail(userId, otpCode)
      data = { userId: params, otp: otpCode };
    } else if (typeof params === 'object' && params.email && params.otp) {
      // Nouvelle signature: verifyEmail({ email, otp })
      data = { email: params.email, otp: params.otp };
    } else {
      throw new Error('Paramètres invalides pour la vérification d\'email');
    }
    
    const response = await http.post('/auth/verify-email', data, { auth: false });
    return response;
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'email:', error);
    throw error;
  }
}

/**
 * Demande un nouveau code de vérification
 * @param {string} userId - L'ID de l'utilisateur
 * @returns {Promise<Object>} - La réponse du serveur
 */
export async function resendVerificationCode(userId) {
  try {
    const response = await http.post('/auth/resend-verification', { userId }, { auth: false });
    return response;
  } catch (error) {
    console.error('Erreur lors de la demande de nouveau code:', error);
    throw error;
  }
}

/**
 * Vérifie si l'authentification à deux facteurs est requise pour l'utilisateur actuel
 * @returns {Promise<Object>} - La réponse du serveur avec les informations 2FA
 */
export async function checkTwoFactorRequirement() {
  try {
    const response = await http.get('/auth/check-2fa');
    return response;
  } catch (error) {
    console.error('Erreur lors de la vérification 2FA:', error);
    
    // Améliorer les messages d'erreur
    if (error.response?.data?.message) {
      error.message = error.response.data.message;
    } else if (error.response?.status === 401) {
      error.message = 'Non autorisé. Veuillez vous reconnecter.';
    } else {
      error.message = 'Erreur lors de la vérification 2FA';
    }
    
    throw error;
  }
}

/**
 * Vérifie un code d'authentification à deux facteurs
 * @param {Object} params - Les paramètres de vérification
 * @param {string} params.userId - L'ID de l'utilisateur
 * @param {string} params.code - Le code de vérification à 6 chiffres
 * @returns {Promise<Object>} - La réponse du serveur
 */
export async function verifyTwoFactorCode({ userId, code }) {
  if (!userId || !code) {
    const error = new Error('L\'ID utilisateur et le code sont requis');
    error.status = 400;
    throw error;
  }

  try {
    const response = await http.post('/auth/verify-2fa', { userId, code });
    return response;
  } catch (error) {
    console.error('Erreur lors de la vérification du code 2FA:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    // Améliorer les messages d'erreur
    if (error.response?.data?.message) {
      error.message = error.response.data.message;
    } else if (error.response?.status === 400) {
      error.message = 'Code de vérification invalide ou expiré';
    } else if (error.response?.status === 401) {
      error.message = 'Non autorisé. Veuillez vous reconnecter.';
    } else if (error.response?.status === 404) {
      error.message = 'Utilisateur non trouvé';
    } else {
      error.message = 'Erreur lors de la vérification du code';
    }
    
    throw error;
  }
}

// Default export for compatibility with api/index.js
export default {
  login,
  register,
  me,
  logout,
  verifyEmail,
  resendVerificationCode,
  checkTwoFactorRequirement,
  verifyTwoFactorCode
};
