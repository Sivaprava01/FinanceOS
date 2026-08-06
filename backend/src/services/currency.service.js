/**
 * Currency Service
 *
 * Business logic for currency conversion and exchange rates.
 * Acts as a thin wrapper around the currency utilities.
 * All exchange rates are fetched fresh — never permanently stored.
 *
 * Core responsibilities:
 * - Provide list of supported currencies
 * - Convert individual amounts
 * - Batch convert multiple amounts
 * - Get current exchange rate
 */

import {
  fetchExchangeRates,
  convertCurrency,
  convertBatch,
  isValidCurrency,
  SUPPORTED_CURRENCIES,
} from "../utils/currency.js";
import { ApiError } from "../utils/index.js";
import { HTTP_STATUS, SETTINGS_MESSAGES } from "../constants/index.js";

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Get list of all supported currencies
 *
 * @returns {Promise<Array>}
 */
const getSupportedCurrencies = async () => {
  return {
    currencies: SUPPORTED_CURRENCIES,
    count: SUPPORTED_CURRENCIES.length,
  };
};

/**
 * Get current exchange rate from one currency to another
 * Always fetches fresh rates
 *
 * @param {string} fromCurrency - ISO 4217 code
 * @param {string} toCurrency - ISO 4217 code
 * @returns {Promise<object>} - { rate: 0.92, fromCurrency: "EUR", toCurrency: "USD", ... }
 */
const getExchangeRate = async (fromCurrency, toCurrency) => {
  const from = fromCurrency?.toUpperCase();
  const to = toCurrency?.toUpperCase();

  if (!isValidCurrency(from)) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, `Invalid source currency: ${from}`);
  }

  if (!isValidCurrency(to)) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, `Invalid target currency: ${to}`);
  }

  if (from === to) {
    return {
      fromCurrency: from,
      toCurrency: to,
      rate: 1,
      lastUpdated: new Date().toISOString(),
    };
  }

  try {
    const rates = await fetchExchangeRates(from);
    const rate = rates[to];

    return {
      fromCurrency: from,
      toCurrency: to,
      rate: Math.round(rate * 100000) / 100000,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      "Could not fetch exchange rate. Please try again later."
    );
  }
};

/**
 * Convert a single amount from one currency to another
 *
 * @param {number} amount
 * @param {string} fromCurrency - ISO 4217 code
 * @param {string} toCurrency - ISO 4217 code
 * @returns {Promise<object>}
 */
const convert = async (amount, fromCurrency, toCurrency) => {
  return convertCurrency(amount, fromCurrency, toCurrency);
};

/**
 * Convert multiple amounts (useful for family finance)
 *
 * @param {Array<{amount, currency}>} amounts - Array of {amount, currency}
 * @param {string} targetCurrency - Target currency for all
 * @returns {Promise<Array>}
 */
const convertMultiple = async (amounts, targetCurrency) => {
  return convertBatch(amounts, targetCurrency);
};

// ─── Exports ──────────────────────────────────────────────────────────────────

export const currencyService = {
  getSupportedCurrencies,
  getExchangeRate,
  convert,
  convertMultiple,
};
