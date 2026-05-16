import axios from 'axios';

// Web (Vite dev): leave empty to use Vite proxy for `/api`.
// Native (Capacitor): set `VITE_API_URL` to a reachable backend URL, e.g. `http://192.168.1.10:5000`.
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
