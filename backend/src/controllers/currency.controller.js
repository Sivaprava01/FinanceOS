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

import { currencyService } from "../services/currency.service.js";
import { ApiResponse, asyncHandler } from "../utils/index.js";
import { HTTP_STATUS, SETTINGS_MESSAGES } from "../constants/index.js";

// ─── GET /currencies ──────────────────────────────────────────────────────────

export const getSupportedCurrencies = asyncHandler(async (req, res) => {
  const result = await currencyService.getSupportedCurrencies();

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      SETTINGS_MESSAGES.CURRENCIES_FETCHED,
      result
    )
  );
});

// ─── GET /currencies/rate ────────────────────────────────────────────────────

export const getExchangeRate = asyncHandler(async (req, res) => {
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(
      new ApiResponse(
        HTTP_STATUS.BAD_REQUEST,
        "Query parameters 'from' and 'to' are required",
        null
      )
    );
  }

  const rate = await currencyService.getExchangeRate(from, to);

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      SETTINGS_MESSAGES.EXCHANGE_RATE_FETCHED,
      { rate }
    )
  );
});

// ─── POST /currencies/convert ─────────────────────────────────────────────────

export const convertCurrency = asyncHandler(async (req, res) => {
  const { amount, from, to } = req.body;

  const result = await currencyService.convert(amount, from, to);

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      SETTINGS_MESSAGES.CURRENCY_CONVERTED,
      { conversion: result }
    )
  );
});

// ─── POST /currencies/convert-batch ───────────────────────────────────────────

export const convertBatch = asyncHandler(async (req, res) => {
  const { amounts, to } = req.body;

  const results = await currencyService.convertMultiple(amounts, to);

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(
      HTTP_STATUS.OK,
      SETTINGS_MESSAGES.CURRENCY_CONVERTED,
      { conversions: results }
    )
  );
});
