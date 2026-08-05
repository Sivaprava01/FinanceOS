/**
 * Transaction Service
 *
 * Handles all business logic for transactions.
 *
 * Responsibilities:
 * - Extract transactions from uploaded statements
 * - Create review-ready transaction list
 * - Update transactions with user corrections
 * - Handle merchant learning
 * - Import transactions into database
 * - Manage transaction lifecycle
 * - Clean up temporary files after import
 *
 * Never touches req or res — receives plain values and returns objects.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Transaction from "../models/transaction.model.js";
import MerchantMapping from "../models/merchant-mapping.model.js";
import Statement from "../models/statement.model.js";
import ApiError from "../utils/ApiError.js";
import { HTTP_STATUS } from "../constants/index.js";
import { parserService } from "./parser.service.js";

// Get project root directory for path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, "../..");

// ─── Extract Transactions ──────────────────────────────────────────────────────

/**
 * Extracts transactions from uploaded statement file.
 * 
 * Takes statementId, fetches the statement from DB to get filePath,
 * then reads and parses the file based on its type (PDF, CSV, XLSX).
 * Returns normalized transaction data.
 *
 * @param {string} statementId - The statement's database ID
 * @param {string} userId - The user's ID (for authorization check)
 * @returns {Promise<Array>} Array of extracted transactions (not yet saved)
 * @throws {ApiError} If statement not found, file missing, or parsing fails
 */
const extractTransactions = async (statementId, userId) => {
  // Fetch statement from DB to get file path and type
  const statement = await Statement.findOne({
    _id: statementId,
    user: userId,
    isDeleted: false,
  });

  if (!statement) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Statement not found");
  }

  if (!statement.filePath) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "File path not found in statement");
  }

  // Construct full file path
  // statement.filePath is stored as /uploads/filename
  // Convert to absolute path from project root
  const fullPath = path.join(PROJECT_ROOT, statement.filePath);

  if (!fs.existsSync(fullPath)) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "File not found");
  }

  let transactions = [];

  try {
    if (statement.fileType === "PDF") {
      transactions = await parserService.parsePDF(fullPath);
    } else if (statement.fileType === "CSV") {
      transactions = await parserService.parseCSV(fullPath);
    } else if (statement.fileType === "XLSX") {
      transactions = await parserService.parseExcel(fullPath);
    } else {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, `Unsupported file type: ${statement.fileType}`);
    }
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Failed to extract transactions: " + err.message);
  }

  return transactions;
};

// ─── Get Transactions for Review ───────────────────────────────────────────────

/**
 * Retrieves transactions extracted from a statement for user review.
 * These are temporary transactions not yet saved to the database.
 *
 * The transactions are returned with both original and corrected fields so the user
 * can decide if they need to make any corrections before importing.
 *
 * @param {string} statementId - The statement ID
 * @param {string} userId - User's ID (for authorization)
 * @returns {Promise<object>} Object with transactions and metadata
 * @throws {ApiError} If not found or doesn't belong to user
 */
const getTransactionsForReview = async (statementId, userId) => {
  const statement = await Statement.findOne({
    _id: statementId,
    user: userId,
    isDeleted: false,
  });

  if (!statement) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Statement not found");
  }

  // In a full implementation, we would fetch extracted transactions from a temporary store
  // For MVP: Return the statement with indication that extraction is ready
  return {
    statementId,
    originalFileName: statement.originalFileName,
    fileType: statement.fileType,
    status: "ready_for_review",
    message: "Statement is ready for transaction review. Extract and review transactions.",
  };
};

// ─── Create Transaction ────────────────────────────────────────────────────────

/**
 * Creates a single transaction in the database.
 *
 * Accepts transaction data (from extraction or manual entry) and saves it.
 * The transaction includes both original extracted values and corrected values.
 *
 * @param {string} userId - User's ID
 * @param {object} transactionData - Transaction data
 *   - date: date
 *   - amount: number
 *   - type: "Debit" | "Credit"
 *   - merchant: string
 *   - description: string (optional)
 *   - category: string (optional)
 *   - notes: string (optional)
 *   - originalDate, originalAmount, originalType, originalMerchant, etc.
 *   - statementId: ID of statement (if extracted, null if manual)
 * @returns {Promise<object>} Created transaction
 * @throws {ApiError} If invalid
 */
const createTransaction = async (userId, transactionData) => {
  const transaction = await Transaction.create({
    user: userId,
    ...transactionData,
  });

  return formatTransactionResponse(transaction);
};

// ─── Update Transaction ────────────────────────────────────────────────────────

/**
 * Updates a transaction with user corrections.
 * User can edit: merchant, description, category, notes, amount, date
 *
 * Original values are always preserved.
 * A merchant edit can optionally trigger merchant learning.
 *
 * @param {string} transactionId - Transaction ID
 * @param {string} userId - User's ID (for authorization)
 * @param {object} updateData - Fields to update
 * @returns {Promise<object>} Updated transaction
 * @throws {ApiError} If not found or doesn't belong to user
 */
const updateTransaction = async (transactionId, userId, updateData) => {
  const transaction = await Transaction.findOne({
    _id: transactionId,
    user: userId,
    isDeleted: false,
  });

  if (!transaction) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Transaction not found");
  }

  // Update allowed fields
  const allowedFields = ["date", "amount", "merchant", "description", "category", "notes"];
  const hasChanges = allowedFields.some((field) => updateData[field] !== undefined);

  if (!hasChanges) {
    return formatTransactionResponse(transaction);
  }

  // Track if merchant changed (for learning)
  const merchantChanged =
    updateData.merchant && updateData.merchant !== transaction.merchant;

  // Apply updates
  Object.assign(transaction, updateData);
  transaction.isEdited = true;
  transaction.editedAt = new Date();

  await transaction.save();

  const result = formatTransactionResponse(transaction);

  // If merchant changed and merchant learning is requested, return learning opportunity
  if (merchantChanged) {
    result.merchantLearningOpportunity = {
      original: transaction.originalMerchant,
      corrected: transaction.merchant,
      action: "Would you like FinanceOS to recognize this merchant automatically in future imports?",
    };
  }

  return result;
};

// ─── Learn Merchant Mapping ────────────────────────────────────────────────────

/**
 * Saves a merchant name mapping after user confirms they want to learn it.
 *
 * This mapping will be used to automatically correct merchant names in future imports.
 * Only merchant names are learned, not categories.
 *
 * @param {string} userId - User's ID
 * @param {string} originalMerchant - Original merchant name
 * @param {string} correctedMerchant - Corrected merchant name
 * @returns {Promise<object>} Created or updated mapping
 * @throws {ApiError} If invalid
 */
const learnMerchantMapping = async (userId, originalMerchant, correctedMerchant) => {
  if (!originalMerchant || !correctedMerchant) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Both original and corrected merchant names required");
  }

  const normalizedOriginal = originalMerchant.toLowerCase().trim();

  // Check if mapping already exists
  let mapping = await MerchantMapping.findOne({
    user: userId,
    extractedName: normalizedOriginal,
  });

  if (mapping) {
    // Update existing mapping
    mapping.count += 1;
    mapping.lastUsedAt = new Date();
    await mapping.save();
  } else {
    // Create new mapping
    mapping = await MerchantMapping.create({
      user: userId,
      extractedName: normalizedOriginal,
      correctedName: correctedMerchant,
      count: 1,
      lastUsedAt: new Date(),
      isActive: true,
    });
  }

  return formatMerchantMappingResponse(mapping);
};

// ─── Apply Merchant Mappings ───────────────────────────────────────────────────

/**
 * Applies learned merchant mappings to extracted transactions.
 * When extracting new statements, previously learned mappings are automatically applied.
 *
 * @param {string} userId - User's ID
 * @param {Array} transactions - Extracted transactions
 * @returns {Promise<Array>} Transactions with applied merchant mappings
 */
const applyMerchantMappings = async (userId, transactions) => {
  const mappings = await MerchantMapping.find({
    user: userId,
    isActive: true,
  });

  if (mappings.length === 0) return transactions;

  // Create a lookup map for faster matching
  const mappingMap = {};
  for (const mapping of mappings) {
    mappingMap[mapping.extractedName] = mapping.correctedName;
  }

  // Apply mappings to transactions
  return transactions.map((tx) => {
    const normalizedMerchant = tx.merchant.toLowerCase().trim();
    if (mappingMap[normalizedMerchant]) {
      tx.merchant = mappingMap[normalizedMerchant];
    }
    return tx;
  });
};

// ─── Import Transactions ───────────────────────────────────────────────────────

/**
 * Saves reviewed transactions to database and marks statement as completed.
 * Handles cleanup of temporary files after successful import.
 *
 * @param {string} statementId - Statement ID
 * @param {string} userId - User's ID
 * @param {Array} transactions - Transaction data to save
 * @param {string} filePath - Path to temporary file (for deletion)
 * @returns {Promise<object>} Import result with summary
 * @throws {ApiError} If import fails
 */
const importTransactions = async (statementId, userId, transactions, filePath) => {
  const session = await Transaction.startSession();
  session.startTransaction();

  try {
    // Verify statement exists and belongs to user
    const statement = await Statement.findOne({
      _id: statementId,
      user: userId,
      isDeleted: false,
    });

    if (!statement) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, "Statement not found");
    }

    // Create all transactions
    const createdTransactions = [];
    for (const txData of transactions) {
      const tx = await Transaction.create(
        [
          {
            user: userId,
            statementId,
            ...txData,
          },
        ],
        { session }
      );
      createdTransactions.push(tx[0]);
    }

    // Update statement status
    statement.status = "Completed";
    statement.transactionCount = createdTransactions.length;
    statement.processedAt = new Date();
    await statement.save({ session });

    // Commit transaction
    await session.commitTransaction();

    // Delete temporary file after successful import
    try {
      // Use stored filePath from statement if not provided
      const pathToDelete = filePath || (statement.filePath ? path.join(PROJECT_ROOT, statement.filePath) : null);
      if (pathToDelete && fs.existsSync(pathToDelete)) {
        fs.unlinkSync(pathToDelete);
      }
    } catch (err) {
      // Log but don't fail if file deletion fails
      console.warn("Failed to delete temporary file:", err.message);
    }

    return {
      success: true,
      statementId,
      transactionCount: createdTransactions.length,
      message: `Successfully imported ${createdTransactions.length} transactions`,
    };
  } catch (err) {
    await session.abortTransaction();
    if (err instanceof ApiError) throw err;
    throw new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to import transactions: " + err.message);
  } finally {
    session.endSession();
  }
};

// ─── Get User Transactions ────────────────────────────────────────────────────

/**
 * Retrieves all transactions for a user with optional filtering.
 *
 * @param {string} userId - User's ID
 * @param {object} options - Filtering options
 *   - limit: number (default 50)
 *   - skip: number (default 0)
 *   - fromDate: Date
 *   - toDate: Date
 *   - merchant: string (partial match)
 *   - category: string
 * @returns {Promise<Array>} Array of transactions
 */
const getUserTransactions = async (userId, options = {}) => {
  const { limit = 50, skip = 0, fromDate, toDate, merchant, category } = options;

  const query = {
    user: userId,
    isDeleted: false,
  };

  if (fromDate || toDate) {
    query.date = {};
    if (fromDate) query.date.$gte = new Date(fromDate);
    if (toDate) query.date.$lte = new Date(toDate);
  }

  if (merchant) {
    query.merchant = { $regex: merchant, $options: "i" };
  }

  if (category) {
    query.category = category;
  }

  const transactions = await Transaction.find(query)
    .sort({ date: -1 })
    .limit(limit)
    .skip(skip)
    .lean();

  return transactions.map(formatTransactionResponse);
};

// ─── Helper: Format Response ───────────────────────────────────────────────────

/**
 * Formats a transaction for API response.
 *
 * @param {object} tx - Transaction document
 * @returns {object} Formatted transaction
 */
const formatTransactionResponse = (tx) => {
  return {
    _id: tx._id || tx.id,
    date: tx.date,
    amount: tx.amount,
    type: tx.type,
    merchant: tx.merchant,
    description: tx.description,
    category: tx.category,
    notes: tx.notes,
    isEdited: tx.isEdited,
    editedAt: tx.editedAt,
    // Original values only if edited
    ...(tx.isEdited && {
      originalDate: tx.originalDate,
      originalAmount: tx.originalAmount,
      originalType: tx.originalType,
      originalMerchant: tx.originalMerchant,
      originalDescription: tx.originalDescription,
    }),
    createdAt: tx.createdAt,
    updatedAt: tx.updatedAt,
  };
};

/**
 * Formats a merchant mapping for response.
 *
 * @param {object} mapping - Mapping document
 * @returns {object} Formatted mapping
 */
const formatMerchantMappingResponse = (mapping) => {
  return {
    _id: mapping._id,
    extractedName: mapping.extractedName,
    correctedName: mapping.correctedName,
    count: mapping.count,
    lastUsedAt: mapping.lastUsedAt,
    isActive: mapping.isActive,
  };
};

// (Removed - see bottom of file for updated export)


// ─── Delete Transaction (PHASE 06) ─────────────────────────────────────────

/**
 * Soft deletes a transaction.
 * Sets isDeleted flag to true instead of permanently removing from database.
 * Preserves data for audit trail and allows potential recovery.
 *
 * @param {string} transactionId - The transaction's ID
 * @param {string} userId - The user's ID (for authorization)
 * @returns {Promise<object>} Deleted transaction record
 * @throws {ApiError} If not found or doesn't belong to user
 */
const deleteTransaction = async (transactionId, userId) => {
  const transaction = await Transaction.findOne({
    _id: transactionId,
    user: userId,
    isDeleted: false,
  });

  if (!transaction) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Transaction not found");
  }

  transaction.isDeleted = true;
  await transaction.save();

  return {
    _id: transaction._id,
    message: "Transaction successfully deleted",
    deletedAt: new Date(),
  };
};

// ─── Get Transaction Statistics (PHASE 06) ────────────────────────────────

/**
 * Generates spending statistics for a user.
 * Includes totals by type, by category, and monthly breakdown.
 *
 * @param {string} userId - User's ID
 * @param {object} options - Filter options
 *   - fromDate: start date
 *   - toDate: end date
 * @returns {Promise<object>} Statistics object
 */
const getTransactionStats = async (userId, options = {}) => {
  const { fromDate, toDate } = options;

  const query = {
    user: userId,
    isDeleted: false,
  };

  if (fromDate || toDate) {
    query.date = {};
    if (fromDate) query.date.$gte = new Date(fromDate);
    if (toDate) query.date.$lte = new Date(toDate);
  }

  // Get all transactions matching criteria
  const transactions = await Transaction.find(query).lean();

  // Calculate statistics
  let totalDebit = 0;
  let totalCredit = 0;
  const byCategory = {};
  const byMerchant = {};
  const byType = { Debit: 0, Credit: 0 };

  for (const tx of transactions) {
    if (tx.type === "Debit") {
      totalDebit += tx.amount;
      byType.Debit += tx.amount;
    } else {
      totalCredit += tx.amount;
      byType.Credit += tx.amount;
    }

    // By Category
    const cat = tx.category || "Uncategorized";
    byCategory[cat] = (byCategory[cat] || 0) + tx.amount;

    // By Merchant
    byMerchant[tx.merchant] = (byMerchant[tx.merchant] || 0) + tx.amount;
  }

  return {
    period: {
      from: fromDate || "all-time",
      to: toDate || "all-time",
    },
    summary: {
      totalTransactions: transactions.length,
      totalDebit: parseFloat(totalDebit.toFixed(2)),
      totalCredit: parseFloat(totalCredit.toFixed(2)),
      netFlow: parseFloat((totalCredit - totalDebit).toFixed(2)),
    },
    byType,
    byCategory,
    topMerchants: Object.entries(byMerchant)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([merchant, total]) => ({
        merchant,
        total: parseFloat(total.toFixed(2)),
      })),
  };
};

// ─── Get Categories (PHASE 06) ─────────────────────────────────────────────

/**
 * Gets all unique categories used by a user across their transactions.
 *
 * @param {string} userId - User's ID
 * @returns {Promise<Array>} Array of unique categories
 */
const getCategories = async (userId) => {
  const categories = await Transaction.distinct("category", {
    user: userId,
    isDeleted: false,
  });

  // Remove null/undefined and sort
  return categories
    .filter((cat) => cat && cat.trim().length > 0)
    .sort((a, b) => a.localeCompare(b));
};

// ─── Bulk Update Transactions (PHASE 06) ───────────────────────────────────

/**
 * Updates multiple transactions with the same values in a single operation.
 * Useful for bulk categorization or adding notes to multiple transactions.
 *
 * @param {Array} transactionIds - Array of transaction IDs to update
 * @param {string} userId - User's ID (for authorization)
 * @param {object} updateData - Fields to update
 * @returns {Promise<object>} Update result with count
 * @throws {ApiError} If not found or doesn't belong to user
 */
const bulkUpdateTransactions = async (transactionIds, userId, updateData) => {
  const allowedFields = ["category", "notes", "merchant", "description", "date", "amount"];
  
  // Filter to only allowed fields
  const sanitizedUpdate = {};
  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      sanitizedUpdate[field] = updateData[field];
    }
  }

  if (Object.keys(sanitizedUpdate).length === 0) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "No valid fields provided for update");
  }

  // Mark as edited if not a notes-only update
  if (Object.keys(sanitizedUpdate).some((f) => f !== "notes")) {
    sanitizedUpdate.isEdited = true;
    sanitizedUpdate.editedAt = new Date();
  }

  // Update all transactions belonging to this user
  const result = await Transaction.updateMany(
    {
      _id: { $in: transactionIds },
      user: userId,
      isDeleted: false,
    },
    sanitizedUpdate
  );

  if (result.matchedCount === 0) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "No transactions found to update");
  }

  return {
    success: true,
    matched: result.matchedCount,
    modified: result.modifiedCount,
    message: `Successfully updated ${result.modifiedCount} transaction(s)`,
  };
};

// ─── Export Updated Service ────────────────────────────────────────────────

export const transactionService = {
  extractTransactions,
  getTransactionsForReview,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  learnMerchantMapping,
  applyMerchantMappings,
  importTransactions,
  getUserTransactions,
  getTransactionStats,
  getCategories,
  bulkUpdateTransactions,
};
