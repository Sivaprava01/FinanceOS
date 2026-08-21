import React from 'react'

interface SectionProps {
  children: React.ReactNode
  className?: string
  spacing?: 'sm' | 'md' | 'lg' | 'xl'
}

const spacingClasses: Record<string, string> = {
  sm: 'py-8',
  md: 'py-12',
  lg: 'py-16',
  xl: 'py-20',
}

/**
 * Section component for grouping related content with consistent editorial spacing.
 * Provides vertical rhythm across pages.
 */
export const Section: React.FC<SectionProps> = ({
  children,
  className = '',
  spacing = 'lg',
}) => {
  return (
    <section className={`${spacingClasses[spacing]} ${className}`}>
      {children}
    </section>
  )
}

Section.displayName = 'Section'
