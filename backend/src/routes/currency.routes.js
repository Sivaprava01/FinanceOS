/**
 * Currency Routes
 *
 * Public endpoints for currency conversion and exchange rates.
 * Most endpoints are public (no authentication required).
 * Exchange rates are always fetched fresh from external API.
 *
 * Endpoints:
 * - GET    /currencies               - List supported currencies
 * - GET    /currencies/rate          - Get exchange rate
 * - POST   /currencies/convert       - Convert single amount
 * - POST   /currencies/convert-batch - Convert multiple amounts
 */

import express from "express";
import * as currencyController from "../controllers/currency.controller.js";
import { validateConvertCurrency, validateConvertBatch } from "../validations/user.validation.js";

const router = express.Router();

// ─── Public Endpoints (no authentication required) ───────────────────────────

// Get list of supported currencies
router.get("/", currencyController.getSupportedCurrencies);

// Get current exchange rate
router.get("/rate", currencyController.getExchangeRate);

// Get all current exchange rates for base currency
router.get("/rates", currencyController.getRates);

// Convert single amount
router.post("/convert", validateConvertCurrency, currencyController.convertCurrency);

// Convert batch (multiple amounts)
router.post("/convert-batch", validateConvertBatch, currencyController.convertBatch);

// ─── Diagnostic endpoint (development only) ─────────────────────────────────
// GET /currencies/rates/debug?base=AUD — bypasses cache, shows raw live API response
router.get("/rates/debug", currencyController.debugRates);

export default router;
