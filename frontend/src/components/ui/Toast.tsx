/**
 * Toast Component
 * Notification toast with variants.
 * Phase 1: Presentational component only.
 */

import React from 'react';
import { type VariantProps } from 'class-variance-authority';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@lib/utils';
import { toastVariants } from './toast-variants';

const variantIcons = {
  default: Info,
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

export interface ToastProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof toastVariants> {
  title?: string;
  description?: string;
  onClose?: () => void;
}

const Toast: React.FC<ToastProps> = ({
  className,
  variant = 'default',
  title,
  description,
  onClose,
  children,
  ...props
}) => {
  const Icon = variantIcons[variant ?? 'default'];

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={cn(toastVariants({ variant }), className)}
      {...props}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="flex-1 space-y-1">
        {title && <p className="text-sm font-semibold">{title}</p>}
        {description && <p className="text-sm opacity-90">{description}</p>}
        {children}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-auto shrink-0 rounded-md p-0.5 opacity-60 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

Toast.displayName = 'Toast';

export { Toast };
