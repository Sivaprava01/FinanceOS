/**
 * useCurrency hook
 * Provides currency formatting using the authenticated user's preferredCurrency.
 * Falls back to USD if not set.
 */

import { useCallback } from 'react'
import { useAuth } from '@hooks/useAuth'
import { formatCurrency } from '@lib/utils'

export const useCurrency = () => {
  const { user } = useAuth()
  const currency = user?.preferredCurrency ?? 'USD'

  const format = useCallback(
    (value: number) => formatCurrency(value, currency),
    [currency]
  )

  return { format, currency }
}
