/**
 * Authentication Context Provider
 * Derives authentication state from:
 * 1. React Query cache for 'current-user' (single source of truth for user data)
 * 2. localStorage for token (single source of truth for logged-in status)
 *
 * FLOW (Post-Login):
 * 1. Login form calls loginMutation.mutateAsync()
 * 2. API succeeds (200), mutation's onSuccess:
 *    - Stores token in localStorage
 *    - Sets query cache via queryClient.setQueryData(['current-user'], user)
 * 3. This provider's cache subscription detects the update
 * 4. Component re-renders with new user data
 * 5. isAuthenticated becomes true (token + user both exist)
 * 6. ProtectedRoute sees isAuthenticated=true, allows /dashboard
 *
 * FLOW (Initialization):
 * 1. App mounts, AuthProvider mounts
 * 2. useCurrentUser hook checks token from localStorage
 * 3. If token exists: query enabled=true, fetches GET /users/me
 * 4. If no token: query enabled=false, no request
 * 5. After query settles: setIsLoading(false)
 * 6. AuthContext value computed and provided to children
 *
 * NOTE: We subscribe to the query directly instead of deriving from
 * currentUserQuery.data because we need to react to programmatic
 * cache updates from useLogin mutation.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AuthContext } from './AuthContext';
import type { User, AuthContextType } from '@/types';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useLogin, useLogout, useRegister } from '@/hooks/useAuth';
import { queryClient } from '@/lib/queryClient';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // Get the query state for loading tracking
  const currentUserQuery = useCurrentUser();

  // Subscribe to query cache updates directly
  const qc = useQueryClient();
  useEffect(() => {
    // Get initial cache value
    const cachedUser = qc.getQueryData<User>(['current-user']);
    if (cachedUser) {
      setUser(cachedUser);
    }

    // Subscribe to cache changes
    const unsubscribe = qc.getQueryCache().subscribe(() => {
      const updated = qc.getQueryData<User>(['current-user']);
      setUser(updated || null);
    });

    return () => {
      unsubscribe();
    };
  }, [qc]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  // Auth mutations
  const loginMutation = useLogin();
  const logoutMutation = useLogout();
  const registerMutation = useRegister();

  // Mark loading as complete when current-user query settles
  useEffect(() => {
    if (!currentUserQuery.isLoading) {
      setIsLoading(false);
    }
  }, [currentUserQuery.isLoading]);

  // Handle 401 errors - clear token and auth state
  useEffect(() => {
    if (currentUserQuery.error && typeof currentUserQuery.error === 'object') {
      const errorObj = currentUserQuery.error as unknown as Record<string, unknown>;
      if ('response' in errorObj) {
        const responseObj = errorObj.response as Record<string, unknown>;
        if ('status' in responseObj && responseObj.status === 401) {
          // Token invalid, clear it
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          queryClient.removeQueries({ queryKey: ['current-user'] });
        }
      }
    }
  }, [currentUserQuery.error]);

  const login = useCallback(
    async (email: string, password: string) => {
      await loginMutation.mutateAsync({ email, password });
    },
    [loginMutation]
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      await registerMutation.mutateAsync({ name, email, password });
    },
    [registerMutation]
  );

  const logout = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  const updateUser = useCallback(
    (updatedUser: Partial<User>) => {
      if (!user) return;
      const newUser = { ...user, ...updatedUser };
      localStorage.setItem('user', JSON.stringify(newUser));
      queryClient.setQueryData(['current-user'], newUser);
    },
    [user]
  );

  // isAuthenticated is true when both token exists and user is available
  const isAuthenticated = !!token && !!user;

  const value: AuthContextType = {
    user: isAuthenticated ? user : null,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
