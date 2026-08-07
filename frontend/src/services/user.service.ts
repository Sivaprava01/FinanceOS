import api from './api'
import type { User } from '@/types'

interface UpdateProfileInput {
  name?: string
  avatar?: string
  preferredCurrency?: string
  timeZone?: string
}

interface UpdatePreferencesInput {
  language?: string
  theme?: 'light' | 'dark' | 'system'
  notifications?: { email?: boolean; push?: boolean }
}

export const userService = {
  getMe: async (): Promise<User> => {
    const response = await api.get<{ success: boolean; message: string; data: { user: User } }>('/users/me')
    return response.data.data.user
  },

  updateProfile: async (data: UpdateProfileInput): Promise<User> => {
    const response = await api.patch<{ success: boolean; message: string; data: { user: User } }>('/users/profile', data)
    return response.data.data.user
  },

  updatePreferences: async (data: UpdatePreferencesInput): Promise<User> => {
    const response = await api.patch<{ success: boolean; message: string; data: { user: User } }>('/users/preferences', data)
    return response.data.data.user
  },

  changePassword: async (oldPassword: string, newPassword: string): Promise<User> => {
    const response = await api.post<{ success: boolean; message: string; data: { user: User } }>('/users/change-password', { oldPassword, newPassword })
    return response.data.data.user
  },
}
