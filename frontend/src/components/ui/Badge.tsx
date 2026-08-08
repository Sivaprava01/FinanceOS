/**
 * Badge Component
 * Status/label indicator with multiple variants.
 */

import React from 'react';
import { type VariantProps } from 'class-variance-authority';
import { cn } from '@lib/utils';
import { badgeVariants } from './badge-variants';

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

const Badge: React.FC<BadgeProps> = ({ className, variant, ...props }) => (
  <span className={cn(badgeVariants({ variant }), className)} {...props} />
);

Badge.displayName = 'Badge';

export { Badge };
