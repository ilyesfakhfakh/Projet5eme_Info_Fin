import { MARKET_API_BASE_URL } from './apiConfig';

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
      ...(!isFormData && { 'Content-Type': 'application/json' }),
      ...headers 
    },
    body: isFormData ? body : (body !== undefined ? JSON.stringify(body) : undefined),
    credentials: 'include'
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
    console.log(`[HTTP Market] ${method} ${path}`, { body: body ? { ...body, password: body.password ? '***' : undefined } : undefined });
    const res = await fetch(`${MARKET_API_BASE_URL}${path}`, init);
    
    if (!res.ok) {
      let errorData;
      const contentType = res.headers.get('content-type');
      
      try {
        errorData = contentType?.includes('application/json') ? await res.json() : await res.text();
      } catch (e) {
        errorData = await res.text();
      }
      
      const error = new Error(
        typeof errorData === 'object' 
          ? errorData.message || 'Une erreur est survenue' 
          : 'Erreur de connexion au serveur'
      );
      
      error.status = res.status;
      error.data = errorData;
      
      if (res.status === 401) {
        error.code = 'UNAUTHORIZED';
        localStorage.removeItem('auth');
      }
      
      console.error(`[HTTP Market Error] ${method} ${path}`, {
        status: res.status,
        statusText: res.statusText,
        error: errorData
      });
      
      throw error;
    }
    
    const responseContentType = res.headers.get('content-type') || '';
    if (responseContentType.includes('application/json')) {
      return res.json();
    }
    
    return res.text();
    
  } catch (error) {
    console.error(`[HTTP Market Request Failed] ${method} ${path}`, error);
    
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      const networkError = new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      networkError.code = 'NETWORK_ERROR';
      throw networkError;
    }
    
    if (error.status) throw error;
    
    const genericError = new Error('Une erreur inattendue est survenue');
    genericError.code = 'UNKNOWN_ERROR';
    genericError.originalError = error;
    throw genericError;
  }
}

export const httpMarket = {
  get: (p, opts) => request(p, { ...opts, method: 'GET' }),
  post: (p, body, opts) => request(p, { ...opts, method: 'POST', body }),
  put: (p, body, opts) => request(p, { ...opts, method: 'PUT', body }),
  del: (p, opts) => request(p, { ...opts, method: 'DELETE' })
};

export default httpMarket;
