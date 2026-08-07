/**
 * Main App Component
 * Application root with routing.
 */

import { useRoutes } from 'react-router-dom'
import { routes } from '@routes/index'
import { useAuth } from '@hooks/useAuth'

function App() {
  const element = useRoutes(routes)
  const { isLoading } = useAuth()

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

  return element
}

export default App
