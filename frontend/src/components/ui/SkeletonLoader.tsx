import React from 'react'

interface SkeletonLoaderProps {
  type?: 'card' | 'row' | 'text' | 'line' | 'circle' | 'chart'
  count?: number
  height?: string
  width?: string
  className?: string
}

/**
 * SkeletonLoader component for displaying loading placeholders.
 * Supports multiple variants (card, row, text, line, circle, chart).
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type = 'card',
  count = 1,
  height = 'h-6',
  width = 'w-full',
  className = '',
}) => {
  const baseClasses = 'bg-muted animate-pulse rounded'

  const typeClasses: Record<string, string> = {
    card: 'rounded-lg border border-border p-6 space-y-4',
    row: 'flex gap-3 items-center p-4',
    text: `${baseClasses} ${height} ${width}`,
    line: `${baseClasses} h-4 ${width} mb-2`,
    circle: `${baseClasses} rounded-full h-10 w-10`,
    chart: 'rounded-lg border border-border p-6 h-64',
  }

  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className={`${typeClasses.card} ${className}`}>
            <div className={`${baseClasses} h-4 w-1/3`} />
            <div className={`${baseClasses} h-6 w-2/3`} />
            <div className="space-y-2">
              <div className={`${baseClasses} h-4 w-full`} />
              <div className={`${baseClasses} h-4 w-5/6`} />
            </div>
          </div>
        )
      
      case 'row':
        return (
          <div className={`${typeClasses.row} ${className}`}>
            <div className={`${baseClasses} rounded-full h-10 w-10`} />
            <div className="flex-1 space-y-2">
              <div className={`${baseClasses} h-4 w-3/4`} />
              <div className={`${baseClasses} h-3 w-1/2`} />
            </div>
            <div className={`${baseClasses} h-4 w-1/4`} />
          </div>
        )
      
      case 'text':
      case 'line':
        return <div className={`${typeClasses.text} ${className}`} />
      
      case 'circle':
        return <div className={`${typeClasses.circle} ${className}`} />
      
      case 'chart':
        return (
          <div className={`${typeClasses.chart} ${className}`}>
            <div className="h-full space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-2 items-end h-full">
                  <div className={`${baseClasses} w-8 h-12`} />
                  <div className={`${baseClasses} w-8 h-20`} />
                  <div className={`${baseClasses} w-8 h-16`} />
                </div>
              ))}
            </div>
          </div>
        )
      
      default:
        return <div className={`${typeClasses.text} ${className}`} />
    }
  }

  return (
    <>
      {[...Array(count)].map((_, i) => (
        <div key={i} className={i > 0 ? 'mt-4' : ''}>
          {renderSkeleton()}
        </div>
      ))}
    </>
  )
}

SkeletonLoader.displayName = 'SkeletonLoader'
