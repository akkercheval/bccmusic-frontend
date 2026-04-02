// src/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api-bccmusic.boonecountyin.org',   // ← This is what you want
  withCredentials: true,
});

export default api;