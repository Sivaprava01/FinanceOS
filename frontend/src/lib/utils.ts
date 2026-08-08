/**
 * Tailwind class merge utility.
 * Combines clsx for conditional classes and twMerge for Tailwind conflict resolution.
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
