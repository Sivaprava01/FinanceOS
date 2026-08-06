/**
 * Public Layout
 * Layout for unauthenticated pages (login, register, etc.)
 */

import React from 'react'
import { Outlet } from 'react-router-dom'

const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-background">
      <main className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default PublicLayout
