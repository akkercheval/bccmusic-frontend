import axios from 'axios';

const getBaseURL = () => {
  // For production (when deployed)
  if (import.meta.env.PROD) {
    return 'https://api-bccmusic.boonecountyin.org';
  }

  // For local development
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  withCredentials: true,
});

// request interceptor for debugging
api.interceptors.request.use((config) => {
  console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  return config;
});

export default api;