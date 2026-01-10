import axios from 'axios';

// Function to get the correct base URL at runtime
const getBaseURL = () => {
  const electronBackendUrl = typeof window !== 'undefined' && (window as any).ELECTRON_BACKEND_URL;
  const baseUrl = electronBackendUrl 
    ? `${electronBackendUrl}/api`
    : (process.env.REACT_APP_API_URL || '/api');
  
  console.log('[API] getBaseURL called:', {
    electronBackendUrl,
    windowObject: typeof window !== 'undefined' ? 'exists' : 'not exists',
    ELECTRON_BACKEND_URL: (window as any)?.ELECTRON_BACKEND_URL,
    resultBaseUrl: baseUrl
  });
  
  return baseUrl;
};

// Export function to get backend URL for static resources
export const getBackendURL = () => {
  const electronBackendUrl = typeof window !== 'undefined' && (window as any).ELECTRON_BACKEND_URL;
  return electronBackendUrl || process.env.REACT_APP_API_URL?.replace('/api', '') || '';
};

const api = axios.create({
  baseURL: getBaseURL(),
});

api.interceptors.request.use((config) => {
  // Update baseURL at runtime in case it changed
  config.baseURL = getBaseURL();
  
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  console.log('API Request:', config.method?.toUpperCase(), config.baseURL + config.url);
  
  return config;
});

export default api;
