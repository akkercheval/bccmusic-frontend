// src/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  withCredentials: true,
});

// CSRF protection — Spring Security 6 uses BREACH-protection (XOR masking) by default.
// Axios's built-in xsrf handling reads the raw cookie value, but Spring Security 6 may
// require special handling. We manually read the cookie and set the header to ensure
// compatibility with both plain and XOR-masked token configurations.
api.interceptors.request.use((config) => {
  // Only attach CSRF token for state-changing methods
  const method = config.method?.toLowerCase();
  if (method && ['post', 'put', 'delete', 'patch'].includes(method)) {
    const token = getCookie('XSRF-TOKEN');
    if (token) {
      config.headers['X-XSRF-TOKEN'] = token;
    }
  }
  return config;
});

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : null;
}

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