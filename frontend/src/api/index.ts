import axios from 'axios';

const getBaseURL = () => {
  const url = import.meta.env.VITE_API_URL as string;
  if (!url) return '/api/v1';
  // If the user included /api/v1 in VITE_API_URL, use it directly
  if (url.endsWith('/api/v1') || url.endsWith('/api/v1/')) {
    return url;
  }
  // Otherwise, automatically append /api/v1 suffix to the domain
  return `${url.replace(/\/$/, '')}/api/v1`;
};

// Create central API client
const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle auth failure
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // If we are not already on login page, redirect
      if (!window.location.pathname.endsWith('/login') && !window.location.pathname.endsWith('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
