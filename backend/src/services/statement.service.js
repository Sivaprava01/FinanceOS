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

import Statement from "../models/statement.model.js";
import ApiError from "../utils/ApiError.js";
import { HTTP_STATUS } from "../constants/index.js";
import { getFileTypeFromMime } from "../validations/statement.validation.js";

// ─── Upload Statement ──────────────────────────────────────────────────────────

/**
 * Creates a new statement record in MongoDB after file upload.
 * The file itself is already on disk; this records metadata.
 *
 * @param {string} userId - The user's ID
 * @param {object} file - Multer file object
 * @returns {Promise<object>} Statement record
 */
const uploadStatement = async (userId, file) => {
  const fileType = getFileTypeFromMime(file.mimetype);

  if (!fileType) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Unsupported file type");
  }

  // Construct the relative file path from Multer's output
  // Multer stores files with absolute path in file.path, we need relative
  // file.filename is the name Multer created (e.g., "6a70c36467f97cca9679e475-1722678600000-123456.pdf")
  // We store it relative to project root as /uploads/filename
  const relativePath = `/uploads/${file.filename}`;

  const statement = await Statement.create({
    user: userId,
    originalFileName: file.originalname,
    filePath: relativePath,
    fileType,
    fileSize: file.size,
    status: "Uploaded",
  });

  // Return public view (no sensitive data)
  return formatStatementResponse(statement);
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
const getImportHistory = async (userId, limit = 10, skip = 0) => {
  const statements = await Statement.find({
    user: userId,
    isDeleted: false,
  })
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
};
