/**
 * Currency Controller
 *
 * Thin layer between currency routes and currency service.
 * Responsibilities:
 * - Receive request
 * - Validate inputs
 * - Call service methods
 * - Return ApiResponse
 *
 * No business logic lives here.
 */

import axios from "axios";
import { currencyService } from "../services/currency.service.js";
import { ApiResponse, asyncHandler } from "../utils/index.js";
import { HTTP_STATUS, SETTINGS_MESSAGES } from "../constants/index.js";

// ─── GET /currencies ──────────────────────────────────────────────────────────

export const getSupportedCurrencies = asyncHandler(async (req, res) => {
  const result = await currencyService.getSupportedCurrencies();

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, SETTINGS_MESSAGES.CURRENCIES_FETCHED, result));
});

// ─── GET /currencies/rate ────────────────────────────────────────────────────

export const getExchangeRate = asyncHandler(async (req, res) => {
  const { from, to } = req.query;

  if (!from || !to) {
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json(
        new ApiResponse(
          HTTP_STATUS.BAD_REQUEST,
          "Query parameters 'from' and 'to' are required",
          null
        )
      );
  }

  const rate = await currencyService.getExchangeRate(from, to);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, SETTINGS_MESSAGES.EXCHANGE_RATE_FETCHED, { rate }));
});

// ─── POST /currencies/convert ─────────────────────────────────────────────────

export const convertCurrency = asyncHandler(async (req, res) => {
  const { amount, from, to } = req.body;

  const result = await currencyService.convert(amount, from, to);

  return res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(HTTP_STATUS.OK, SETTINGS_MESSAGES.CURRENCY_CONVERTED, { conversion: result })
    );
});

export const getRates = asyncHandler(async (req, res) => {
  const base = req.query.base || "USD";
  const result = await currencyService.getRates(base);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, SETTINGS_MESSAGES.EXCHANGE_RATE_FETCHED, result));
});

// ─── POST /currencies/convert-batch ───────────────────────────────────────────

export const convertBatch = asyncHandler(async (req, res) => {
  const { amounts, to } = req.body;

  const results = await currencyService.convertMultiple(amounts, to);

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, SETTINGS_MESSAGES.CURRENCY_CONVERTED, {
      conversions: results,
    })
  );
});

// ─── GET /currencies/rates/debug ─────────────────────────────────────────────
// Diagnostic: bypasses backend cache, calls all providers directly
// Usage: GET /api/v1/currencies/rates/debug?base=AUD

export const debugRates = asyncHandler(async (req, res) => {
  const base = (req.query.base || "AUD").toUpperCase();
  const results = [];

  const providers = [
    `https://open.er-api.com/v6/latest/${base}`,
    `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${base.toLowerCase()}.json`,
  ];

  const apiKey = process.env.EXCHANGE_RATE_API_KEY;
  if (apiKey && apiKey !== "demo") {
    providers.unshift(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/${base}`);
  }

  for (const url of providers) {
    const providerName = url.split("/")[2];
    try {
      const t0 = Date.now();
      const response = await axios.get(url, { timeout: 8000 });
      const elapsed = Date.now() - t0;

      let inrRate = null;
      let audRate = null;
      let rateCount = 0;

      if (response.data?.conversion_rates) {
        inrRate = response.data.conversion_rates["INR"];
        audRate = response.data.conversion_rates["AUD"];
        rateCount = Object.keys(response.data.conversion_rates).length;
      } else if (response.data?.rates) {
        inrRate = response.data.rates["INR"];
        audRate = response.data.rates["AUD"];
        rateCount = Object.keys(response.data.rates).length;
      } else if (response.data?.[base.toLowerCase()]) {
        const rawRates = response.data[base.toLowerCase()];
        inrRate = rawRates["inr"];
        audRate = rawRates["aud"];
        rateCount = Object.keys(rawRates).length;
      }

      results.push({
        provider: providerName,
        url,
        success: true,
        elapsedMs: elapsed,
        baseCurrency: base,
        inrRate,
        audRate,
        rateCount,
        sampleConversion: inrRate ? `100 ${base} = ₹${(100 * (base === "AUD" ? inrRate : (inrRate / (audRate || 1)))).toFixed(2)}` : "N/A",
        timestamp: new Date().toISOString(),
      });

      // Stop at first success
      break;
    } catch (err) {
      results.push({
        provider: providerName,
        url,
        success: false,
        error: err.message,
      });
    }
  }

  // Also return the cached rate for comparison
  const cachedRate = await currencyService.getRates(base).catch(() => null);

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, "Exchange rate diagnostic", {
      base,
      liveProviderResults: results,
      cachedServiceResponse: {
        baseCurrency: cachedRate?.baseCurrency,
        inrRate: cachedRate?.rates?.["INR"],
        lastUpdated: cachedRate?.lastUpdated,
      },
      verificationNote: `If liveProviderResults[0].inrRate ≈ ${results[0]?.inrRate?.toFixed(4) || "N/A"}, the live API is working. If the Dashboard shows ₹${results[0]?.inrRate ? (100 * results[0].inrRate).toFixed(2) : "N/A"} for 100 ${base}, live rates are being used.`,
    })
  );
});
