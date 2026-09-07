/**
 * BackButton Component
 * Consistent navigation control for authenticated pages with safe dashboard fallback.
 * Automatically suppresses rendering on the root Dashboard page.
 */

import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@lib/utils'

export interface BackButtonProps {
  /** Optional custom label (defaults to "Back") */
  label?: string
  /** Fallback route when no in-app history exists (defaults to "/dashboard") */
  fallback?: string
  /** Custom click handler if overriding default navigation */
  onClick?: () => void
  /** Extra CSS classes */
  className?: string
}

export const BackButton: React.FC<BackButtonProps> = ({
  label = 'Back',
  fallback = '/dashboard',
  onClick,
  className,
}) => {
  const navigate = useNavigate()
  const location = useLocation()

  // STRICT RULE: Never render the page-level Back button on the root Dashboard page
  const normalizedPath = location.pathname.replace(/\/+$/, '') || '/'
  if (normalizedPath === '/dashboard' || normalizedPath === '') {
    return null
  }

  const handleBack = () => {
    if (onClick) {
      onClick()
      return
    }

    // Check if there is valid navigation history within the app session
    const hasInAppHistory =
      typeof window !== 'undefined' &&
      window.history.state &&
      typeof window.history.state.idx === 'number' &&
      window.history.state.idx > 0

    if (hasInAppHistory) {
      navigate(-1)
    } else {
      // Safe fallback always returns to Dashboard, never to login/external
      navigate(fallback, { replace: true })
    }
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className={cn(
        'group inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-card/70 px-2.5 py-1 text-xs font-medium text-muted-foreground backdrop-blur-xs',
        'hover:border-border hover:bg-secondary hover:text-foreground transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background',
        'active:scale-[0.98] shadow-2xs cursor-pointer select-none',
        className
      )}
      aria-label="Go back"
      title="Go back"
    >
      <ArrowLeft
        className="h-3.5 w-3.5 transition-transform duration-150 group-hover:-translate-x-0.5 text-muted-foreground group-hover:text-foreground"
        aria-hidden="true"
      />
      <span>{label}</span>
    </button>
  )
}

export default BackButton
