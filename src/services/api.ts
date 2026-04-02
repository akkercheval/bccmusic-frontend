import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api-bccmusic.boonecountyin.org',//import.meta.env.VITE_API_BASE_URL || 
           //(import.meta.env.PROD ? 'https://api-bccmusic.boonecountyin.org' : 'http://localhost:8080'),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  withCredentials: true,
});

// Optional: Log requests during development
if (import.meta.env.DEV) {
  api.interceptors.request.use((config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  });
}

export default api;