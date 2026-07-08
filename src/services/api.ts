// src/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api-bccmusic.boonecountyin.org',
  withCredentials: true,
});

// CSRF protection — Axios will read the token from the cookie and attach it as a header
api.defaults.xsrfCookieName = 'XSRF-TOKEN';
api.defaults.xsrfHeaderName = 'X-XSRF-TOKEN';

export default api;