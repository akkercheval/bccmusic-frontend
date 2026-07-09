// src/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  withCredentials: true,
});

// CSRF protection — Axios will read the token from the cookie and attach it as a header
api.defaults.xsrfCookieName = 'XSRF-TOKEN';
api.defaults.xsrfHeaderName = 'X-XSRF-TOKEN';

// Global response interceptor — handles session expiration (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    // Don't redirect for login attempts or auth-check calls (those handle 401 gracefully)
    const isAuthCheck = url.includes('/perform_login') || url.includes('/api/me');
    if (error.response?.status === 401 && !isAuthCheck) {
      window.location.href = '/login?session=expired';
    }
    return Promise.reject(error);
  }
);

export default api;