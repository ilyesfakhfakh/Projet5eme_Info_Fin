const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3200/api/v1';

function getToken() {
  try {
    const raw = localStorage.getItem('auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token || null;
  } catch (_) {
    return null;
  }
}

async function request(path, { method = 'GET', headers = {}, body, params, auth = true } = {}) {
  const isFormData = body instanceof FormData;
  
  const init = { 
    method, 
    headers: { 
      ...(!isFormData && { 'Content-Type': 'application/json' }), // Ne pas définir Content-Type pour FormData
      ...headers 
    },
    body: isFormData ? body : (body !== undefined ? JSON.stringify(body) : undefined),
    credentials: 'include' // Important pour les cookies de session
  };
  
  if (auth) {
    const token = getToken();
    if (token) init.headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (method === 'GET' && params) {
    const urlParams = new URLSearchParams(params);
    path += `?${urlParams.toString()}`;
  }

  try {
    console.log(`[HTTP] ${method} ${path}`, { body: body ? { ...body, password: body.password ? '***' : undefined } : undefined });
    const res = await fetch(`${BASE_URL}${path}`, init);
    
    // Gestion des réponses d'erreur
    if (!res.ok) {
      let errorData;
      const contentType = res.headers.get('content-type');
      
      try {
        // Essayer de parser la réponse en JSON
        errorData = contentType?.includes('application/json') ? await res.json() : await res.text();
      } catch (e) {
        // En cas d'échec de parsing, utiliser le texte brut
        errorData = await res.text();
      }
      
      // Créer un objet d'erreur détaillé
      const error = new Error(
        typeof errorData === 'object' 
          ? errorData.message || 'Une erreur est survenue' 
          : 'Erreur de connexion au serveur'
      );
      
      error.status = res.status;
      error.data = errorData;
      
      // Gestion spécifique des erreurs 401 (Non autorisé)
      if (res.status === 401) {
        error.code = 'UNAUTHORIZED';
        // Optionnel: déconnecter l'utilisateur ou supprimer le token invalide
        localStorage.removeItem('auth');
      }
      
      console.error(`[HTTP Error] ${method} ${path}`, {
        status: res.status,
        statusText: res.statusText,
        error: errorData
      });
      
      throw error;
    }
    
    // Traitement de la réponse réussie
    const responseContentType = res.headers.get('content-type') || '';
    if (responseContentType.includes('application/json')) {
      return res.json();
    }
    
    return res.text();
    
  } catch (error) {
    console.error(`[HTTP Request Failed] ${method} ${path}`, error);
    
    // Améliorer les messages d'erreur pour les problèmes de réseau
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      const networkError = new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      networkError.code = 'NETWORK_ERROR';
      throw networkError;
    }
    
    // Propager l'erreur originale si elle a déjà été traitée
    if (error.status) throw error;
    
    // Créer une erreur générique pour les autres cas
    const genericError = new Error('Une erreur inattendue est survenue');
    genericError.code = 'UNKNOWN_ERROR';
    genericError.originalError = error;
    throw genericError;
  }
}

export const http = {
  get: (p, opts) => request(p, { ...opts, method: 'GET' }),
  post: (p, body, opts) => request(p, { ...opts, method: 'POST', body }),
  put: (p, body, opts) => request(p, { ...opts, method: 'PUT', body }),
  del: (p, opts) => request(p, { ...opts, method: 'DELETE' })
};

export default http;
