import React from 'react'

export type BadgeVariant = 'default' | 'success' | 'warning' | 'destructive' | 'info' | 'secondary'
export type BadgeSize = 'sm' | 'md' | 'lg'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-primary text-primary-foreground',
  success: 'bg-success/10 text-success dark:text-success',
  warning: 'bg-warning/10 text-warning dark:text-warning',
  destructive: 'bg-destructive/10 text-destructive',
  info: 'bg-info/10 text-info dark:text-info',
  secondary: 'bg-secondary text-secondary-foreground',
}

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs font-medium rounded',
  md: 'px-3 py-1 text-sm font-medium rounded-md',
  lg: 'px-4 py-1.5 text-base font-semibold rounded-lg',
}

/**
 * Badge component for displaying status, tags, or labels.
 * Supports multiple variants (default, success, warning, destructive, info, secondary)
 * and sizes (sm, md, lg).
 */
export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1 font-medium ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  )
}

Badge.displayName = 'Badge'
