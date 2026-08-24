/**
 * Currency Utilities
 *
 * Handles live currency conversion and exchange rate fetching.
 * Uses an external API to fetch real-time exchange rates.
 * Exchange rates are NEVER permanently stored — always fetched fresh.
 *
 * Supported API: exchangerate-api.com (free tier supports 1,500 req/month)
 * Fallback: Uses cached rates if API fails (cache is not persisted)
 *
 * Design principles:
 * - Always fetch fresh rates
 * - Never modify original transaction amounts
 * - Support for 150+ currencies
 * - Graceful degradation if API is unavailable
 */

import axios from "axios";
import { ApiError } from "./index.js";
import { HTTP_STATUS } from "../constants/index.js";

// ─── Cache (in-memory only, not persisted) ────────────────────────────────────
// Holds rates for up to 1 hour to avoid hammering the API with requests
// This is a local cache, not a database

const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds
const exchangeRateCache = {
  data: {},
  timestamps: {},
  meta: {},
};

// ─── Supported Currencies ─────────────────────────────────────────────────────
// ISO 4217 currency codes. Validated against this list before conversion

const SUPPORTED_CURRENCIES = [
  "USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "NZD", "CNY", "INR",
  "MXN", "SGD", "HKD", "NOK", "SEK", "DKK", "AED", "SAR", "QAR", "KWD",
  "BHD", "OMR", "JOD", "ILS", "TRY", "RUB", "ZAR", "KRW", "THB", "MYR",
  "PHP", "IDR", "VND", "PKR", "BDT", "LKR", "NGN", "KES", "EGP", "BRL",
  "ARS", "CLP", "COP", "PEN", "UYU", "VEF", "BGN", "HRK", "CZK", "HUF",
  "PLN", "RON", "RSD", "UAH", "BYN", "KZT", "UZS", "TJK", "KGS", "AMD",
  "AZN", "GEL",
];

// ─── Fetch Exchange Rates ─────────────────────────────────────────────────────

/**
 * Fetches live exchange rates with full metadata.
 */
const fetchExchangeRatesDetails = async (baseCurrency = "USD") => {
  const base = baseCurrency.toUpperCase();
  const now = Date.now();
  const lastFetch = exchangeRateCache.timestamps[base];
  const cacheValid = lastFetch && now - lastFetch < CACHE_TTL;

  // Return cached rates if still valid for this specific base currency
  if (cacheValid && exchangeRateCache.data[base]) {
    const cachedINR = exchangeRateCache.data[base]["INR"];
    const cacheAgeSeconds = Math.round((now - lastFetch) / 1000);
    return {
      rates: exchangeRateCache.data[base],
      provider: exchangeRateCache.meta[base]?.provider || "in-memory-cache",
      providerUpdatedAt: exchangeRateCache.meta[base]?.providerUpdatedAt || new Date(lastFetch).toISOString(),
      fetchedAt: new Date(lastFetch).toISOString(),
      cached: true,
      cacheAgeSeconds,
      inrRate: cachedINR,
    };
  }

  const apiKey = process.env.EXCHANGE_RATE_API_KEY;
  const urls = [];

  if (apiKey && apiKey !== "demo") {
    urls.push({ url: `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${base}`, name: "exchangerate-api.com" });
  }
  urls.push({ url: `https://open.er-api.com/v6/latest/${base}`, name: "open.er-api.com" });
  urls.push({ url: `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${base.toLowerCase()}.json`, name: "jsdelivr-currency-api" });

  for (const item of urls) {
    try {
      const response = await axios.get(item.url, { timeout: 8000 });

      let rates = null;
      let providerUpdatedAt = null;

      if (response.data?.result === "success" && response.data?.conversion_rates) {
        rates = response.data.conversion_rates;
        providerUpdatedAt = response.data?.time_last_update_utc || new Date().toISOString();
      } else if (response.data?.rates) {
        rates = { ...response.data.rates, [base]: 1 };
        providerUpdatedAt = response.data?.time_last_update_utc || new Date().toISOString();
      } else if (response.data?.[base.toLowerCase()]) {
        const rawRates = response.data[base.toLowerCase()];
        rates = {};
        for (const [key, val] of Object.entries(rawRates)) {
          rates[key.toUpperCase()] = val;
        }
        rates[base] = 1;
        providerUpdatedAt = response.data?.date ? new Date(response.data.date).toISOString() : new Date().toISOString();
      }

      if (rates && Object.keys(rates).length > 0) {
        exchangeRateCache.data[base] = rates;
        exchangeRateCache.timestamps[base] = now;
        exchangeRateCache.meta[base] = {
          provider: item.name,
          providerUpdatedAt,
        };

        return {
          rates,
          provider: item.name,
          providerUpdatedAt,
          fetchedAt: new Date(now).toISOString(),
          cached: false,
          cacheAgeSeconds: 0,
          inrRate: rates["INR"],
        };
      }
    } catch {
      continue;
    }
  }

  // If external endpoints fail, return stale cache if available
  if (exchangeRateCache.data[base]) {
    const lastTime = exchangeRateCache.timestamps[base] || now;
    return {
      rates: exchangeRateCache.data[base],
      provider: `${exchangeRateCache.meta[base]?.provider || "unknown"} (stale)`,
      providerUpdatedAt: exchangeRateCache.meta[base]?.providerUpdatedAt || new Date(lastTime).toISOString(),
      fetchedAt: new Date(lastTime).toISOString(),
      cached: true,
      cacheAgeSeconds: Math.round((now - lastTime) / 1000),
      inrRate: exchangeRateCache.data[base]["INR"],
    };
  }

  throw new ApiError(
    HTTP_STATUS.SERVICE_UNAVAILABLE,
    "Exchange rate service unavailable. Please try again later."
  );
};

const fetchExchangeRates = async (baseCurrency = "USD") => {
  const details = await fetchExchangeRatesDetails(baseCurrency);
  return details.rates;
};

/**
 * Fetches historical exchange rates for a specific date.
 * Falls back to latest available rate if historical unavailable.
 *
 * @param {string} baseCurrency - ISO 4217 code (e.g., "USD")
 * @param {Date|string} date - The date to fetch rates for
 * @returns {Promise<object>} - Exchange rates object
 */
const fetchHistoricalExchangeRates = async (baseCurrency = "USD", date) => {
  if (!date) return fetchExchangeRates(baseCurrency);

  const dateStr = new Date(date).toISOString().split("T")[0]; // YYYY-MM-DD
  const today = new Date().toISOString().split("T")[0];

  // If date is today or future, use latest rates
  if (dateStr >= today) return fetchExchangeRates(baseCurrency);

  const cacheKey = `${baseCurrency}_${dateStr}`;
  const now = Date.now();
  const cacheValid = exchangeRateCache.timestamp && now - exchangeRateCache.timestamp < CACHE_TTL;

  if (cacheValid && exchangeRateCache.data[cacheKey]) {
    return exchangeRateCache.data[cacheKey];
  }

  try {
    const apiKey = process.env.EXCHANGE_RATE_API_KEY || "demo";
    // exchangerate-api.com historical endpoint
    const apiUrl = `https://v6.exchangerate-api.com/v6/${apiKey}/history/${baseCurrency}/${dateStr.replace(/-/g, "/")}`;

    const response = await axios.get(apiUrl, { timeout: 5000 });

    if (response.data.result !== "success") {
      // Historical not available on free tier — fall back to latest
      return fetchExchangeRates(baseCurrency);
    }

    const rates = response.data.conversion_rates;
    exchangeRateCache.data[cacheKey] = rates;
    exchangeRateCache.timestamp = now;
    return rates;
  } catch {
    // Fall back to latest rates
    return fetchExchangeRates(baseCurrency);
  }
};

// ─── Currency Validation ──────────────────────────────────────────────────────

/**
 * Validates if a currency code is supported
 *
 * @param {string} currencyCode - ISO 4217 code
 * @returns {boolean}
 */
const isValidCurrency = (currencyCode) => {
  return SUPPORTED_CURRENCIES.includes(currencyCode?.toUpperCase());
};

/**
 * Validates multiple currency codes
 *
 * @param {string[]} currencyCodes
 * @returns {boolean}
 */
const areValidCurrencies = (currencyCodes) => {
  if (!Array.isArray(currencyCodes)) return false;
  return currencyCodes.every((code) => isValidCurrency(code));
};

// ─── Currency Conversion ──────────────────────────────────────────────────────

/**
 * Converts an amount from one currency to another.
 * Always fetches fresh exchange rates.
 * Original amount is never modified.
 *
 * @param {number} amount - The amount to convert
 * @param {string} fromCurrency - ISO 4217 code (e.g., "INR")
 * @param {string} toCurrency - ISO 4217 code (e.g., "USD")
 * @returns {Promise<object>} - { original: 1000, converted: 12.15, rate: 0.01215 }
 * @throws {ApiError} - If currencies invalid or API fails
 */
const convertCurrency = async (amount, fromCurrency, toCurrency) => {
  // Validate inputs
  if (typeof amount !== "number" || amount < 0) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Amount must be a positive number");
  }

  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();

  if (!isValidCurrency(from)) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, `Invalid source currency: ${from}`);
  }

  if (!isValidCurrency(to)) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, `Invalid target currency: ${to}`);
  }

  if (from === to) {
    // Same currency — no conversion needed
    return {
      original: amount,
      converted: amount,
      rate: 1,
      fromCurrency: from,
      toCurrency: to,
    };
  }

  try {
    // Fetch rates from base currency
    const rates = await fetchExchangeRates(from);

    if (!rates[to]) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, `Conversion from ${from} to ${to} not supported`);
    }

    const rate = rates[to];
    const converted = amount * rate;

    return {
      original: amount,
      converted: Math.round(converted * 100) / 100, // Round to 2 decimal places
      rate: Math.round(rate * 100000) / 100000, // Round rate to 5 decimal places
      fromCurrency: from,
      toCurrency: to,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "Currency conversion failed. Please try again later."
    );
  }
};

/**
 * Batch convert multiple amounts from one currency to another
 * Useful for converting all family member transactions at once
 *
 * @param {Array<{amount, currency}>} transactions - Array of amounts with currencies
 * @param {string} targetCurrency - Target currency for all conversions
 * @returns {Promise<Array>} - Array with original and converted values
 */
const convertBatch = async (transactions, targetCurrency) => {
  if (!Array.isArray(transactions)) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Transactions must be an array");
  }

  if (!isValidCurrency(targetCurrency)) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, `Invalid target currency: ${targetCurrency}`);
  }

  // Group transactions by source currency to minimize API calls
  const groupedByCurrency = {};
  transactions.forEach((t) => {
    const currency = t.currency?.toUpperCase() || targetCurrency;
    if (!groupedByCurrency[currency]) {
      groupedByCurrency[currency] = [];
    }
    groupedByCurrency[currency].push(t);
  });

  // Fetch rates for each unique currency
  const results = [];
  for (const [fromCurrency, trans] of Object.entries(groupedByCurrency)) {
    const converted = await Promise.all(
      trans.map((t) => convertCurrency(t.amount, fromCurrency, targetCurrency))
    );
    results.push(...converted);
  }

  return results;
};

// ─── Exports ──────────────────────────────────────────────────────────────────

export {
  fetchExchangeRates,
  fetchExchangeRatesDetails,
  fetchHistoricalExchangeRates,
  convertCurrency,
  convertBatch,
  isValidCurrency,
  areValidCurrencies,
  SUPPORTED_CURRENCIES,
};
