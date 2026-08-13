/**
 * useAuth Hook
 * Authentication hooks for login, register, and logout.
 * On success, updates query cache immediately so auth state is synchronous.
 */

import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { queryClient } from '@/lib/queryClient';

export const useRegister = () => {
  return useMutation({
    mutationFn: (payload: { name: string; email: string; password: string }) =>
      authService.register(payload),
    onSuccess: (data) => {
      // Store token and user in localStorage
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.data.user));

      // Set the query cache immediately so the auth context picks it up synchronously
      // This is the single source of truth for the current user
      queryClient.setQueryData(['current-user'], data.data.user);
    },
  });
};

export const useLogin = () => {
  return useMutation({
    mutationFn: (payload: { email: string; password: string }) => authService.login(payload),
    onSuccess: (data) => {
      // Store token and user in localStorage
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.data.user));

      // Set the query cache immediately so the auth context picks it up synchronously
      // This is the single source of truth for the current user
      queryClient.setQueryData(['current-user'], data.data.user);
    },
  });
};

export const useLogout = () => {
  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      // Remove token and user from localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');

      // Clear the query cache
      queryClient.removeQueries({ queryKey: ['current-user'] });

      // Navigate to login
      window.location.href = '/login';
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: (payload: { oldPassword: string; newPassword: string }) =>
      authService.changePassword(payload),
  });
};
