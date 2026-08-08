/**
 * Axios API Instance
 * Centralized API configuration with interceptors for authentication and error handling.
 * NOTE: Phase 1 — infrastructure only. No API calls are made from the UI.
 */

import axios, { AxiosError, AxiosInstance } from 'axios';
import type { ApiResponse } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// ─── Create Axios Instance ──────────────────────────────────────────────────

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor ────────────────────────────────────────────────────

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ───────────────────────────────────────────────────

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }

    if (!error.response) {
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }

    return Promise.reject(error.response.data || error);
  }
);

export default api;
