import api from './api'
import type { AuthResponse, User } from '@/types'

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', { email, password })
    return response.data
  },

  register: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', { name, email, password })
    return response.data
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<{ success: boolean; message: string; data: { user: User } }>('/auth/me')
    return response.data.data.user
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout')
  },
}
