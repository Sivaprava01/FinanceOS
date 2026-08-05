/**
 * Transaction Routes
 *
 * POST   /api/v1/transactions/extract           - Extract from statement
 * GET    /api/v1/transactions/review/:id        - Get transactions for review
 * POST   /api/v1/transactions/learn-merchant    - Learn merchant mapping
 * POST   /api/v1/transactions/import            - Import reviewed transactions
 * GET    /api/v1/transactions                   - Get all transactions
 * GET    /api/v1/transactions/:id               - Get single transaction
 * PUT    /api/v1/transactions/:id               - Update transaction
 */

import express from "express";
import protect from "../middlewares/auth.middleware.js";
import {
  extractTransactions,
  getTransactionsForReview,
  learnMerchantMapping,
  importTransactions,
  getUserTransactions,
  getTransaction,
  updateTransaction,
} from "../controllers/transaction.controller.js";

const router = express.Router();

// ─── All routes require authentication ─────────────────────────────────────────

router.use(protect);

// ─── Extract Transactions from Statement ───────────────────────────────────────

/**
 * POST /api/v1/transactions/extract
 *
 * Extracts transactions from an uploaded statement file.
 * Returns transactions ready for review with any learned merchant mappings applied.
 *
 * Request:
 * {
 *   "statementId": "...",
 *   "filePath": "path/to/file",
 *   "fileType": "PDF" | "CSV" | "XLSX"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "statementId": "...",
 *     "transactionCount": 15,
 *     "transactions": [ ... ],
 *     "nextStep": "Review transactions and make any corrections, then import"
 *   }
 * }
 */
router.post("/extract", extractTransactions);

// ─── Get Transactions for Review ───────────────────────────────────────────────

/**
 * GET /api/v1/transactions/review/:statementId
 *
 * Retrieves transactions extracted from a specific statement for user review.
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "statementId": "...",
 *     "status": "ready_for_review",
 *     "originalFileName": "statement.pdf",
 *     "fileType": "PDF"
 *   }
 * }
 */
router.get("/review/:statementId", getTransactionsForReview);

// ─── Learn Merchant Mapping ────────────────────────────────────────────────────

/**
 * POST /api/v1/transactions/learn-merchant
 *
 * Saves a merchant name mapping for automatic correction in future imports.
 * Only merchant names are learned, not categories.
 *
 * Request:
 * {
 *   "originalMerchant": "AMAZON *MKTPLC",
 *   "correctedMerchant": "Amazon"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "_id": "...",
 *     "extractedName": "amazon *mktplc",
 *     "correctedName": "Amazon",
 *     "count": 1,
 *     "isActive": true
 *   }
 * }
 */
router.post("/learn-merchant", learnMerchantMapping);

// ─── Import Transactions ───────────────────────────────────────────────────────

/**
 * POST /api/v1/transactions/import
 *
 * Imports reviewed transactions into the database.
 * Marks statement as completed.
 * Automatically deletes the uploaded statement file.
 *
 * Request:
 * {
 *   "statementId": "...",
 *   "filePath": "path/to/file",
 *   "transactions": [
 *     {
 *       "date": "2026-08-01T00:00:00Z",
 *       "amount": 100,
 *       "type": "Debit",
 *       "merchant": "Amazon",
 *       "description": "Online purchase",
 *       "category": "Shopping",
 *       "originalDate": "...",
 *       "originalAmount": "...",
 *       ...
 *     }
 *   ]
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "statementId": "...",
 *     "transactionCount": 15,
 *     "message": "Successfully imported 15 transactions"
 *   }
 * }
 */
router.post("/import", importTransactions);

// ─── Get All Transactions ─────────────────────────────────────────────────────

/**
 * GET /api/v1/transactions
 *
 * Retrieves all transactions for the authenticated user.
 *
 * Query Params (optional):
 * - limit: number (default 50, max 100)
 * - skip: number (default 0, for pagination)
 * - fromDate: ISO date string
 * - toDate: ISO date string
 * - merchant: partial match string
 * - category: exact match string
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "transactions": [ ... ],
 *     "count": 15
 *   }
 * }
 */
router.get("/", getUserTransactions);

// ─── Get Single Transaction ────────────────────────────────────────────────────

/**
 * GET /api/v1/transactions/:id
 *
 * Retrieves a single transaction by ID.
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "_id": "...",
 *     "date": "2026-08-01T00:00:00Z",
 *     "amount": 100,
 *     "type": "Debit",
 *     "merchant": "Amazon",
 *     "description": "Online purchase",
 *     "category": "Shopping",
 *     "notes": "User notes",
 *     "isEdited": true,
 *     "editedAt": "2026-08-03T10:00:00Z",
 *     "originalMerchant": "AMAZON *MKTPLC",
 *     ...
 *   }
 * }
 */
router.get("/:id", getTransaction);

// ─── Update Transaction ────────────────────────────────────────────────────────

/**
 * PUT /api/v1/transactions/:id
 *
 * Updates a transaction with user corrections.
 * User can edit: merchant, description, category, notes, amount, date
 *
 * Request (all fields optional):
 * {
 *   "merchant": "corrected merchant name",
 *   "description": "corrected description",
 *   "category": "Shopping",
 *   "notes": "user notes",
 *   "amount": 100.50,
 *   "date": "2026-08-02T00:00:00Z"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "_id": "...",
 *     "merchant": "corrected merchant name",
 *     "isEdited": true,
 *     "merchantLearningOpportunity": {
 *       "original": "AMAZON *MKTPLC",
 *       "corrected": "Amazon",
 *       "action": "Would you like FinanceOS to recognize this merchant automatically in future imports?"
 *     },
 *     ...
 *   }
 * }
 */
router.put("/:id", updateTransaction);

export default router;
