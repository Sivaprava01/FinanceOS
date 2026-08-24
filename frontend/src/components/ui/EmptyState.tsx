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
    <div className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-12 text-center ${className}`}>
      {Icon && (
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-muted-foreground mb-3">
          <Icon className="h-5 w-5" />
        </div>
      )}
      
      <div className="max-w-sm space-y-1">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        )}
      </div>

      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-all shadow-sm active:scale-[0.98]"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

EmptyState.displayName = 'EmptyState'
