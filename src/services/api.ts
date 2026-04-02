import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api-bccmusic.boonecountyin.org',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  withCredentials: true,
});

export default api;