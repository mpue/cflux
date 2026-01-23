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
  
  // If we have an electron URL, use it
  if (electronBackendUrl) {
    return electronBackendUrl;
  }
  
  // If REACT_APP_API_URL is set, extract base URL without /api
  if (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL !== '/api') {
    return process.env.REACT_APP_API_URL.replace('/api', '');
  }
  
  // Default: try to determine from window location
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    // Frontend runs on 3002, backend on 3001
    return `${protocol}//${hostname}:3001`;
  }
  
  return 'http://localhost:3001';
};

// Normalize upload URLs to always point to the correct backend
export const normalizeUploadUrl = (url: string | undefined): string | undefined => {
  if (!url) return undefined;
  
  const backendUrl = getBackendURL();
  
  // Already correct full URL
  if (url.startsWith(`${backendUrl}/uploads/`)) {
    return url;
  }
  
  // Extract filename from any URL format
  let filename = url;
  if (url.includes('/uploads/')) {
    filename = url.substring(url.indexOf('/uploads/') + 9);
  } else if (url.includes('/')) {
    filename = url.split('/').pop() || url;
  }
  
  // Build correct URL
  return `${backendUrl}/uploads/${filename}`;
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
