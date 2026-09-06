/**
 * Protected Layout
 * Layout for authenticated pages with collapsible sidebar and top navigation.
 */

import React, { useState } from 'react'
import { Outlet, useLocation, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Sidebar from '@components/layout/Sidebar'
import TopNavigation from '@components/layout/TopNavigation'
import { BackButton } from '@components/ui/BackButton'
import { ErrorBoundary } from '@components/LazyPageFallback'
import { pageVariants } from '@lib/motion'
import { useAuth } from '@hooks/useAuth'

const ProtectedLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true'
  })
  const location = useLocation()
  const { isAuthenticated, isLoading } = useAuth()

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('sidebar_collapsed', String(next))
      return next
    })
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Skip to main content link - accessible but hidden */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-0 focus:top-0 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2"
      >
        Skip to main content
      </a>

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navigation */}
        <TopNavigation onMenuClick={() => setSidebarOpen((prev) => !prev)} />

        {/* Content Area with Page Transitions */}
        <main className="flex-1 overflow-auto" role="main" id="main-content">
          <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
            <ErrorBoundary>
              <motion.div
                key={location.pathname}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                {/* Global Back Navigation */}
                <BackButton className="mb-4" />
                <Outlet />
              </motion.div>
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  )
}

export default ProtectedLayout
