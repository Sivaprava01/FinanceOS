/**
 * Authentication Service
 * Handles all authentication-related API calls.
 */

import api from './api';
import type { User, AuthResponse } from '@/types';

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

export const authService = {
  /**
   * Register a new user
   * POST /api/v1/auth/register
   */
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', payload);
    return response.data;
  },

  /**
   * Login with email and password
   * POST /api/v1/auth/login
   */
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', payload);
    return response.data;
  },

  /**
   * Logout the current user
   * POST /api/v1/auth/logout
   */
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  /**
   * Refresh authentication token
   * POST /api/v1/auth/refresh
   */
  refreshToken: async (): Promise<AuthResponse> => {
    const response = await api.post('/auth/refresh');
    return response.data;
  },

  /**
   * Get current user profile
   * GET /api/v1/auth/me
   */
  getProfile: async (): Promise<{ user: User }> => {
    const response = await api.get('/auth/me');
    return response.data.data;
  },

  /**
   * Change password
   * POST /api/v1/users/change-password
   */
  changePassword: async (payload: ChangePasswordPayload): Promise<{ user: User }> => {
    const response = await api.post('/users/change-password', payload);
    return response.data.data;
  },

  /**
   * Request password reset email
   * POST /api/v1/auth/forgot-password
   */
  forgotPassword: async (email: string): Promise<{ resetTokenSent: boolean; email: string; devToken?: string }> => {
    const response = await api.post('/auth/forgot-password', { email });
    // Log in development for debugging
    if (import.meta.env.DEV) {
      console.log('Forgot Password Response:', response.data);
      if (response.data.data?.devToken) {
        console.log('🔐 Development Reset Link:', `http://localhost:3000/reset-password?token=${response.data.data.devToken}&email=${email}`);
      }
    }
    return response.data.data;
  },

  /**
   * Reset password with token
   * POST /api/v1/auth/reset-password
   */
  resetPassword: async (payload: {
    email: string;
    token: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<{ passwordReset: boolean; message: string }> => {
    const response = await api.post('/auth/reset-password', payload);
    return response.data.data;
  },
};
