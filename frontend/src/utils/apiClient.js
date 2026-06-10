import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  timeout: 10000,
});

// Add request interceptor for auth
api.interceptors.request.use(config => {
  // Support both 'token' (current app usage) and 'access_token' (as requested)
  const token = localStorage.getItem('token') || localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for retry
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    // Auto-retry 500+ errors once after 1 second
    if (originalRequest && !originalRequest._retry && error.response?.status >= 500) {
      originalRequest._retry = true;
      await new Promise(resolve => setTimeout(resolve, 1000));
      return api(originalRequest);
    }
    
    // Redirect to login if unauthorized (401)
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      
      // Prevent redirect loop if already on login/register
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
