/**
 * Route Configuration
 * Centralized routing for the application.
 */

import { Navigate } from 'react-router-dom'
import PublicLayout from '../layouts/PublicLayout'
import ProtectedLayout from '../layouts/ProtectedLayout'
import NotFound from '../pages/NotFound'
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import ForgotPassword from '../pages/auth/ForgotPassword'
import ResetPassword from '../pages/auth/ResetPassword'
import Onboarding from '../pages/Onboarding'
import Dashboard from '../pages/Dashboard'
import Transactions from '../pages/Transactions'
import Statements from '../pages/Statements'
import Analytics from '../pages/Analytics'
import FamilyFinance from '../pages/FamilyFinance'
import Categories from '../pages/Categories'
import HowItWorks from '../pages/HowItWorks'
import Profile from '../pages/Profile'
import Settings from '../pages/Settings'
import Search from '../pages/Search'

export const routes = [
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
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
        element: <Onboarding />,
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
        element: <Analytics />,
      },
      {
        path: 'family',
        element: <FamilyFinance />,
      },
      {
        path: 'categories',
        element: <Categories />,
      },
      {
        path: 'how-it-works',
        element: <HowItWorks />,
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
