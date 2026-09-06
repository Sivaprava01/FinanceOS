/**
 * Public Layout
 * Redesigned layout for unauthenticated pages (login, register, forgot-password, etc.)
 */

import React from 'react'
import { Outlet, Link, Navigate } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'

const PublicLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth()

  // Authenticated users should not see login/register pages; redirect to dashboard and replace history
  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen w-full bg-background flex flex-col justify-between selection:bg-primary/20 selection:text-primary">
      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-0 focus:top-0 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2"
      >
        Skip to main content
      </a>

      {/* Main Content Area */}
      <main
        className="flex flex-1 items-center justify-center px-4 py-12"
        role="main"
        id="main-content"
      >
        <div className="w-full max-w-sm space-y-6">
          {/* Logo & Brand Header */}
          <div className="text-center space-y-2">
            <Link to="/" className="inline-flex items-center gap-2.5 outline-none group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md group-hover:scale-105 transition-transform">
                F
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">FinanceOS</span>
            </Link>
            <p className="text-xs text-muted-foreground">
              Personal Finance Management & Statement Processing
            </p>
          </div>

          {/* Form Outlet */}
          <Outlet />

          {/* Footer Copy */}
          <p className="text-center text-[11px] text-muted-foreground/60">
            &copy; {new Date().getFullYear()} FinanceOS. Encrypted & Confidential.
          </p>
        </div>
      </main>
    </div>
  )
}

export default PublicLayout
