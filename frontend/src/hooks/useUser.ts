/**
 * useUser Hooks
 * TanStack Query hooks for user profile, preferences, and account management.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/user.service';

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      name?: string;
      email?: string;
      avatar?: string;
      country?: string;
      preferredCurrency?: string;
      timeZone?: string;
    }) => userService.updateProfile(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      localStorage.setItem('user', JSON.stringify(data.user));
    },
  });
};

export const useUpdatePreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      language?: string;
      theme?: 'light' | 'dark' | 'system';
      notifications?: {
        email?: boolean;
        push?: boolean;
      };
    }) => userService.updatePreferences(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      localStorage.setItem('user', JSON.stringify(data.user));
    },
  });
};

export const useDeleteAccount = () => {
  return useMutation({
    mutationFn: () => userService.deleteAccount(),
    onSuccess: () => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    },
  });
};

export const useLinkGoogle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (googleId: string) => userService.linkGoogle(googleId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      localStorage.setItem('user', JSON.stringify(data.user));
    },
  });
};

export const useUnlinkGoogle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => userService.unlinkGoogle(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      localStorage.setItem('user', JSON.stringify(data.user));
    },
  });
};
