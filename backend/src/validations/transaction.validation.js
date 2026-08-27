import { body, param, query, validationResult } from "express-validator";
import ApiError from "../utils/ApiError.js";
import { HTTP_STATUS } from "../constants/index.js";
import Category from "../models/category.model.js";
import { categoryService } from "../services/category.service.js";

export const ALLOWED_TRANSACTION_TYPES = [
  "income",
  "expense",
  "asset",
  "liability",
];

export const ALLOWED_PAYMENT_METHODS = [
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
 * Normalizes input type string to standard lowercase.
 */
export const normalizeTransactionType = (type) => {
  if (!type) return "";
  const lower = type.toLowerCase();
  if (lower === "debit") return "expense";
  if (lower === "credit") return "income";
  return lower;
};

/**
 * Validates that a category exists and its type matches the transaction type.
 */
export const verifyCategoryAndType = async (categoryName, transactionType, userId) => {
  if (!categoryName || !transactionType) return;
  const normType = normalizeTransactionType(transactionType);

  // 1. Check user custom categories first
  if (userId) {
    const customCategory = await Category.findOne({
      userId,
      name: { $regex: `^${categoryName.trim()}$`, $options: "i" },
    }).lean();

    if (customCategory) {
      if (customCategory.type.toLowerCase() !== normType) {
        throw new Error(
          `Category "${categoryName}" belongs to type "${customCategory.type}", but transaction type is "${normType}"`
        );
      }
      return;
    }
  }

  // 2. Check default categories
  const defaultCategories = categoryService.getDefaultCategories();
  const defaultMatch = defaultCategories.find(
    (c) => c.name.toLowerCase() === categoryName.trim().toLowerCase()
  );

  if (defaultMatch) {
    if (defaultMatch.type.toLowerCase() !== normType) {
      throw new Error(
        `Category "${categoryName}" belongs to type "${defaultMatch.type}", but transaction type is "${normType}"`
      );
    }
    return;
  }

  // If category is neither in custom nor default, let's allow Uncategorized for legacy or reject if not found
  if (categoryName.toLowerCase() === "uncategorized") {
    return;
  }

  // If no match found at all
  throw new Error(`Category "${categoryName}" not found for transaction type "${normType}"`);
};

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

/**
 * Validates data for updating a transaction.
 *
 * PUT /api/v1/transactions/:id
 * Body: { merchant?, description?, category?, notes?, amount?, date?, type?, paymentMethod? }
 */
export const validateUpdateTransaction = [
  param("id").isMongoId().withMessage("Invalid transaction ID"),
  body("merchant")
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Merchant must be a non-empty string"),
  body("description").optional().isString().trim().withMessage("Description must be a string"),
  body("notes").optional().isString().trim().withMessage("Notes must be a string"),
  body("amount").optional().isFloat({ min: 0.01 }).withMessage("Amount must be greater than 0"),
  body("date").optional().isISO8601().withMessage("Date must be in ISO 8601 format"),
  body("type")
    .optional()
    .custom((val) => {
      const norm = normalizeTransactionType(val);
      if (!ALLOWED_TRANSACTION_TYPES.includes(norm)) {
        throw new Error(
          `Transaction type must be one of: ${ALLOWED_TRANSACTION_TYPES.join(", ")}`
        );
      }
      return true;
    }),
  body("category").optional().isString().trim().withMessage("Category must be a string"),
  body("paymentMethod")
    .optional({ nullable: true })
    .custom((val, { req }) => {
      if (!val) return true;
      const lower = val.toLowerCase();
      if (!ALLOWED_PAYMENT_METHODS.includes(lower)) {
        throw new Error(
          `Payment method must be one of: ${ALLOWED_PAYMENT_METHODS.join(", ")}`
        );
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
 * Body: { statementId, filePath, transactions: [] }
 */
export const validateImportTransactions = [
  body("statementId")
    .notEmpty()
    .withMessage("Statement ID is required")
    .isMongoId()
    .withMessage("Invalid statement ID"),
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
    .custom((val) => {
      const norm = normalizeTransactionType(val);
      if (!ALLOWED_TRANSACTION_TYPES.includes(norm)) {
        throw new Error(`Type must be one of: ${ALLOWED_TRANSACTION_TYPES.join(", ")}`);
      }
      return true;
    }),
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
 * Body: { date, amount, type, merchant, category, paymentMethod?, description?, notes? }
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
    .custom((val) => {
      const norm = normalizeTransactionType(val);
      if (!ALLOWED_TRANSACTION_TYPES.includes(norm)) {
        throw new Error(
          `Transaction type must be one of: ${ALLOWED_TRANSACTION_TYPES.join(", ")}`
        );
      }
      return true;
    }),
  body("merchant")
    .notEmpty()
    .withMessage("Merchant name is required")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Merchant name must be a non-empty string"),
  body("category")
    .notEmpty()
    .withMessage("Category is required")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Category must be a non-empty string")
    .custom(async (category, { req }) => {
      const transactionType = req.body.type;
      const userId = req.user?._id;
      await verifyCategoryAndType(category, transactionType, userId);
      return true;
    }),
  body("paymentMethod").custom((paymentMethod, { req }) => {
    const normType = normalizeTransactionType(req.body.type);
    if (normType === "expense") {
      if (!paymentMethod || !paymentMethod.trim()) {
        throw new Error("Payment method is required for expense transactions");
      }
      const lower = paymentMethod.trim().toLowerCase();
      if (!ALLOWED_PAYMENT_METHODS.includes(lower)) {
        throw new Error(
          `Payment method must be one of: ${ALLOWED_PAYMENT_METHODS.join(", ")}`
        );
      }
    }
    return true;
  }),
  body("description").optional().isString().trim().withMessage("Description must be a string"),
  body("notes").optional().isString().trim().withMessage("Notes must be a string"),
  handleValidationErrors,
];
