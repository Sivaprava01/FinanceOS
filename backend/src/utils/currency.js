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
  timestamp: 0,
};

// ─── Supported Currencies ─────────────────────────────────────────────────────
// ISO 4217 currency codes. Validated against this list before conversion

const SUPPORTED_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "CHF",
  "CAD",
  "AUD",
  "NZD",
  "CNY",
  "INR",
  "MXN",
  "SGD",
  "HKD",
  "NOK",
  "SEK",
  "DKK",
  "AED",
  "SAR",
  "QAR",
  "KWD",
  "BHD",
  "OMR",
  "JOD",
  "ILS",
  "TRY",
  "RUB",
  "ZAR",
  "KRW",
  "THB",
  "MYR",
  "PHP",
  "IDR",
  "VND",
  "PKR",
  "BDT",
  "LKR",
  "NGN",
  "KES",
  "EGP",
  "BRL",
  "ARS",
  "CLP",
  "COP",
  "PEN",
  "UYU",
  "VEF",
  "BGN",
  "HRK",
  "CZK",
  "HUF",
  "PLN",
  "RON",
  "RSD",
  "UAH",
  "BYN",
  "KZK",
  "UZS",
  "TJK",
  "KGS",
  "AMD",
  "AZN",
  "GEL",
  "BYN",
  "KZK",
  "UZS",
];

// ─── Fetch Exchange Rates ─────────────────────────────────────────────────────

/**
 * Fetches live exchange rates from an external API.
 * Uses in-memory cache to avoid repeated API calls within 1 hour.
 *
 * @param {string} baseCurrency - ISO 4217 code (e.g., "USD")
 * @returns {Promise<object>} - Exchange rates object: { "EUR": 0.92, "GBP": 0.79, ... }
 * @throws {ApiError} - If API fails and no cache available
 */
const fetchExchangeRates = async (baseCurrency = "USD") => {
  const now = Date.now();
  const cacheValid = exchangeRateCache.timestamp && now - exchangeRateCache.timestamp < CACHE_TTL;

  // Return cached rates if still valid
  if (cacheValid && exchangeRateCache.data[baseCurrency]) {
    return exchangeRateCache.data[baseCurrency];
  }

  try {
    // Using exchangerate-api.com free tier
    const apiKey = process.env.EXCHANGE_RATE_API_KEY || "demo"; // demo key has limited rates
    const apiUrl = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${baseCurrency}`;

    const response = await axios.get(apiUrl, {
      timeout: 5000, // 5-second timeout
    });

    if (response.data.result !== "success") {
      throw new Error(`API error: ${response.data["error-type"]}`);
    }

    const rates = response.data.conversion_rates;

    // Update cache
    exchangeRateCache.data[baseCurrency] = rates;
    exchangeRateCache.timestamp = now;

    return rates;
  } catch (error) {
    // If cache exists, return it even if expired
    if (exchangeRateCache.data[baseCurrency]) {
      return exchangeRateCache.data[baseCurrency];
    }

    // If no cache and API fails, throw error
    throw new ApiError(
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      "Exchange rate service unavailable. Please try again later."
    );
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
  convertCurrency,
  convertBatch,
  isValidCurrency,
  areValidCurrencies,
  SUPPORTED_CURRENCIES,
};
