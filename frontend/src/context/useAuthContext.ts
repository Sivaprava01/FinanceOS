/**
 * useAuth Hook
 * Hook to consume the AuthContext
 */

import { useContext } from 'react';
import { AuthContext } from './AuthContext';
import type { AuthContextType } from '@/types';

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Alias for clarity in route guards and other contexts
export const useAuthContext = useAuth;
