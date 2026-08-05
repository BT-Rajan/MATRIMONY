import axios from 'axios';
import { API_BASE_URL, TOKEN_KEY } from '../utils/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

// Attach JWT to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Normalize errors into a single shape the UI can rely on:
// { status, message, errors: { field: message } | null }
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }

      const normalized = {
        status,
        message: data?.message || 'ஒரு பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.',
        errors: data?.errors || null,
      };
      return Promise.reject(normalized);
    }

    if (error.request) {
      return Promise.reject({
        status: 0,
        message: 'சேவையகத்துடன் இணைக்க முடியவில்லை. இணைய இணைப்பை சரிபார்க்கவும்.',
        errors: null,
      });
    }

    return Promise.reject({ status: -1, message: error.message, errors: null });
  }
);

export default api;
