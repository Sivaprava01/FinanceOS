/**
 * Statement Service
 *
 * Handles all business logic for statement uploads and import history.
 * This service never touches req or res — it receives plain values
 * and returns plain objects or throws ApiError.
 *
 * Responsibilities:
 * - Create statement records in MongoDB
 * - Retrieve user's import history
 * - Update statement status during processing
 * - Never handle file storage/deletion (that's the middleware's job)
 */

import fs from "fs";
import crypto from "crypto";
import Statement from "../models/statement.model.js";
import ApiError from "../utils/ApiError.js";
import { HTTP_STATUS } from "../constants/index.js";
import { getFileTypeFromMime } from "../validations/statement.validation.js";
import { normalizeCurrencyCode } from "../utils/currency.js";

// ─── Upload Statement ──────────────────────────────────────────────────────────

/**
 * Creates a new statement record in MongoDB after file upload.
 * The file itself is already on disk; this records metadata.
 * Immediately triggers async processing of the statement.
 *
 * @param {string} userId - The user's ID
 * @param {object} file - Multer file object
 * @returns {Promise<object>} Statement record
 */
const uploadStatement = async (userId, file, options = {}) => {
  const fileType = getFileTypeFromMime(file.mimetype);

  if (!fileType) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Unsupported file type");
  }

  const explicitCurrency = options.currency ? normalizeCurrencyCode(options.currency) : null;
  if (options.currency && !explicitCurrency) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      `Invalid or unsupported currency code: ${options.currency}`
    );
  }

  // Calculate cryptographic hash (SHA-256) of uploaded file content to prevent duplicate imports
  let fileHash = null;
  if (file.path && fs.existsSync(file.path)) {
    const fileBuffer = fs.readFileSync(file.path);
    fileHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
  }

  if (fileHash) {
    // Check if user has already uploaded the exact same statement file
    const existingDuplicate = await Statement.findOne({
      user: userId,
      fileHash,
      isDeleted: false,
      status: { $in: ["Uploaded", "Processing", "Completed"] },
    });

    if (existingDuplicate) {
      // Clean up newly uploaded file to avoid disk clutter
      try {
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (e) {
        // ignore cleanup error
      }
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        "This statement has already been imported."
      );
    }
  }

  // Construct the relative file path from Multer's output
  const relativePath = `/uploads/${file.filename}`;

  let statement;
  try {
    statement = await Statement.create({
      user: userId,
      originalFileName: file.originalname,
      filePath: relativePath,
      fileType,
      fileSize: file.size,
      fileHash,
      currency: explicitCurrency || null,
      status: "Uploaded",
    });
  } catch (err) {
    try {
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } catch (e) {
      // ignore cleanup error
    }
    if (err.code === 11000 || String(err.message).includes("E11000")) {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        "This statement has already been imported."
      );
    }
    throw err;
  }

  // Try extracting preview data synchronously for immediate UI feedback if available
  let previewData = null;
  try {
    const { parserService } = await import("./parser.service.js");
    const fullFilePath = file.path || `.${relativePath}`;
    let extracted = [];
    if (fileType === "PDF") {
      extracted = await parserService.parsePDF(fullFilePath);
    } else if (fileType === "CSV") {
      extracted = await parserService.parseCSV(fullFilePath);
    } else if (fileType === "XLSX") {
      extracted = await parserService.parseExcel(fullFilePath);
    }

    if (extracted && extracted.length > 0) {
      const detectedCurr = explicitCurrency || extracted.detectedCurrency || null;
      if (detectedCurr && !statement.currency) {
        statement.currency = detectedCurr;
        await statement.save();
      }
      previewData = {
        transactions: extracted,
        detectedCurrency: extracted.detectedCurrency || null,
        isAmbiguous: extracted.isAmbiguous || false,
        confidence: extracted.confidence || "none",
        detectedSources: extracted.detectedSources || [],
      };
    }
  } catch (extractErr) {
    // If password required or parsing error, let processStatementAsync handle background lifecycle
    if (extractErr?.message === "PDF_PASSWORD_REQUIRED") {
      statement.status = "Password Required";
      statement.failureReason = "This PDF is password protected. Please provide the password.";
      await statement.save();
    }
  }

  // Trigger async processing if previewData is not extracted or in background
  if (!previewData && statement.status !== "Password Required") {
    processStatementAsync(statement._id.toString(), userId).catch((err) => {
      console.error(`[Statement Processing] Error processing statement ${statement._id}:`, err);
    });
  }

  // Return public view (no sensitive data)
  const formatted = formatStatementResponse(statement);
  if (previewData) {
    formatted.preview = previewData;
  }
  return formatted;
};

/**
 * Asynchronously processes a statement.
 * Updates statement status during processing.
 * Extracts transactions and persists them.
 * Called as a fire-and-forget background task.
 *
 * @param {string} statementId - The statement's ID
 * @param {string} userId - The user's ID
 * @returns {Promise<void>}
 */
const processStatementAsync = async (statementId, userId, password = "") => {
  let statement = null;
  
  try {
    // Update status to Processing
    statement = await Statement.findOne({
      _id: statementId,
      user: userId,
    });

    if (!statement) {
      throw new Error("Statement not found");
    }

    statement.status = "Processing";
    await statement.save();

    console.log(`[Statement Processing] Started processing ${statementId}`);

    // Import parser service
    const { parserService } = await import("./parser.service.js");
    const { transactionService } = await import("./transaction.service.js");

    // Parse file based on type
    let transactions = [];

    try {
      const fullFilePath = statement.filePath.startsWith("/")
        ? `.${statement.filePath}`
        : statement.filePath;

      console.log(`[Statement Processing] Parsing file: ${fullFilePath}, type: ${statement.fileType}`);

      switch (statement.fileType) {
      case "PDF":
        transactions = await parserService.parsePDF(fullFilePath, password);
        break;
      case "CSV":
        transactions = await parserService.parseCSV(fullFilePath);
        break;
      case "XLSX":
        transactions = await parserService.parseExcel(fullFilePath);
        break;
      default:
        throw new Error("Unsupported file type: " + statement.fileType);
      }

      console.log(`[Statement Processing] Parser returned ${transactions.length} transactions for ${statementId}`);

      if (!Array.isArray(transactions) || transactions.length === 0) {
        // No transactions extracted - this is not necessarily an error
        console.warn(`[Statement Processing] No transactions extracted from ${statementId}, marking as completed with 0 transactions`);
        
        // Update statement as Completed with 0 transactions
        statement.status = "Completed";
        statement.transactionCount = 0;
        statement.processedAt = new Date();
        await statement.save();
        
        console.log(`[Statement Processing] Marked ${statementId} as Completed with 0 transactions`);
        return;
      }

      // Use existing importTransactions to persist data with resolved currency
      const resolvedCurrency = statement.currency || transactions.detectedCurrency || null;
      console.log(`[Statement Processing] Calling importTransactions for ${statementId} with ${transactions.length} transactions, currency: ${resolvedCurrency || "none"}`);
      
      try {
        const result = await transactionService.importTransactions(
          statementId,
          userId,
          transactions,
          fullFilePath,
          resolvedCurrency
        );

        console.log(
          `[Statement Processing] Successfully processed ${statementId}: ${result.transactionCount} transactions`
        );
      } catch (importErr) {
        console.error(`[Statement Processing] importTransactions failed for ${statementId}:`, importErr);
        
        // Mark as Failed
        statement.status = "Failed";
        statement.failureReason = `Import failed: ${importErr instanceof Error ? importErr.message : String(importErr)}`;
        statement.processedAt = new Date();
        await statement.save();
        
        throw importErr;
      }
    } catch (parseErr) {
      // Mark as Failed or Password Required with reason
      let failureReason = "Failed to process statement";
      let status = "Failed";

      if (parseErr instanceof Error) {
        if (parseErr.message === "PDF_PASSWORD_REQUIRED") {
          status = "Password Required";
          failureReason = "This PDF is password protected. Please provide the password.";
        } else if (parseErr.message === "PDF_INCORRECT_PASSWORD") {
          status = "Password Required";
          failureReason = "Incorrect PDF password. Please try again.";
        } else {
          failureReason = parseErr.message;
        }
      }

      statement.status = status;
      statement.failureReason = failureReason;
      statement.processedAt = new Date();
      await statement.save();

      console.error(
        `[Statement Processing] Failed to process ${statementId}:`,
        parseErr instanceof Error ? parseErr.message : parseErr
      );
    }
  } catch (err) {
    console.error(`[Statement Processing] Fatal error processing ${statementId}:`, err);
    
    // Attempt to mark as Failed if we have a statement reference
    if (statement) {
      try {
        statement.status = "Failed";
        statement.failureReason = "An unexpected error occurred during processing";
        statement.processedAt = new Date();
        await statement.save();
      } catch (saveErr) {
        console.error(`[Statement Processing] Could not update statement status:`, saveErr);
      }
    }
  }
};

// ─── Get Import History ────────────────────────────────────────────────────────

/**
 * Retrieves the user's import history, newest first.
 * Excludes soft-deleted statements.
 *
 * @param {string} userId - The user's ID
 * @param {number} limit - Number of records to return
 * @param {number} skip - Number of records to skip (for pagination)
 * @returns {Promise<Array>} Array of statement records
 */
const getImportHistory = async (userId, limit = 10, skip = 0, statusFilter = null) => {
  const query = {
    user: userId,
    isDeleted: false,
  };

  if (statusFilter) {
    const s = String(statusFilter).toLowerCase();
    if (s === "active") {
      query.status = { $ne: "Completed" };
    } else if (s === "completed") {
      query.status = "Completed";
    } else if (s !== "all") {
      query.status = statusFilter;
    }
  }

  const statements = await Statement.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();

  return statements.map(formatStatementResponse);
};

/**
 * Retrieves a single statement by ID, ensuring it belongs to the user.
 *
 * @param {string} statementId - The statement's ID
 * @param {string} userId - The user's ID
 * @returns {Promise<object>} Statement record
 * @throws {ApiError} If not found or doesn't belong to user
 */
const getStatementById = async (statementId, userId) => {
  const statement = await Statement.findOne({
    _id: statementId,
    user: userId,
    isDeleted: false,
  });

  if (!statement) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Statement not found");
  }

  return formatStatementResponse(statement);
};

// ─── Update Statement Status ──────────────────────────────────────────────────

/**
 * Updates statement status during processing (Phase 05).
 * Called by the processing worker after OCR and transaction extraction.
 *
 * @param {string} statementId - The statement's ID
 * @param {string} userId - The user's ID (for validation)
 * @param {object} updateData - Data to update
 *   - status: "Processing" | "Completed" | "Failed"
 *   - transactionCount: number (if Completed)
 *   - failureReason: string (if Failed)
 * @returns {Promise<object>} Updated statement record
 * @throws {ApiError} If not found or doesn't belong to user
 */
const updateStatementStatus = async (statementId, userId, updateData) => {
  const statement = await Statement.findOne({
    _id: statementId,
    user: userId,
  });

  if (!statement) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Statement not found");
  }

  // Update fields
  if (updateData.status) {
    statement.status = updateData.status;
  }

  if (updateData.status === "Completed" && updateData.transactionCount !== undefined) {
    statement.transactionCount = updateData.transactionCount;
    statement.processedAt = new Date();
  }

  if (updateData.status === "Failed" && updateData.failureReason) {
    statement.failureReason = updateData.failureReason;
    statement.processedAt = new Date();
  }

  await statement.save();

  return formatStatementResponse(statement);
};

// ─── Get Statement for Processing ──────────────────────────────────────────────

/**
 * Retrieves a statement record for processing queue.
 * Used by Phase 05 worker to get files that need OCR/extraction.
 * Does NOT handle file deletion — that's the worker's responsibility.
 *
 * @param {string} statementId - The statement's ID
 * @param {string} userId - The user's ID (for validation)
 * @returns {Promise<object>} Statement record with file metadata
 * @throws {ApiError} If not found or doesn't belong to user
 */
const getStatementForProcessing = async (statementId, userId) => {
  const statement = await Statement.findOne({
    _id: statementId,
    user: userId,
    status: "Uploaded",
  });

  if (!statement) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Statement not found or already processing");
  }

  return statement.toObject();
};

// ─── Delete Statement ──────────────────────────────────────────────────────────

/**
 * Soft deletes a statement record and all associated imported transactions.
 * Unlinks the file from disk if present.
 *
 * @param {string} statementId - The statement's ID
 * @param {string} userId - The user's ID
 * @returns {Promise<object>} Summary of deleted statement and transactions
 */
const deleteStatement = async (statementId, userId) => {
  const statement = await Statement.findOne({
    _id: statementId,
    user: userId,
    isDeleted: false,
  });

  if (!statement) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Statement not found");
  }

  // Soft delete statement
  statement.isDeleted = true;
  await statement.save();

  // Soft delete all imported transactions linked to this statement
  const Transaction = (await import("../models/transaction.model.js")).default;
  const txResult = await Transaction.updateMany(
    { statementId, user: userId },
    { isDeleted: true }
  );

  // Clean up disk file if present
  try {
    const fullFilePath = statement.filePath?.startsWith("/")
      ? `.${statement.filePath}`
      : statement.filePath;
    if (fullFilePath && fs.existsSync(fullFilePath)) {
      fs.unlinkSync(fullFilePath);
    }
  } catch (err) {
    // ignore disk cleanup error
  }

  return {
    _id: statement._id,
    deletedTransactionsCount: txResult.modifiedCount || 0,
    message: `Statement and ${txResult.modifiedCount || 0} imported transactions deleted`,
  };
};

// ─── Clear Failed Imports ──────────────────────────────────────────────────────

/**
 * Soft deletes all failed and password-required statement records for a user.
 * Soft deletes any orphaned transactions linked to them and cleans up files.
 *
 * @param {string} userId - The user's ID
 * @returns {Promise<object>} Summary of cleared records
 */
const clearFailedImports = async (userId) => {
  const failedStatements = await Statement.find({
    user: userId,
    status: { $in: ["Failed", "Password Required"] },
    isDeleted: false,
  });

  if (failedStatements.length === 0) {
    return { count: 0, message: "No failed imports to clear" };
  }

  const ids = failedStatements.map((s) => s._id);

  // Soft delete failed statements
  await Statement.updateMany(
    { _id: { $in: ids }, user: userId },
    { isDeleted: true }
  );

  // Soft delete any transactions linked to these statements
  const Transaction = (await import("../models/transaction.model.js")).default;
  await Transaction.updateMany(
    { statementId: { $in: ids }, user: userId },
    { isDeleted: true }
  );

  // Unlink disk files
  for (const s of failedStatements) {
    try {
      const fullFilePath = s.filePath?.startsWith("/") ? `.${s.filePath}` : s.filePath;
      if (fullFilePath && fs.existsSync(fullFilePath)) {
        fs.unlinkSync(fullFilePath);
      }
    } catch (e) {
      // ignore unlink error
    }
  }

  return {
    count: failedStatements.length,
    message: `Successfully cleared ${failedStatements.length} failed import records`,
  };
};

// ─── Retry Statement Processing ────────────────────────────────────────────────

/**
 * Retries background processing for a failed or stuck statement.
 *
 * @param {string} statementId - The statement's ID
 * @param {string} userId - The user's ID
 * @returns {Promise<object>} Formatted statement record
 */
const retryStatement = async (statementId, userId) => {
  const statement = await Statement.findOne({
    _id: statementId,
    user: userId,
    isDeleted: false,
  });

  if (!statement) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Statement not found");
  }

  statement.status = "Processing";
  statement.failureReason = null;
  await statement.save();

  processStatementAsync(statementId, userId).catch((err) => {
    console.error(`[Statement Retry] Error processing statement ${statementId}:`, err);
  });

  return formatStatementResponse(statement);
};

// ─── Helper: Format Response ───────────────────────────────────────────────────

/**
 * Formats a statement document for API response.
 * Ensures consistent public view of statement data.
 *
 * @param {object} statement - Mongoose statement document or plain object
 * @returns {object}
 */
const formatStatementResponse = (statement) => {
  return {
    _id: statement._id || statement.id,
    originalFileName: statement.originalFileName,
    filePath: statement.filePath,
    fileType: statement.fileType,
    fileSize: statement.fileSize,
    currency: statement.currency || null,
    status: statement.status,
    failureReason: statement.failureReason || null,
    transactionCount: statement.transactionCount,
    uploadedAt: statement.uploadedAt,
    processedAt: statement.processedAt || null,
    createdAt: statement.createdAt,
    updatedAt: statement.updatedAt,
  };
};

// ─── Export Service ────────────────────────────────────────────────────────────

export const statementService = {
  uploadStatement,
  getImportHistory,
  getStatementById,
  updateStatementStatus,
  getStatementForProcessing,
  processStatementAsync,
  deleteStatement,
  clearFailedImports,
  retryStatement,
};
