/**
 * Skeleton Component
 * Animated loading placeholder.
 */

import React from 'react';
import { cn } from '@lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'circular' | 'text';
}

const Skeleton: React.FC<SkeletonProps> = ({ className, variant = 'default', ...props }) => (
  <div
    className={cn(
      'animate-pulse bg-muted',
      variant === 'circular' && 'rounded-full',
      variant === 'default' && 'rounded-md',
      variant === 'text' && 'h-4 w-full rounded',
      className
    )}
    aria-hidden="true"
    {...props}
  />
);

Skeleton.displayName = 'Skeleton';

/**
 * Convenience skeleton presets
 */
const SkeletonText: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <Skeleton variant="text" className={cn('h-4', className)} {...props} />
);

const SkeletonAvatar: React.FC<React.HTMLAttributes<HTMLDivElement> & { size?: number }> = ({
  className,
  size = 40,
  ...props
}) => (
  <Skeleton
    variant="circular"
    className={cn(`h-[${size}px] w-[${size}px]`, className)}
    style={{ height: size, width: size }}
    {...props}
  />
);

export { Skeleton, SkeletonText, SkeletonAvatar };
