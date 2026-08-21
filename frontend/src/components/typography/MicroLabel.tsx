import React from 'react'

interface MicroLabelProps {
  children: React.ReactNode
  className?: string
}

/**
 * MicroLabel component for displaying small, uppercase labels.
 * Uses 13px font size with 0.1em letter-spacing per ui.md design system.
 */
export const MicroLabel: React.FC<MicroLabelProps> = ({ children, className = '' }) => {
  return (
    <span className={`text-xs font-semibold uppercase tracking-wider text-muted-foreground ${className}`}>
      {children}
    </span>
  )
}

MicroLabel.displayName = 'MicroLabel'
