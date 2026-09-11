import { useQuery } from '@tanstack/react-query'
import { useCurrency } from './useCurrency'
import { currencyService } from '@services/currency.service'
import { formatCurrency } from '@lib/utils'
import { useEffect } from 'react'

export type RateStatus = 'live' | 'cached' | 'fallback' | 'loading' | 'unavailable' | 'none'

export interface DualAmountResult {
  primary: string
  secondary: string | null
  source: RateStatus
  rate: number | null
}

export interface DualTransactionResult {
  primaryFormatted: string
  preferredFormatted: string | null
  inrFormatted: string | null
  isForeign: boolean
  source: 'live' | 'cached' | 'fallback' | 'none'
}

export interface ConversionMetaResult {
  converted: number | null
  rate: number | null
  source: 'live' | 'cached' | 'fallback' | 'unavailable'
}

/**
 * Normalized USD-base fallback rates (1 USD = X foreign currency).
 * Used ONLY as a last-resort offline fallback if all live providers fail.
 */
const FALLBACK_RATES_USD: Record<string, number> = {
  USD: 1.000,
  EUR: 0.920,
  GBP: 0.790,
  INR: 83.50,
  JPY: 149.50,
  CAD: 1.360,
  AUD: 1.219,
  CHF: 0.895,
  CNY: 7.230,
  SGD: 1.340,
  HKD: 7.820,
  NZD: 1.630,
  SEK: 10.42,
  NOK: 10.55,
  DKK: 6.880,
  AED: 3.672,
  SAR: 3.750,
  MYR: 4.710,
  THB: 35.20,
  KRW: 1332.0,
  BRL: 4.970,
  MXN: 17.15,
  ZAR: 18.62,
  TRY: 32.40,
}

/**
 * Convert an amount from any currency to any currency with full source metadata.
 */
export function convertCurrencyWithMeta(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  ratesData?: {
    baseCurrency?: string
    rates?: Record<string, number>
    cached?: boolean
    fetchedAt?: string
    lastUpdated?: string
  }
): ConversionMetaResult {
  if (!Number.isFinite(amount)) {
    return { converted: null, rate: null, source: 'unavailable' }
  }

  const from = (fromCurrency || 'USD').toUpperCase()
  const to = (toCurrency || 'INR').toUpperCase()

  if (from === to) {
    return { converted: amount, rate: 1, source: 'live' }
  }

  const rates = ratesData?.rates
  const base = (ratesData?.baseCurrency || '').toUpperCase()
  const isCached = ratesData?.cached === true || Boolean(ratesData?.fetchedAt && (Date.now() - new Date(ratesData.fetchedAt).getTime()) > 5 * 60 * 1000)
  const successSource: 'live' | 'cached' = isCached ? 'cached' : 'live'

  // 1. Direct rate when base equals source currency
  if (rates && base === from && rates[to] && Number.isFinite(rates[to]) && rates[to] > 0) {
    const rate = rates[to]
    return { converted: amount * rate, rate, source: successSource }
  }

  // 2. Inverse rate when base equals target currency
  if (rates && base === to && rates[from] && Number.isFinite(rates[from]) && rates[from] > 0) {
    const rate = 1 / rates[from]
    return { converted: amount * rate, rate, source: successSource }
  }

  // 3. Cross-rate conversion via API base currency
  if (rates && rates[from] && rates[to] && rates[from] > 0 && rates[to] > 0) {
    const rate = rates[to] / rates[from]
    return { converted: amount * rate, rate, source: successSource }
  }

  // 4. Fallback cross-rate conversion via USD base
  const fallbackFrom = FALLBACK_RATES_USD[from]
  const fallbackTo = FALLBACK_RATES_USD[to]

  if (fallbackFrom && fallbackFrom > 0 && fallbackTo && fallbackTo > 0) {
    const rate = fallbackTo / fallbackFrom
    return { converted: amount * rate, rate, source: 'fallback' }
  }

  return { converted: null, rate: null, source: 'unavailable' }
}

/**
 * Backwards-compatible numeric converter.
 */
export function convertCurrencyAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  ratesData?: { baseCurrency?: string; rates?: Record<string, number> }
): number | null {
  return convertCurrencyWithMeta(amount, fromCurrency, toCurrency, ratesData).converted
}

/**
 * Helper function to format an amount into primary preferred currency & secondary INR reference.
 */
export function formatDualCurrency(
  amount: number,
  preferredCurrency: string,
  ratesData?: {
    baseCurrency?: string
    rates?: Record<string, number>
    cached?: boolean
    fetchedAt?: string
    lastUpdated?: string
  }
): DualAmountResult {
  const prefUpper = (preferredCurrency || 'USD').toUpperCase()
  const primary = formatCurrency(amount, prefUpper)

  if (prefUpper === 'INR') {
    return { primary, secondary: null, source: 'none', rate: 1 }
  }

  const meta = convertCurrencyWithMeta(amount, prefUpper, 'INR', ratesData)

  if (!Number.isFinite(meta.converted)) {
    return { primary, secondary: null, source: 'unavailable', rate: null }
  }

  const secondary = formatCurrency(meta.converted!, 'INR')
  return { primary, secondary, source: meta.source, rate: meta.rate }
}

/**
 * Helper function for signed dual currency amounts (+ / -)
 */
export function formatDualSignedCurrency(
  amount: number,
  preferredCurrency: string,
  ratesData?: {
    baseCurrency?: string
    rates?: Record<string, number>
    cached?: boolean
    fetchedAt?: string
    lastUpdated?: string
  },
  forceSign?: '+' | '-'
): DualAmountResult {
  const absAmount = Math.abs(amount)
  const sign = forceSign ? forceSign : amount >= 0 ? '+' : '-'
  const dual = formatDualCurrency(absAmount, preferredCurrency, ratesData)

  return {
    primary: `${sign}${dual.primary}`,
    secondary: dual.secondary ? `${sign}${dual.secondary}` : null,
    source: dual.source,
    rate: dual.rate,
  }
}

export function useDualCurrencyConversion() {
  const { currency: preferredCurrency, format: formatPrimary } = useCurrency()
  const prefUpper = (preferredCurrency || 'USD').toUpperCase()
  const hasSecondaryINR = prefUpper !== 'INR'

  const { data: ratesData, isLoading, isError } = useQuery({
    queryKey: ['exchangeRates', prefUpper],
    queryFn: () => currencyService.getRates(prefUpper),
    staleTime: 5 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 3,
  })

  const hasRates = Boolean(ratesData?.rates && Object.keys(ratesData.rates).length > 0)
  const isCached = hasRates && (ratesData?.cached === true || Boolean(ratesData?.fetchedAt && (Date.now() - new Date(ratesData.fetchedAt).getTime()) > 5 * 60 * 1000))
  
  const rateStatus: RateStatus = !hasSecondaryINR
    ? 'none'
    : hasRates
    ? (isCached ? 'cached' : 'live')
    : isLoading
    ? 'loading'
    : isError
    ? 'fallback'
    : 'fallback'

  const isLive = rateStatus === 'live'
  const isCachedStatus = rateStatus === 'cached'
  const liveInrRate = ratesData?.rates?.['INR'] ?? null

  // Safe development-only diagnostic logging
  useEffect(() => {
    if (import.meta.env.DEV && ratesData?.rates) {
      const sampleRate = ratesData.rates['INR']
      // eslint-disable-next-line no-console
      console.log(
        `[FinanceOS Currency]\n` +
        `Preferred currency: ${prefUpper}\n` +
        `Displayed conversion: 100 ${prefUpper} → ${(100 * (sampleRate || 0)).toFixed(2)} INR\n` +
        `Rate: ${sampleRate}\n` +
        `Status: ${rateStatus}\n` +
        `Provider: ${ratesData.provider || 'N/A'}\n` +
        `Source: ${ratesData.source || 'backend'}\n` +
        `Fetched at: ${ratesData.fetchedAt || ratesData.lastUpdated}\n` +
        `Provider updated at: ${ratesData.providerUpdatedAt || 'N/A'}\n` +
        `Cache state: ${isCached ? 'cached' : 'fresh'}`
      )
    }
  }, [ratesData, prefUpper, rateStatus, isCached])

  const getDualAmount = (amount: number): DualAmountResult => {
    return formatDualCurrency(amount, prefUpper, ratesData)
  }

  const getDualSignedAmount = (amount: number, forceSign?: '+' | '-'): DualAmountResult => {
    return formatDualSignedCurrency(amount, prefUpper, ratesData, forceSign)
  }

  const formatINR = (amountInPreferred: number): string | null => {
    const res = formatDualCurrency(amountInPreferred, prefUpper, ratesData)
    return res.secondary
  }

  const convertTransaction = (amount: number, transactionCurrency?: string | null): DualTransactionResult => {
    const txCurrency = (transactionCurrency || prefUpper).toUpperCase()
    const isForeign = txCurrency !== prefUpper

    const primaryFormatted = formatCurrency(amount, txCurrency)

    let amountInPref = amount
    let txSource: 'live' | 'cached' | 'fallback' | 'none' = 'none'

    if (isForeign) {
      const meta = convertCurrencyWithMeta(amount, txCurrency, prefUpper, ratesData)
      if (Number.isFinite(meta.converted)) {
        amountInPref = meta.converted!
        txSource = meta.source === 'live' ? 'live' : meta.source === 'cached' ? 'cached' : 'fallback'
      }
    }

    const preferredFormatted = isForeign ? formatCurrency(amountInPref, prefUpper) : null

    let inrFormatted: string | null = null
    if (hasSecondaryINR && txCurrency !== 'INR') {
      const inrMeta = convertCurrencyWithMeta(amountInPref, prefUpper, 'INR', ratesData)
      if (Number.isFinite(inrMeta.converted)) {
        inrFormatted = formatCurrency(inrMeta.converted!, 'INR')
      }
    }

    return {
      primaryFormatted,
      preferredFormatted,
      inrFormatted,
      isForeign,
      source: txSource,
    }
  }

  return {
    preferredCurrency: prefUpper,
    hasSecondaryINR,
    formatPrimary,
    formatINR,
    getDualAmount,
    getDualSignedAmount,
    convertTransaction,
    convertCurrencyAmount: (amt: number, from: string, to: string) => convertCurrencyAmount(amt, from, to, ratesData),
    convertCurrencyWithMeta: (amt: number, from: string, to: string) => convertCurrencyWithMeta(amt, from, to, ratesData),
    ratesData,
    isLive,
    isCached: isCachedStatus,
    rateStatus,
    rateSource: rateStatus,
    liveInrRate,
    isLoadingRates: isLoading,
    isError,
  }
}

// Alias for backwards compatibility
export const useCurrencyConversion = useDualCurrencyConversion




