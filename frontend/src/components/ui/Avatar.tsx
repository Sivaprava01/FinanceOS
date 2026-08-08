/**
 * Avatar Component
 * User avatar with image support and initials fallback.
 */

import React from 'react';
import { cn } from '@lib/utils';
import { getInitials } from '@utils/format';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

const Avatar: React.FC<AvatarProps> = ({ src, alt, name, size = 'md', className, ...props }) => {
  const [imgError, setImgError] = React.useState(false);
  const initials = name ? getInitials(name) : '?';

  return (
    <div
      className={cn(
        'relative flex shrink-0 overflow-hidden rounded-full bg-secondary',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {src && !imgError ? (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center font-medium text-secondary-foreground"
          aria-label={alt || name}
        >
          {initials}
        </span>
      )}
    </div>
  );
};

Avatar.displayName = 'Avatar';

export { Avatar };
