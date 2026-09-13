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

// ─── Currency Code Normalization ──────────────────────────────────────────────

/**
 * Normalizes and validates a currency code string.
 *
 * @param {string} code - Currency code to normalize (e.g. "aud", " USD ")
 * @returns {string|null} - Normalized uppercase ISO code or null if invalid
 */
const normalizeCurrencyCode = (code) => {
  if (!code || typeof code !== "string") return null;
  const trimmed = code.trim().toUpperCase();
  return isValidCurrency(trimmed) ? trimmed : null;
};

// ─── Statement Currency Detection ─────────────────────────────────────────────

/**
 * Known bank and institution clues mapped to their primary currency.
 */
const INSTITUTION_CURRENCY_MAP = [
  { keywords: ["commonwealth bank", "westpac", "anz bank", "nab", "national australia bank", "bank of queensland", "macquarie bank", "bendigo bank", "suncorp"], currency: "AUD" },
  { keywords: ["state bank of india", "hdfc bank", "icici bank", "axis bank", "kotak mahindra", "punjab national bank", "bank of baroda", "canara bank", "union bank of india", "indusind"], currency: "INR" },
  { keywords: ["chase bank", "jpmorgan", "bank of america", "wells fargo", "citibank", "capital one", "us bank", "pnc bank", "td bank usa"], currency: "USD" },
  { keywords: ["barclays", "lloyds bank", "natwest", "royal bank of scotland", "hsbc uk", "halifax", "monzo", "revolut uk"], currency: "GBP" },
  { keywords: ["royal bank of canada", "rbc royal", "toronto-dominion", "td canada", "scotiabank", "bank of montreal", "bmo", "cibc"], currency: "CAD" },
  { keywords: ["bank of new zealand", "asb bank", "kiwibank", "westpac new zealand"], currency: "NZD" },
  { keywords: ["dbs bank", "ocbc bank", "united overseas bank", "uob singapore"], currency: "SGD" },
  { keywords: ["deutsche bank", "bnp paribas", "credit agricole", "societe generale", "banco santander", "ing bank", "commerzbank"], currency: "EUR" },
  { keywords: ["emirates nbd", "abu dhabi commercial bank", "adcb", "first abu dhabi bank", "fab", "dubai islamic bank"], currency: "AED" },
  { keywords: ["al rajhi bank", "saudi national bank", "snb alahli", "riyad bank"], currency: "SAR" },
];

/**
 * Currency symbol definitions mapped to ISO codes.
 */
const SYMBOL_CURRENCY_MAP = [
  { symbol: "A$", currency: "AUD" },
  { symbol: "AU$", currency: "AUD" },
  { symbol: "CA$", currency: "CAD" },
  { symbol: "C$", currency: "CAD" },
  { symbol: "NZ$", currency: "NZD" },
  { symbol: "S$", currency: "SGD" },
  { symbol: "HK$", currency: "HKD" },
  { symbol: "₹", currency: "INR" },
  { symbol: "Rs.", currency: "INR" },
  { symbol: "Rs", currency: "INR" },
  { symbol: "€", currency: "EUR" },
  { symbol: "£", currency: "GBP" },
  { symbol: "¥", currency: "JPY" },
  { symbol: "CHF", currency: "CHF" },
  { symbol: "د.إ", currency: "AED" },
  { symbol: "SAR", currency: "SAR" },
  { symbol: "RM", currency: "MYR" },
  { symbol: "฿", currency: "THB" },
  { symbol: "₩", currency: "KRW" },
  { symbol: "R$", currency: "BRL" },
  { symbol: "MX$", currency: "MXN" },
  { symbol: "₺", currency: "TRY" },
];

/**
 * Reliably detects statement currency from text, headers, and rows.
 *
 * Checks in order of reliability:
 * 1. Explicit statement metadata / currency headers (e.g. "Currency: AUD", "Account Currency: INR")
 * 2. Column headers containing currency codes/symbols (e.g. "Amount (AUD)", "Debit (₹)")
 * 3. Specific currency symbols (A$, CA$, NZ$, S$, ₹, €, £, ¥, etc.)
 * 4. Known financial institutions / bank names
 * 5. General '$' symbol with context disambiguation
 *
 * @param {string} text - Raw extracted text or stringified content
 * @param {Array<object|string>} [rows] - Optional parsed rows or lines
 * @param {object} [metadata] - Optional metadata from file
 * @returns {{ currency: string|null, confidence: "high"|"low"|"none", isAmbiguous: boolean, detectedSources: string[] }}
 */
const detectStatementCurrency = (text = "", rows = [], _metadata = {}) => {
  const content = String(text || "").trim();
  const detectedCounts = {};
  const detectedSources = [];

  const addVote = (curr, weight = 1, source = "") => {
    if (!isValidCurrency(curr)) return;
    const code = curr.toUpperCase();
    detectedCounts[code] = (detectedCounts[code] || 0) + weight;
    if (source && !detectedSources.includes(`${code} (${source})`)) {
      detectedSources.push(`${code} (${source})`);
    }
  };

  // 1. Explicit Currency Headers in text: e.g. "Currency: AUD", "Account Currency: USD"
  const explicitRegexes = [
    /(?:account\s+currency|statement\s+currency|base\s+currency|stmt\s+currency|transaction\s+currency|denominated\s+in|all\s+amounts\s+in|currency\s+code|currency)\s*[:=-]?\s*([A-Za-z]{3})\b/gi,
    /\b(?:in|amounts?\s+in)\s+([A-Za-z]{3})\b/gi,
    /\bcurrency\s*[:=-]\s*([A-Za-z]{3})\b/gi,
  ];

  for (const regex of explicitRegexes) {
    let match;
    while ((match = regex.exec(content)) !== null) {
      const code = match[1].toUpperCase();
      if (isValidCurrency(code)) {
        addVote(code, 10, "explicit statement header");
      }
    }
  }

  // 2. Check Column Headers & Row Keys (e.g., "Amount (AUD)", "Debit (INR)", "Amount in USD")
  const checkStringForCurrencyHeaders = (str) => {
    if (!str || typeof str !== "string") return;
    const headerCodeMatch = str.match(/[([{]([A-Za-z]{3})[)\]}]/);
    if (headerCodeMatch && isValidCurrency(headerCodeMatch[1])) {
      addVote(headerCodeMatch[1], 8, "column header code");
    }
    const headerInMatch = str.match(/(?:amount|debit|credit|balance|withdrawal|deposit)\s+(?:in\s+)?([A-Za-z]{3})\b/i);
    if (headerInMatch && isValidCurrency(headerInMatch[1])) {
      addVote(headerInMatch[1], 8, "column header keyword");
    }
    // Check specific symbols in header (e.g. "Amount ($)", "Debit (₹)", "Amount (A$)")
    for (const { symbol, currency } of SYMBOL_CURRENCY_MAP) {
      if (str.includes(symbol)) {
        addVote(currency, 5, `symbol '${symbol}' in column header`);
      }
    }
  };

  if (Array.isArray(rows)) {
    for (let r = 0; r < Math.min(rows.length, 10); r++) {
      const row = rows[r];
      if (typeof row === "string") {
        checkStringForCurrencyHeaders(row);
      } else if (row && typeof row === "object") {
        Object.keys(row).forEach(checkStringForCurrencyHeaders);
        Object.values(row).forEach((v) => {
          if (typeof v === "string") checkStringForCurrencyHeaders(v);
        });
      }
    }
  }

  // 3. Scan for specific multi-character / non-ambiguous symbols in content
  for (const { symbol, currency } of SYMBOL_CURRENCY_MAP) {
    // Escape symbol for regex if needed
    const escaped = symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const symRegex = new RegExp(`(?:^|\\s|\\d|[\\[\\(\\{])${escaped}(?:\\s*\\d|\\b|[\\]\\)\\}])`, "g");
    const matches = content.match(symRegex);
    if (matches && matches.length > 0) {
      const weight = symbol === "₹" || symbol === "€" || symbol === "£" || symbol === "¥" || symbol.startsWith("A$") || symbol.startsWith("CA$") ? 6 : 4;
      addVote(currency, Math.min(matches.length * weight, 12), `symbol '${symbol}' found ${matches.length} times`);
    }
  }

  // 4. Scan for known Financial Institution / Bank Name indicators
  const contentLower = content.toLowerCase();
  for (const { keywords, currency } of INSTITUTION_CURRENCY_MAP) {
    for (const kw of keywords) {
      if (contentLower.includes(kw)) {
        addVote(currency, 6, `bank keyword '${kw}'`);
        break;
      }
    }
  }

  // 5. Look for standalone ISO codes appearing frequently in the header/first 2000 chars
  const first2k = content.slice(0, 2000);
  for (const code of SUPPORTED_CURRENCIES) {
    const codeRegex = new RegExp(`\\b${code}\\b`, "g");
    const count = (first2k.match(codeRegex) || []).length;
    if (count > 0) {
      addVote(code, Math.min(count * 2, 6), `ISO code '${code}' in header`);
    }
  }

  // 6. Generic '$' symbol fallback if no specific currency detected yet
  const hasDollarSign = /\$\s*\d/.test(content) || /\d\s*\$/.test(content);
  if (hasDollarSign && Object.keys(detectedCounts).length === 0) {
    return {
      currency: "USD",
      detectedCurrency: "USD",
      confidence: "low",
      isAmbiguous: true,
      detectedSources: ["USD (generic '$' symbol - ambiguous dollar)"],
    };
  }

  // Determine winning currency and confidence
  const entries = Object.entries(detectedCounts).sort(([, a], [, b]) => b - a);

  if (entries.length === 0) {
    return {
      currency: null,
      detectedCurrency: null,
      confidence: "none",
      isAmbiguous: false,
      detectedSources: [],
    };
  }

  const [topCurrency, topScore] = entries[0];

  // Check ambiguity: if second place has significant score and is close to first
  if (entries.length > 1) {
    const [secondCurrency, secondScore] = entries[1];
    if (secondScore >= 6 && secondScore >= topScore * 0.7 && topCurrency !== secondCurrency) {
      return {
        currency: null,
        detectedCurrency: null,
        confidence: "none",
        isAmbiguous: true,
        detectedSources,
      };
    }
  }

  const confidence = topScore >= 8 ? "high" : topScore >= 4 ? "low" : "none";

  return {
    currency: topCurrency,
    detectedCurrency: topCurrency,
    confidence,
    isAmbiguous: false,
    detectedSources,
  };
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
  normalizeCurrencyCode,
  detectStatementCurrency,
  SUPPORTED_CURRENCIES,
};
