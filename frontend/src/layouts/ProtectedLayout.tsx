/**
 * Protected Layout
 * Layout for authenticated pages with collapsible sidebar and top navigation.
 */

import React, { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import Sidebar from '@components/layout/Sidebar'
import TopNavigation from '@components/layout/TopNavigation'
import { ErrorBoundary } from '@components/LazyPageFallback'
import { pageVariants } from '@lib/motion'

const ProtectedLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true'
  })
  const location = useLocation()

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('sidebar_collapsed', String(next))
      return next
    })
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
