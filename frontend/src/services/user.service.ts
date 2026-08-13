/**
 * User Service
 * Handles all user profile and account-related API calls.
 */

import api from './api';
import type { User } from '@/types';

interface UpdateProfilePayload {
  name?: string;
  email?: string;
  avatar?: string;
  country?: string;
  preferredCurrency?: string;
  timeZone?: string;
}

interface UpdatePreferencesPayload {
  language?: string;
  theme?: 'light' | 'dark' | 'system';
  notifications?: {
    email?: boolean;
    push?: boolean;
  };
}

export const userService = {
  /**
   * Get current user profile
   * GET /api/v1/users/me
   */
  getMe: async (): Promise<{ user: User }> => {
    const response = await api.get('/users/me');
    return response.data.data;
  },

  /**
   * Update user profile
   * PATCH /api/v1/users/profile
   */
  updateProfile: async (payload: UpdateProfilePayload): Promise<{ user: User }> => {
    const response = await api.patch('/users/profile', payload);
    return response.data.data;
  },

  /**
   * Update user preferences
   * PATCH /api/v1/users/preferences
   */
  updatePreferences: async (payload: UpdatePreferencesPayload): Promise<{ user: User }> => {
    const response = await api.patch('/users/preferences', payload);
    return response.data.data;
  },

  /**
   * Delete user account (soft delete)
   * DELETE /api/v1/users/me
   */
  deleteAccount: async (): Promise<void> => {
    await api.delete('/users/me');
  },

  /**
   * Link Google account
   * POST /api/v1/users/google/link
   */
  linkGoogle: async (googleId: string): Promise<{ user: User }> => {
    const response = await api.post('/users/google/link', { googleId });
    return response.data.data;
  },

  /**
   * Unlink Google account
   * POST /api/v1/users/google/unlink
   */
  unlinkGoogle: async (): Promise<{ user: User }> => {
    const response = await api.post('/users/google/unlink');
    return response.data.data;
  },
};
