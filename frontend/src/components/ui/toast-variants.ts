/**
 * Toast variant definitions (CVA).
 * Separated to satisfy React Fast Refresh rules.
 */

import { cva } from 'class-variance-authority';

export const toastVariants = cva(
  'relative flex w-full max-w-sm items-start gap-3 rounded-xl border p-4 shadow-lg transition-all',
  {
    variants: {
      variant: {
        default: 'border-border bg-card text-card-foreground',
        success:
          'border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100',
        error:
          'border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/40',
        warning:
          'border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-100',
        info: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);
