import React from 'react'

export type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

interface HeadingProps {
  level?: HeadingLevel
  children: React.ReactNode
  className?: string
}

/**
 * Heading component with proper letter-spacing and typography hierarchy.
 * Large headings (h1, h2) use -0.03em letter-spacing per ui.md spec.
 */
export const Heading: React.FC<HeadingProps> = ({
  level = 'h2',
  children,
  className = '',
}) => {
  const HeadingTag = level
  
  const headingClasses: Record<HeadingLevel, string> = {
    h1: 'text-4xl font-heading font-semibold tracking-tighter',
    h2: 'text-3xl font-heading font-semibold tracking-tighter',
    h3: 'text-2xl font-heading font-semibold tracking-tight',
    h4: 'text-xl font-heading font-semibold',
    h5: 'text-lg font-heading font-semibold',
    h6: 'text-base font-heading font-semibold',
  }

  return (
    <HeadingTag className={`${headingClasses[level]} ${className}`}>
      {children}
    </HeadingTag>
  )
}

Heading.displayName = 'Heading'
