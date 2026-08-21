/**
 * Public Layout
 * Layout for unauthenticated pages (login, register, etc.)
 */

import React from 'react'
import { Outlet } from 'react-router-dom'

const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-background">
      {/* Skip to main content link - accessible but hidden */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-0 focus:top-0 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2">
        Skip to main content
      </a>
      <main className="flex min-h-screen items-center justify-center px-4 py-12" role="main" id="main-content">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default PublicLayout
