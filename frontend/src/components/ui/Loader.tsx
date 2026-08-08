/**
 * Loader Component
 * Animated loading spinner.
 */

import React from 'react';
import { cn } from '@lib/utils';

export interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'muted' | 'white';
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
  xl: 'h-12 w-12 border-4',
};

const colorClasses = {
  primary: 'border-primary/20 border-t-primary',
  muted: 'border-muted-foreground/20 border-t-muted-foreground',
  white: 'border-white/20 border-t-white',
};

const Loader: React.FC<LoaderProps> = ({ size = 'md', color = 'primary', className, ...props }) => (
  <div
    role="status"
    aria-label="Loading"
    className={cn(
      'inline-block animate-spin rounded-full',
      sizeClasses[size],
      colorClasses[color],
      className
    )}
    {...props}
  >
    <span className="sr-only">Loading…</span>
  </div>
);

Loader.displayName = 'Loader';

export { Loader };
