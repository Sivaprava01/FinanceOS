/**
 * Currency Formatting Utility
 * Formats amounts according to user's preferred currency
 * NOTE: Values are NOT converted - only formatting changes
 */

import type { User } from '@/types';

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  JPY: '¥',
  CAD: '$',
  AUD: '$',
  SGD: '$',
  AED: 'د.إ',
};

/**
 * Format amount with user's preferred currency symbol
 * @param amount Numeric amount (not converted)
 * @param currency Currency code (e.g., 'USD', 'EUR')
 * @returns Formatted string like "$100.50" or "€100,50"
 */
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;

  // For most currencies, use standard formatting
  if (currency === 'JPY') {
    // JPY doesn't use decimal places
    return `${symbol}${amount.toFixed(0)}`;
  }

  return `${symbol}${amount.toFixed(2)}`;
};

/**
 * Format amount for display in UI
 * Uses user's preferred currency from their profile
 */
export const formatCurrencyFromUser = (amount: number, user: User | null | undefined): string => {
  const currency = user?.preferredCurrency || 'USD';
  return formatCurrency(amount, currency);
};
