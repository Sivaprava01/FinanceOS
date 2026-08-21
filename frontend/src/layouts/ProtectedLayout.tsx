/**
 * Protected Layout
 * Layout for authenticated pages with sidebar and navigation.
 */

import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import Sidebar from '@components/layout/Sidebar'
import TopNavigation from '@components/layout/TopNavigation'
import { pageVariants } from '@lib/motion'

const ProtectedLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = React.useState(true)
  const location = useLocation()

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Skip to main content link - accessible but hidden */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-0 focus:top-0 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2">
        Skip to main content
      </a>

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navigation */}
        <TopNavigation onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Content Area with Page Transitions */}
        <main className="flex-1 overflow-auto" role="main" id="main-content">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <Outlet />
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default ProtectedLayout
