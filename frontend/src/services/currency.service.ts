import axios from 'axios'
import api from './api'
import type { ApiResponse } from '@/types'

export interface ExchangeRatesData {
  baseCurrency: string
  rates: Record<string, number>
  lastUpdated: string
  fetchedAt?: string
  providerUpdatedAt?: string
  provider?: string
  source?: 'backend' | 'open-er-api' | 'jsdelivr'
  cached?: boolean
  cacheAgeSeconds?: number
  inrRate?: number
}

export const currencyService = {
  getRates: async (baseCurrency = 'USD'): Promise<ExchangeRatesData> => {
    const base = baseCurrency.toUpperCase()
    const nowIso = new Date().toISOString()

    // 1. Try FinanceOS Backend API
    try {
      const response = await api.get<ApiResponse<ExchangeRatesData>>('/currencies/rates', {
        params: { base },
        timeout: 5000,
      })
      if (response.data?.data?.rates && Object.keys(response.data.data.rates).length > 0) {
        const d = response.data.data
        return {
          ...d,
          source: 'backend',
          provider: d.provider || 'backend-api',
          fetchedAt: d.fetchedAt || nowIso,
          providerUpdatedAt: d.providerUpdatedAt || d.lastUpdated,
          cached: d.cached ?? false,
          cacheAgeSeconds: d.cacheAgeSeconds ?? 0,
        }
      }
    } catch {
      // Backend not running or timeout — try direct live provider
    }

    // 2. Direct Live Provider 1: open.er-api.com (public CORS-enabled real-time endpoint)
    try {
      const liveRes = await axios.get(`https://open.er-api.com/v6/latest/${base}`, { timeout: 6000 })
      if (liveRes.data?.result === 'success' && liveRes.data?.rates) {
        const rates = { ...liveRes.data.rates, [base]: 1 }
        return {
          baseCurrency: base,
          rates,
          lastUpdated: nowIso,
          fetchedAt: nowIso,
          providerUpdatedAt: liveRes.data?.time_last_update_utc || nowIso,
          provider: 'open.er-api.com',
          source: 'open-er-api',
          cached: false,
          cacheAgeSeconds: 0,
          inrRate: rates['INR'],
        }
      }
    } catch {
      // Provider 1 failed — try provider 2
    }

    // 3. Direct Live Provider 2: jsdelivr currency-api
    try {
      const cdnRes = await axios.get(
        `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${base.toLowerCase()}.json`,
        { timeout: 6000 }
      )
      const rawRates = cdnRes.data?.[base.toLowerCase()]
      if (rawRates && Object.keys(rawRates).length > 0) {
        const rates: Record<string, number> = {}
        for (const [k, v] of Object.entries(rawRates)) {
          rates[k.toUpperCase()] = Number(v)
        }
        rates[base] = 1
        return {
          baseCurrency: base,
          rates,
          lastUpdated: nowIso,
          fetchedAt: nowIso,
          providerUpdatedAt: cdnRes.data?.date ? new Date(cdnRes.data.date).toISOString() : nowIso,
          provider: 'jsdelivr-currency-api',
          source: 'jsdelivr',
          cached: false,
          cacheAgeSeconds: 0,
          inrRate: rates['INR'],
        }
      }
    } catch {
      // Provider 2 failed
    }

    throw new Error(`All live exchange rate providers failed for base ${base}`)
  },
}

