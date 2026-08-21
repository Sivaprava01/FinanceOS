import axios, { AxiosError, type AxiosInstance } from 'axios'
import type { ApiResponse } from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken')
      window.location.href = '/login'
    }
    return Promise.reject(error.response?.data ?? error)
  }
)

// Category API methods
export const categories = {
  list: (filters?: { type?: string }) =>
    api.get('/categories', { params: filters }),
  
  create: (data: { name: string; type?: string; color?: string; icon?: string; description?: string }) =>
    api.post('/categories', data),
  
  update: (id: string, data: Partial<{ name: string; type: string; color: string; icon: string; description: string }>) =>
    api.put(`/categories/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/categories/${id}`),
}

export default api
