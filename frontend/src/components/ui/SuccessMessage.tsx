import React, { useEffect } from 'react'
import { CheckCircle, X } from 'lucide-react'

interface SuccessMessageProps {
  message: string
  onDismiss?: () => void
  autoHide?: boolean
  duration?: number
  className?: string
}

/**
 * SuccessMessage component for displaying success feedback with accessibility support.
 * Optionally auto-hides after a specified duration.
 */
export const SuccessMessage: React.FC<SuccessMessageProps> = ({
  message,
  onDismiss,
  autoHide = true,
  duration = 3000,
  className = '',
}) => {
  useEffect(() => {
    if (autoHide && onDismiss) {
      const timer = setTimeout(onDismiss, duration)
      return () => clearTimeout(timer)
    }
  }, [autoHide, duration, onDismiss])

  return (
    <div 
      className={`rounded-lg border border-success/30 bg-success/5 p-4 ${className}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex gap-3 items-start">
        <CheckCircle className="h-5 w-5 flex-shrink-0 text-success mt-0.5" aria-hidden="true" />
        
        <div className="flex-1">
          <p className="text-sm font-medium text-success">{message}</p>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-success/70 hover:text-success transition-colors flex-shrink-0"
            aria-label="Dismiss success message"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}

SuccessMessage.displayName = 'SuccessMessage'
