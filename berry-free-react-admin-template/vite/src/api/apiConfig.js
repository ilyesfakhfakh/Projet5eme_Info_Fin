// Market API uses /api/ instead of /api/v1/
// We need to use full URL because http.js adds /api/v1 by default
export const MARKET_API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/v1', '') || 'http://localhost:3200/api';
