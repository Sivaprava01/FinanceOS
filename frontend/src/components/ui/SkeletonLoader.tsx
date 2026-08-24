import React from 'react'

interface SkeletonLoaderProps {
  type?: 'card' | 'row' | 'table-row' | 'stat' | 'text' | 'line' | 'circle' | 'chart'
  count?: number
  height?: string
  width?: string
  className?: string
}

/**
 * SkeletonLoader component for displaying loading placeholders.
 * Supports multiple variants (card, row, table-row, stat, text, line, circle, chart).
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type = 'card',
  count = 1,
  height = 'h-5',
  width = 'w-full',
  className = '',
}) => {
  const baseClasses = 'bg-muted/80 animate-pulse rounded'

  const typeClasses: Record<string, string> = {
    card: 'rounded-xl border border-border bg-card p-5 space-y-3',
    stat: 'rounded-xl border border-border bg-card p-5 space-y-2',
    row: 'flex gap-3 items-center p-3 rounded-lg border border-border bg-card',
    'table-row': 'flex items-center justify-between py-3 px-4 border-b border-border/50',
    text: `${baseClasses} ${height} ${width}`,
    line: `${baseClasses} h-3.5 ${width} mb-1.5`,
    circle: `${baseClasses} rounded-full h-8 w-8`,
    chart: 'rounded-xl border border-border bg-card p-5 h-64',
  }

  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className={`${typeClasses.card} ${className}`}>
            <div className={`${baseClasses} h-3.5 w-1/3`} />
            <div className={`${baseClasses} h-6 w-1/2`} />
            <div className="space-y-1.5 pt-2">
              <div className={`${baseClasses} h-3 w-full`} />
              <div className={`${baseClasses} h-3 w-4/5`} />
            </div>
          </div>
        )

      case 'stat':
        return (
          <div className={`${typeClasses.stat} ${className}`}>
            <div className="flex items-center justify-between">
              <div className={`${baseClasses} h-3.5 w-24`} />
              <div className={`${baseClasses} h-4 w-4 rounded-full`} />
            </div>
            <div className={`${baseClasses} h-7 w-32`} />
            <div className={`${baseClasses} h-3 w-20`} />
          </div>
        )
      
      case 'table-row':
        return (
          <div className={`${typeClasses['table-row']} ${className}`}>
            <div className="flex items-center gap-3 flex-1">
              <div className={`${baseClasses} h-4 w-4 rounded`} />
              <div className={`${baseClasses} h-3.5 w-20`} />
              <div className={`${baseClasses} h-4 w-36`} />
            </div>
            <div className="flex items-center gap-4">
              <div className={`${baseClasses} h-5 w-16 rounded-full`} />
              <div className={`${baseClasses} h-4 w-20`} />
            </div>
          </div>
        )

      case 'row':
        return (
          <div className={`${typeClasses.row} ${className}`}>
            <div className={`${baseClasses} rounded-full h-8 w-8 shrink-0`} />
            <div className="flex-1 space-y-1.5 min-w-0">
              <div className={`${baseClasses} h-3.5 w-3/4`} />
              <div className={`${baseClasses} h-3 w-1/2`} />
            </div>
            <div className={`${baseClasses} h-4 w-16 shrink-0`} />
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
            <div className="h-full flex items-end gap-3 pt-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end gap-2 h-full">
                  <div
                    className={`${baseClasses} w-full`}
                    style={{ height: `${25 + (i * 13) % 65}%` }}
                  />
                  <div className={`${baseClasses} h-2.5 w-full`} />
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
