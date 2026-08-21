import React from 'react'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

/**
 * EmptyState component for displaying when no data is available.
 * Provides a consistent visual pattern across pages.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 rounded-lg border border-border bg-muted/30 px-6 py-12 text-center ${className}`}>
      {Icon && (
        <div className="flex items-center justify-center rounded-full bg-muted p-3">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      
      <div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {action && (
        <button
          onClick={action.onClick}
          className="mt-2 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

EmptyState.displayName = 'EmptyState'
