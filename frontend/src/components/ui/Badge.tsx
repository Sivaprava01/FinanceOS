import React from 'react'

export type BadgeVariant = 'default' | 'success' | 'warning' | 'destructive' | 'info' | 'secondary' | 'outline'
export type BadgeSize = 'sm' | 'md' | 'lg'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-primary/10 text-primary border-primary/20',
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  destructive: 'bg-destructive/10 text-destructive border-destructive/20',
  info: 'bg-info/10 text-info border-info/20',
  secondary: 'bg-secondary text-secondary-foreground border-transparent',
  outline: 'bg-transparent text-foreground border-border',
}

const dotStyles: Record<BadgeVariant, string> = {
  default: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  info: 'bg-info',
  secondary: 'bg-muted-foreground',
  outline: 'bg-foreground',
}

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[11px] font-medium rounded-md',
  md: 'px-2.5 py-0.5 text-xs font-medium rounded-md',
  lg: 'px-3 py-1 text-sm font-semibold rounded-lg',
}

/**
 * Badge component for displaying status, tags, or labels.
 */
export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 border font-medium transition-colors ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && (
        <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[variant]}`} aria-hidden="true" />
      )}
      {children}
    </span>
  )
}

Badge.displayName = 'Badge'
