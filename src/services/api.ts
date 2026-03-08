import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080',   // your Spring Boot backend
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  withCredentials: true,              // important if you ever use cookies/sessions
});

export default api;