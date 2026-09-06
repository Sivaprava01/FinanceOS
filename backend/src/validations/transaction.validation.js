/**
 * Transaction Validation
 *
 * Validates transaction data for extraction, updating, and importing.
 * Uses express-validator patterns.
 */

import { body, param, query, validationResult } from "express-validator";
import ApiError from "../utils/ApiError.js";
import { HTTP_STATUS } from "../constants/index.js";
import { isValidCurrency } from "../utils/currency.js";

// ─── Validation Error Handler ─────────────────────────────────────────────────

/**
 * Collects validation errors and returns them in consistent format.
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {Function} next
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      "Validation error: " +
        errors
          .array()
          .map((e) => e.msg)
          .join(", ")
    );
  }
  next();
};

// ─── Validation Chains ────────────────────────────────────────────────────────

/**
 * Validates data for transaction extraction.
 *
 * POST /api/v1/transactions/extract
 * Body: { statementId, filePath, fileType }
 */
export const validateExtractTransactions = [
  body("statementId")
    .notEmpty()
    .withMessage("Statement ID is required")
    .isMongoId()
    .withMessage("Invalid statement ID"),
  body("filePath")
    .notEmpty()
    .withMessage("File path is required")
    .isString()
    .withMessage("File path must be a string"),
  body("fileType")
    .notEmpty()
    .withMessage("File type is required")
    .isIn(["PDF", "CSV", "XLSX"])
    .withMessage("File type must be PDF, CSV, or XLSX"),
  handleValidationErrors,
];

export const VALID_TRANSACTION_TYPES = [
  "income",
  "expense",
  "asset",
  "liability",
  "Debit",
  "Credit",
  "Income",
  "Expense",
  "Asset",
  "Liability",
];

export const VALID_PAYMENT_METHODS = [
  "cash",
  "upi",
  "debit_card",
  "credit_card",
  "bank_transfer",
  "net_banking",
  "cheque",
  "wallet",
  "other",
];

/**
 * Validates data for updating a transaction.
 *
 * PUT /api/v1/transactions/:id
 * Body: { merchant?, description?, category?, notes?, amount?, date?, type?, paymentMethod? }
 */
export const validateUpdateTransaction = [
  param("id").isMongoId().withMessage("Invalid transaction ID"),
  body("merchant")
    .optional({ checkFalsy: true })
    .isString()
    .trim()
    .withMessage("Merchant must be a string"),
  body("description").optional().isString().trim().withMessage("Description must be a string"),
  body("category").optional().isString().trim().withMessage("Category must be a string"),
  body("notes").optional().isString().trim().withMessage("Notes must be a string"),
  body("amount").optional().isFloat({ min: 0.01 }).withMessage("Amount must be greater than 0"),
  body("date").optional().isISO8601().withMessage("Date must be in ISO 8601 format"),
  body("type")
    .optional()
    .isIn(VALID_TRANSACTION_TYPES)
    .withMessage("Type must be income, expense, asset, or liability"),
  body("paymentMethod")
    .optional({ nullable: true })
    .custom((val, { req }) => {
      const type = req.body.type ? String(req.body.type).toLowerCase().trim() : undefined;
      const normalizedType = type === "debit" ? "expense" : type === "credit" ? "income" : type;
      if (normalizedType === "expense") {
        const normalizedVal = val ? String(val).toLowerCase().trim() : "";
        if (!normalizedVal || !VALID_PAYMENT_METHODS.includes(normalizedVal)) {
          throw new Error(
            `Payment method is required for expense transactions. Valid options: ${VALID_PAYMENT_METHODS.join(", ")}`
          );
        }
      } else if (val) {
        const normalizedVal = String(val).toLowerCase().trim();
        if (normalizedVal && !VALID_PAYMENT_METHODS.includes(normalizedVal)) {
          throw new Error(
            `Invalid payment method. Valid options: ${VALID_PAYMENT_METHODS.join(", ")}`
          );
        }
      }
      return true;
    }),
  handleValidationErrors,
];

/**
 * Validates merchant learning data.
 *
 * POST /api/v1/transactions/learn-merchant
 * Body: { originalMerchant, correctedMerchant }
 */
export const validateLearnMerchant = [
  body("originalMerchant")
    .notEmpty()
    .withMessage("Original merchant name is required")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Original merchant name must be a non-empty string"),
  body("correctedMerchant")
    .notEmpty()
    .withMessage("Corrected merchant name is required")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Corrected merchant name must be a non-empty string"),
  handleValidationErrors,
];

/**
 * Validates transaction import data.
 *
 * POST /api/v1/transactions/import
 * Body: { statementId, currency, filePath, transactions: [] }
 */
export const validateImportTransactions = [
  body("statementId")
    .notEmpty()
    .withMessage("Statement ID is required")
    .isMongoId()
    .withMessage("Invalid statement ID"),
  body("currency")
    .notEmpty()
    .withMessage("Currency is required for statement import")
    .isString()
    .trim()
    .custom((val) => {
      if (!isValidCurrency(val)) {
        throw new Error(`Invalid currency code: ${val}. Must be a valid supported ISO currency code.`);
      }
      return true;
    }),
  body("filePath").optional().isString().withMessage("File path must be a string"),
  body("transactions").isArray({ min: 1 }).withMessage("Transactions must be a non-empty array"),
  body("transactions.*.date")
    .notEmpty()
    .withMessage("Transaction date is required")
    .isISO8601()
    .withMessage("Transaction date must be in ISO 8601 format"),
  body("transactions.*.amount")
    .notEmpty()
    .withMessage("Amount is required")
    .isFloat({ min: 0.01 })
    .withMessage("Amount must be greater than 0"),
  body("transactions.*.type")
    .notEmpty()
    .withMessage("Transaction type is required")
    .isIn(VALID_TRANSACTION_TYPES)
    .withMessage("Type must be income, expense, asset, or liability"),
  body("transactions.*.merchant")
    .notEmpty()
    .withMessage("Merchant name is required")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Merchant name must be a non-empty string"),
  handleValidationErrors,
];

/**
 * Validates query parameters for getting transactions.
 *
 * GET /api/v1/transactions
 * Query: { limit?, skip?, fromDate?, toDate?, merchant?, category?, type? }
 */
export const validateGetTransactions = [
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("skip").optional().isInt({ min: 0 }).withMessage("Skip must be 0 or greater"),
  query("fromDate").optional().isISO8601().withMessage("From date must be in ISO 8601 format"),
  query("toDate").optional().isISO8601().withMessage("To date must be in ISO 8601 format"),
  query("merchant").optional().isString().trim().withMessage("Merchant must be a string"),
  query("category").optional().isString().trim().withMessage("Category must be a string"),
  query("type").optional().isString().trim().withMessage("Type must be a string"),
  handleValidationErrors,
];

/**
 * Validates transaction ID parameter.
 *
 * GET /api/v1/transactions/:id
 * PUT /api/v1/transactions/:id
 * Params: { id }
 */
export const validateTransactionId = [
  param("id").isMongoId().withMessage("Invalid transaction ID"),
  handleValidationErrors,
];

/**
 * Validates data for manually creating a transaction.
 *
 * POST /api/v1/transactions
 * Body: { date, amount, type, merchant, category, paymentMethod?, description?, notes?, currency? }
 */
export const validateCreateTransaction = [
  body("date")
    .notEmpty()
    .withMessage("Date is required")
    .isISO8601()
    .withMessage("Date must be in ISO 8601 format"),
  body("amount")
    .notEmpty()
    .withMessage("Amount is required")
    .isFloat({ min: 0.01 })
    .withMessage("Amount must be greater than 0"),
  body("type")
    .notEmpty()
    .withMessage("Transaction type is required")
    .isIn(VALID_TRANSACTION_TYPES)
    .withMessage("Type must be income, expense, asset, or liability"),
  body("merchant")
    .optional({ checkFalsy: true })
    .isString()
    .trim()
    .withMessage("Merchant must be a string"),
  body("category")
    .notEmpty()
    .withMessage("Category is required")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Category must be a non-empty string"),
  body("paymentMethod")
    .optional({ nullable: true })
    .custom((val, { req }) => {
      const rawType = req.body.type ? String(req.body.type).toLowerCase().trim() : "";
      const normalizedType =
        rawType === "debit" ? "expense" : rawType === "credit" ? "income" : rawType;

      if (normalizedType === "expense") {
        const normalizedVal = val ? String(val).toLowerCase().trim() : "";
        if (!normalizedVal || !VALID_PAYMENT_METHODS.includes(normalizedVal)) {
          throw new Error(
            `Payment method is required for expense transactions. Valid options: ${VALID_PAYMENT_METHODS.join(", ")}`
          );
        }
      } else if (val) {
        const normalizedVal = String(val).toLowerCase().trim();
        if (normalizedVal && !VALID_PAYMENT_METHODS.includes(normalizedVal)) {
          throw new Error(
            `Invalid payment method. Valid options: ${VALID_PAYMENT_METHODS.join(", ")}`
          );
        }
      }
      return true;
    }),
  body("description").optional().isString().trim().withMessage("Description must be a string"),
  body("notes").optional().isString().trim().withMessage("Notes must be a string"),
  body("currency")
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .trim()
    .custom((val) => {
      if (val && !isValidCurrency(val)) {
        throw new Error(`Invalid currency code: ${val}`);
      }
      return true;
    }),
  handleValidationErrors,
];
