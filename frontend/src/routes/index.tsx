/**
 * Route Configuration
 * Centralized routing with lazy-loaded pages.
 */

import React, { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import PublicLayout from '@layouts/PublicLayout';
import ProtectedLayout from '@layouts/ProtectedLayout';
import { Loader } from '@components/ui/Loader';

// ─── Lazy-loaded pages ──────────────────────────────────────────────────────
const NotFound = lazy(() => import('@pages/NotFound'));
const ErrorPage = lazy(() => import('@pages/Error'));
const Login = lazy(() => import('@pages/auth/Login'));
const Register = lazy(() => import('@pages/auth/Register'));
const ForgotPassword = lazy(() => import('@pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('@pages/auth/ResetPassword'));
const Dashboard = lazy(() => import('@pages/Dashboard'));
const Transactions = lazy(() => import('@pages/Transactions'));
const Statements = lazy(() => import('@pages/Statements'));
const Analytics = lazy(() => import('@pages/Analytics'));
const FamilyFinance = lazy(() => import('@pages/FamilyFinance'));
const Categories = lazy(() => import('@pages/Categories'));
const HowItWorks = lazy(() => import('@pages/HowItWorks'));
const Profile = lazy(() => import('@pages/Profile'));
const Settings = lazy(() => import('@pages/Settings'));

const fallback = (
  <div className="flex min-h-screen items-center justify-center">
    <Loader size="lg" />
  </div>
);

const s = (element: React.ReactElement) => <Suspense fallback={fallback}>{element}</Suspense>;

export const routes = [
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { path: 'login', element: s(<Login />) },
      { path: 'register', element: s(<Register />) },
      { path: 'forgot-password', element: s(<ForgotPassword />) },
      { path: 'reset-password/:token', element: s(<ResetPassword />) },
    ],
  },
  {
    path: '/',
    element: <ProtectedLayout />,
    children: [
      { path: 'dashboard', element: s(<Dashboard />) },
      { path: 'transactions', element: s(<Transactions />) },
      { path: 'statements', element: s(<Statements />) },
      { path: 'analytics', element: s(<Analytics />) },
      { path: 'family', element: s(<FamilyFinance />) },
      { path: 'categories', element: s(<Categories />) },
      { path: 'how-it-works', element: s(<HowItWorks />) },
      { path: 'profile', element: s(<Profile />) },
      { path: 'settings', element: s(<Settings />) },
      { path: 'error', element: s(<ErrorPage />) },
    ],
  },
  {
    path: '*',
    element: s(<NotFound />),
  },
];
