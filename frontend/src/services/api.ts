/**
 * Axios API Instance
 * Centralized API configuration with interceptors for authentication and error handling.
 *
 * CRITICAL: Response interceptor must NOT create infinite loops.
 * - On 401, clear token ONCE (don't retry)
 * - Do NOT redirect on every 401 (let React Router handle it)
 * - Let the error propagate to the React Query hook
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
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // Clear the invalid token (do this once)
      const token = localStorage.getItem('accessToken');
      if (token) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
      }
      // Do NOT redirect here. Let the React Query hook and AuthContext handle it.
      // The hook has retry logic that will stop on 401 and set isLoading=false.
      // AuthContext will detect the error and set isAuthenticated=false.
      // React Router will redirect to /login because the route is protected.
    }

    // Handle network errors
    if (!error.response) {
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }

    // Return the error so React Query hook can handle it
    return Promise.reject(error.response.data || error);
  }
);

export default api;
