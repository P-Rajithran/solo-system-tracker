// Centralized API Base Configuration
const envApiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;

const getApiBaseUrl = () => {
  if (!envApiUrl || envApiUrl.trim() === '') {
    return 'http://localhost:5000/api';
  }
  const clean = envApiUrl.trim().replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean : clean + '/api';
};

export const API_BASE_URL = getApiBaseUrl();
export const API_ROOT = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;

export default API_BASE_URL;
