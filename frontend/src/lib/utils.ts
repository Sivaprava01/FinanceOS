/**
 * Utility Functions
 * Common utility functions used throughout the application.
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind CSS classes with clsx
 * Combines clsx for conditional classes and twMerge to handle Tailwind conflicts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Currency locale map — each currency renders with its natural locale.
 * Falls back to 'en-US' for unknown codes.
 */
const CURRENCY_LOCALE_MAP: Record<string, string> = {
  USD: 'en-US', EUR: 'de-DE', GBP: 'en-GB', JPY: 'ja-JP',
  CHF: 'de-CH', CAD: 'en-CA', AUD: 'en-AU', NZD: 'en-NZ',
  CNY: 'zh-CN', INR: 'en-IN', SGD: 'en-SG', HKD: 'zh-HK',
  NOK: 'nb-NO', SEK: 'sv-SE', DKK: 'da-DK', AED: 'ar-AE',
  SAR: 'ar-SA', MYR: 'ms-MY', THB: 'th-TH', KRW: 'ko-KR',
  BRL: 'pt-BR', MXN: 'es-MX', ZAR: 'en-ZA', TRY: 'tr-TR',
  PHP: 'en-PH', IDR: 'id-ID', PKR: 'ur-PK',
}

/**
 * Format currency value using the correct locale for the given currency code.
 * Zero hardcoded currency symbols — everything uses Intl.NumberFormat.
 *
 * Reusable for: Dashboard, Analytics, Transactions, Budgets, Goals,
 *               Investments, Reports, Family Finance, Exports.
 */
export function formatCurrency(value: number, currency = 'USD'): string {
  const code = (currency ?? 'USD').toUpperCase()
  const locale = CURRENCY_LOCALE_MAP[code] ?? 'en-US'
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    // Fallback for unsupported/unknown currency codes
    return `${code} ${value.toFixed(2)}`
  }
}

/**
 * Format date value
 */
export function formatDate(date: Date | string, format: 'short' | 'long' = 'short'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  if (format === 'short') {
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }

    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
