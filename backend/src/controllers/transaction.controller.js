/**
 * Transaction Controller
 *
 * Thin layer between routes and transaction service.
 * Responsibilities:
 * - Extract request data
 * - Call service methods
 * - Return ApiResponse
 *
 * No business logic here. All logic is in transactionService.
 */

import { transactionService } from "../services/transaction.service.js";
import { ApiResponse, asyncHandler } from "../utils/index.js";
import { HTTP_STATUS } from "../constants/index.js";

// ─── Extract Transactions from Statement ────────────────────────────────────────

/**
 * Extracts transactions from an uploaded statement and prepares them for review.
 *
 * Route: POST /api/v1/transactions/extract
 * Protected: Yes
 * Body: { statementId }
 *
 * Client provides ONLY statementId. The controller:
 * 1. Fetches statement from DB to get filePath
 * 2. Calls transaction service to extract from that file
 * 3. Applies learned merchant mappings
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export const extractTransactions = asyncHandler(async (req, res) => {
  const { user } = req;
  const { statementId } = req.body;

  if (!statementId) {
    throw new Error("Statement ID is required");
  }

  // Extract transactions from file using statement ID
  const transactions = await transactionService.extractTransactions(statementId, user._id);

  // Apply any learned merchant mappings
  const withMappings = await transactionService.applyMerchantMappings(user._id, transactions);

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, "Transactions extracted successfully", {
      statementId,
      transactionCount: withMappings.length,
      transactions: withMappings,
      nextStep: "Review transactions and make any corrections, then import",
    })
  );
});

// ─── Get Transactions for Review ───────────────────────────────────────────────

/**
 * Retrieves transactions extracted from a statement for user review.
 *
 * Route: GET /api/v1/transactions/review/:statementId
 * Protected: Yes
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export const getTransactionsForReview = asyncHandler(async (req, res) => {
  const { user } = req;
  const { statementId } = req.params;

  const reviewData = await transactionService.getTransactionsForReview(statementId, user._id);

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, "Ready for transaction review", reviewData)
  );
});

// ─── Update Transaction ────────────────────────────────────────────────────────

/**
 * Updates a transaction with user corrections (merchant, description, category, etc.).
 *
 * Route: PUT /api/v1/transactions/:id
 * Protected: Yes
 * Body: { merchant?, description?, category?, notes?, amount?, date? }
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export const updateTransaction = asyncHandler(async (req, res) => {
  const { user } = req;
  const { id } = req.params;
  const updateData = req.body;

  const updated = await transactionService.updateTransaction(id, user._id, updateData);

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, "Transaction updated successfully", updated)
  );
});

// ─── Learn Merchant Mapping ────────────────────────────────────────────────────

/**
 * Saves a merchant name mapping for future automatic corrections.
 *
 * Route: POST /api/v1/transactions/learn-merchant
 * Protected: Yes
 * Body: { originalMerchant, correctedMerchant }
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export const learnMerchantMapping = asyncHandler(async (req, res) => {
  const { user } = req;
  const { originalMerchant, correctedMerchant } = req.body;

  if (!originalMerchant || !correctedMerchant) {
    throw new Error("Both original and corrected merchant names are required");
  }

  const mapping = await transactionService.learnMerchantMapping(
    user._id,
    originalMerchant,
    correctedMerchant
  );

  return res.status(HTTP_STATUS.CREATED).json(
    new ApiResponse(
      HTTP_STATUS.CREATED,
      "Merchant mapping learned successfully",
      mapping
    )
  );
});

// ─── Import Transactions ───────────────────────────────────────────────────────

/**
 * Imports reviewed transactions into the database.
 * After successful import, the uploaded statement file is deleted.
 *
 * Route: POST /api/v1/transactions/import
 * Protected: Yes
 * Body: { statementId, transactions: [ { date, amount, type, merchant, ... } ] }
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export const importTransactions = asyncHandler(async (req, res) => {
  const { user } = req;
  const { statementId, transactions, filePath } = req.body;

  if (!statementId || !transactions || !Array.isArray(transactions)) {
    throw new Error("Statement ID and transactions array are required");
  }

  if (transactions.length === 0) {
    throw new Error("Cannot import empty transaction list");
  }

  const result = await transactionService.importTransactions(
    statementId,
    user._id,
    transactions,
    filePath
  );

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, result.message, result)
  );
});

// ─── Get User Transactions ────────────────────────────────────────────────────

/**
 * Retrieves all transactions for the authenticated user.
 *
 * Route: GET /api/v1/transactions
 * Protected: Yes
 * Query Params: limit, skip, fromDate, toDate, merchant, category
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export const getUserTransactions = asyncHandler(async (req, res) => {
  const { user } = req;
  const { limit = 50, skip = 0, fromDate, toDate, merchant, category } = req.query;

  const transactions = await transactionService.getUserTransactions(user._id, {
    limit: Math.min(parseInt(limit) || 50, 100),
    skip: parseInt(skip) || 0,
    fromDate,
    toDate,
    merchant,
    category,
  });

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, "Transactions retrieved successfully", {
      transactions,
      count: transactions.length,
    })
  );
});

// ─── Get Single Transaction ────────────────────────────────────────────────────

/**
 * Retrieves a single transaction by ID.
 *
 * Route: GET /api/v1/transactions/:id
 * Protected: Yes
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export const getTransaction = asyncHandler(async (req, res) => {
  const { user } = req;
  const { id } = req.params;

  const transaction = await (
    await import("../models/transaction.model.js")
  ).default.findOne({
    _id: id,
    user: user._id,
    isDeleted: false,
  });

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, "Transaction retrieved successfully", transaction)
  );
});
