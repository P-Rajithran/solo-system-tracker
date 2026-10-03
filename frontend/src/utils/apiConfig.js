// Centralized API Base Configuration
const envApiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;

const getApiBaseUrl = () => {
  if (envApiUrl && envApiUrl.trim() !== '') {
    const clean = envApiUrl.trim().replace(/\/+$/, '');
    return clean.endsWith('/api') ? clean : clean + '/api';
  }
  // When running in production (e.g. deployed on Netlify or custom domain), use relative /api to prevent mixed content
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return '/api';
  }
  return 'http://localhost:5000/api';
};

export const API_BASE_URL = getApiBaseUrl();
export const API_ROOT = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;

export default API_BASE_URL;
