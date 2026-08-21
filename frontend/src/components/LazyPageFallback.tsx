/**
 * Lazy Page Fallback Component
 * Skeleton loader displayed while lazy-loaded route chunks are loading.
 */

import React from 'react'
import { SkeletonLoader } from './ui/SkeletonLoader'

export const LazyPageFallback: React.FC = () => (
  <div className="space-y-8">
    <div>
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="mt-2 h-4 w-64 animate-pulse rounded bg-muted" />
    </div>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <SkeletonLoader key={i} type="card" />
      ))}
    </div>
    <div className="grid gap-6 lg:grid-cols-2">
      <SkeletonLoader type="chart" />
      <SkeletonLoader type="chart" />
    </div>
  </div>
)

LazyPageFallback.displayName = 'LazyPageFallback'
