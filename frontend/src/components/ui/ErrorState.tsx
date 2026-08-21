import React from 'react'
import { AlertCircle } from 'lucide-react'

interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  className?: string
}

/**
 * ErrorState component for displaying error messages with optional retry action.
 * Provides a consistent error feedback pattern across pages with accessibility support.
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  className = '',
}) => {
  return (
    <div 
      className={`rounded-lg border border-destructive/30 bg-destructive/5 p-4 ${className}`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="flex gap-3">
        <AlertCircle className="h-5 w-5 flex-shrink-0 text-destructive mt-0.5" aria-hidden="true" />
        
        <div className="flex-1">
          <h3 className="font-semibold text-destructive">{title}</h3>
          <p className="mt-1 text-sm text-destructive/80">{message}</p>
          
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex text-sm font-medium text-destructive hover:underline transition-colors"
              aria-label="Retry loading the page"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

ErrorState.displayName = 'ErrorState'
