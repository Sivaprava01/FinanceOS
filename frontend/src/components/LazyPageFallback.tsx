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

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return (
        <div className="p-6 max-w-xl mx-auto my-12">
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 space-y-4">
            <h2 className="text-lg font-bold text-destructive">Application Error</h2>
            <p className="text-sm text-destructive/80">
              {this.state.error?.message || 'An unexpected error occurred while rendering this page.'}
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={this.handleReset}
                className="rounded-md bg-destructive px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-destructive/90"
              >
                Reload Page
              </button>
              <button
                onClick={() => { window.location.href = '/dashboard' }}
                className="rounded-md border border-input bg-background px-3.5 py-1.5 text-xs font-medium hover:bg-muted"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
