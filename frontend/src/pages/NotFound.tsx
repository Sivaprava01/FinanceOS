/**
 * 404 Not Found Page
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { FileQuestion } from 'lucide-react'
import { EmptyState } from '@components/ui/EmptyState'

const NotFound: React.FC = () => {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <EmptyState
          icon={FileQuestion}
          title="404 — Page Not Found"
          description="The page or resource you are looking for doesn't exist or has been moved."
          action={{
            label: 'Back to Dashboard',
            onClick: () => navigate('/dashboard'),
          }}
        />
      </div>
    </div>
  )
}

export default NotFound
