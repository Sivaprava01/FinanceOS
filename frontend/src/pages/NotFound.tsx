/**
 * 404 Not Found Page
 */

import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@components/ui/Button'

const NotFound: React.FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center">
        <h1 className="mb-2 text-6xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Page not found</p>
        <p className="mb-8 text-muted-foreground">The page you're looking for doesn't exist.</p>
        <Link to="/dashboard">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  )
}

export default NotFound
