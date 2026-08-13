/**
 * Protected Route Component
 * Guards protected routes from unauthenticated access.
 *
 * Logic:
 * 1. If token exists and still loading from /users/me: show loading state
 * 2. If token exists and user is loaded: render children (authenticated)
 * 3. If no token and loading: allow navigation (might be initializing on app load)
 * 4. If no token and done loading: redirect to login
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@context/useAuthContext';
import { Loader } from '@components/ui/Loader';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  // Case 1: We have a token but still loading from /users/me
  // Show loading state while verifying the session
  if (token && isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  // Case 2: We have a token and finished loading, and user is available
  // This means isAuthenticated must be true, allow access
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Case 3: No token and still loading on app initialization
  // This is normal - let the route render its layout (public routes will show)
  // For protected routes, this branch won't happen because we already have
  // isAuthenticated false, which will redirect below
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  // Case 4: No token and finished loading (or no user despite having token)
  // Not authenticated - redirect to login
  return <Navigate to="/login" replace />;
};
