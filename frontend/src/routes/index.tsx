/**
 * Route Configuration
 * Centralized routing for the application with lazy loading for performance optimization.
 */

import { lazy, Suspense } from 'react'
import PublicLayout from '../layouts/PublicLayout'
import ProtectedLayout from '../layouts/ProtectedLayout'
import NotFound from '../pages/NotFound'
import Landing from '../pages/Landing'
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import ForgotPassword from '../pages/auth/ForgotPassword'
import ResetPassword from '../pages/auth/ResetPassword'
import Dashboard from '../pages/Dashboard'
import Transactions from '../pages/Transactions'
import Statements from '../pages/Statements'
import Categories from '../pages/Categories'
import Profile from '../pages/Profile'
import Settings from '../pages/Settings'
import Search from '../pages/Search'
import { LazyPageFallback } from '../components/LazyPageFallback'

// Lazy load heavy pages to reduce initial bundle size
const Analytics = lazy(() => import('../pages/Analytics'))
const FamilyFinance = lazy(() => import('../pages/FamilyFinance'))
const HowItWorks = lazy(() => import('../pages/HowItWorks'))
const Onboarding = lazy(() => import('../pages/Onboarding'))

export const routes = [
  {
    path: '/',
    element: <Landing />,
  },
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'register',
        element: <Register />,
      },
      {
        path: 'forgot-password',
        element: <ForgotPassword />,
      },
      {
        path: 'reset-password/:token',
        element: <ResetPassword />,
      },
      {
        path: 'onboarding',
        element: (
          <Suspense fallback={<LazyPageFallback />}>
            <Onboarding />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: '/',
    element: <ProtectedLayout />,
    children: [
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'transactions',
        element: <Transactions />,
      },
      {
        path: 'statements',
        element: <Statements />,
      },
      {
        path: 'analytics',
        element: (
          <Suspense fallback={<LazyPageFallback />}>
            <Analytics />
          </Suspense>
        ),
      },
      {
        path: 'family',
        element: (
          <Suspense fallback={<LazyPageFallback />}>
            <FamilyFinance />
          </Suspense>
        ),
      },
      {
        path: 'categories',
        element: <Categories />,
      },
      {
        path: 'how-it-works',
        element: (
          <Suspense fallback={<LazyPageFallback />}>
            <HowItWorks />
          </Suspense>
        ),
      },
      {
        path: 'profile',
        element: <Profile />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
      {
        path: 'search',
        element: <Search />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]

