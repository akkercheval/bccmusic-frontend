import axios from 'axios';

const api = axios.create({
  baseURL: '/api',           // ← Relative path – works in both dev and prod
  // or: baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,     // if you need cookies / auth
});

export default api;