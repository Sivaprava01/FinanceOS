/**
 * Axios API Instance
 * Centralized API configuration with interceptors for authentication and error handling.
 */

import axios, { AxiosError, AxiosInstance } from 'axios'
import type { ApiResponse } from '@types/index'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

// ─── Create Axios Instance ──────────────────────────────────────────────────

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ─── Request Interceptor ────────────────────────────────────────────────────

api.interceptors.request.use(
  (config) => {
    // Add authorization token if it exists
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// ─── Response Interceptor ───────────────────────────────────────────────────

api.interceptors.response.use(
  (response) => {
    return response
  },
  (error: AxiosError<ApiResponse>) => {
    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken')
      window.location.href = '/login'
    }

    // Handle network errors
    if (!error.response) {
      return Promise.reject({
        message: 'Network error. Please check your connection.',
      })
    }

    return Promise.reject(error.response.data || error)
  }
)

export default api
