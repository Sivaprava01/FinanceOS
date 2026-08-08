/**
 * Radio Component
 * Accessible styled radio button input.
 */

import React from 'react';
import { cn } from '@lib/utils';

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: boolean;
}

const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const radioId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex items-center gap-2">
        <input
          type="radio"
          id={radioId}
          ref={ref}
          className={cn(
            'h-4 w-4 border border-input bg-background text-primary accent-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
            error && 'border-destructive',
            className
          )}
          {...props}
        />
        {label && (
          <label
            htmlFor={radioId}
            className="text-sm font-medium leading-none cursor-pointer select-none"
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);

Radio.displayName = 'Radio';

export { Radio };
