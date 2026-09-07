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

const CURRENCY_SYMBOL_MAP: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  JPY: '¥',
  CAD: 'CA$',
  AUD: 'A$',
  CHF: 'CHF',
  CNY: 'CN¥',
  SGD: 'S$',
  HKD: 'HK$',
  NZD: 'NZ$',
  SEK: 'SEK',
  NOK: 'NOK',
  DKK: 'DKK',
  AED: 'د.إ',
  SAR: 'SAR',
  MYR: 'RM',
  THB: '฿',
  KRW: '₩',
  BRL: 'R$',
  MXN: 'MX$',
  ZAR: 'R',
  TRY: '₺',
}

export interface CurrencyOption {
  code: string
  name: string
  symbol: string
}

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: 'CN¥' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'SEK' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'NOK' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'DKK' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
]

/**
 * Get currency symbol for currency code (e.g. AUD -> 'A$', INR -> '₹', USD -> '$')
 */
export function getCurrencySymbol(currency = 'USD'): string {
  const code = (currency ?? 'USD').toUpperCase()
  if (CURRENCY_SYMBOL_MAP[code]) {
    return CURRENCY_SYMBOL_MAP[code]
  }
  const locale = CURRENCY_LOCALE_MAP[code] ?? 'en-US'
  try {
    const parts = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).formatToParts(0)
    const symbolPart = parts.find((p) => p.type === 'currency')
    return symbolPart ? symbolPart.value : code
  } catch {
    return code
  }
}

/**
 * Format currency value using unambiguous currency symbol.
 *
 * Reusable for: Dashboard, Analytics, Transactions, Budgets, Goals,
 *               Investments, Reports, Family Finance, Exports.
 */
export function formatCurrency(value: number, currency = 'USD'): string {
  const code = (currency ?? 'USD').toUpperCase()
  const symbol = getCurrencySymbol(code)
  
  const isNegative = value < 0
  const absValue = Math.abs(value)

  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absValue)

  return isNegative ? `-${symbol}${formattedNumber}` : `${symbol}${formattedNumber}`
}

/**
 * Format compact currency value for charts (e.g. A$6K, ₹6K, $6K, A$0)
 */
export function formatCompactCurrency(value: number, currency = 'USD'): string {
  const symbol = getCurrencySymbol(currency)
  const abs = Math.abs(value)
  const isNegative = value < 0

  let formattedNum: string
  if (abs >= 1000) {
    formattedNum = `${(abs / 1000).toFixed(abs % 1000 === 0 ? 0 : 1)}K`
  } else {
    formattedNum = `${abs}`
  }

  return isNegative ? `-${symbol}${formattedNum}` : `${symbol}${formattedNum}`
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

/**
 * Centralized transaction type normalization.
 * Maps legacy (Debit/Credit) and various casings to 'income' | 'expense' | 'asset' | 'liability'
 */
export function normalizeTransactionType(
  type?: string | null
): 'income' | 'expense' | 'asset' | 'liability' {
  if (!type) return 'expense'
  const t = String(type).trim().toLowerCase()
  if (t === 'credit' || t === 'income') return 'income'
  if (t === 'debit' || t === 'expense') return 'expense'
  if (t === 'asset') return 'asset'
  if (t === 'liability') return 'liability'
  return 'expense'
}

/**
 * Centralized category type normalization.
 * Maps types to capitalized 'Expense' | 'Income' | 'Asset' | 'Liability'
 */
export function normalizeCategoryType(
  type?: string | null
): 'Expense' | 'Income' | 'Asset' | 'Liability' {
  const norm = normalizeTransactionType(type)
  switch (norm) {
    case 'income':
      return 'Income'
    case 'asset':
      return 'Asset'
    case 'liability':
      return 'Liability'
    case 'expense':
    default:
      return 'Expense'
  }
}
