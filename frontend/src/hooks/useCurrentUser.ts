/**
 * useCurrentUser Hook
 * Fetches and syncs current user profile from backend.
 *
 * CRITICAL: This hook only runs if a token exists.
 * If there's no token, the query is disabled and does not make any requests.
 * This prevents the infinite 401 loop on /login.
 *
 * NOTE: After login, the useLogin mutation:
 * 1. Stores the token in localStorage
 * 2. Sets the query cache immediately via queryClient.setQueryData()
 * 3. AuthContextProvider derives user from the cache
 *
 * The query key includes a dependency that causes this to pick up
 * cache updates immediately when the AuthContextProvider sets them.
 */

import { useEffect } from 'react';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { userService } from '@/services/user.service';
import type { User } from '@/types';
import axios from 'axios';

/**
 * Get token synchronously without triggering queries
 */
const getStoredToken = (): string | null => {
  return localStorage.getItem('accessToken');
};

export const useCurrentUser = (): UseQueryResult<User, unknown> => {
  const token = getStoredToken();

  const query = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { user } = await userService.getMe();
      return user;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    // CRITICAL: Only run this query if a token exists
    // A 401 on /users/me when there's no token is not a transient error
    enabled: !!token,
    // CRITICAL: Do not retry 401 errors (not a transient network failure)
    retry: (failureCount, error: unknown) => {
      // If it's a 401, don't retry
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        return false;
      }
      // Retry other errors once
      return failureCount < 1;
    },
  });

  // Sync to localStorage whenever user changes
  useEffect(() => {
    if (query.data) {
      localStorage.setItem('user', JSON.stringify(query.data));
    }
  }, [query.data]);

  return query;
};

/**
 * Get user from localStorage (synchronous)
 */
export const getCachedUser = (): User | null => {
  const cached = localStorage.getItem('user');
  if (!cached) return null;
  try {
    return JSON.parse(cached);
  } catch {
    return null;
  }
};
