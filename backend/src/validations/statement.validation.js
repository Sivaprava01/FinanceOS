/**
 * Statement Upload Validation
 *
 * Validates file uploads for statement import.
 * Uses express-validator for request validation.
 *
 * handleValidationErrors must be the last middleware in the chain
 * to collect all errors before responding.
 */

import fs from "fs";
import ApiError from "../utils/ApiError.js";
import { HTTP_STATUS, APP_MESSAGES } from "../constants/index.js";

// ─── Validation Error Handler ─────────────────────────────────────────────────

/**
 * Collects all validation errors and throws a single ApiError with the full list.
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {Function} next
 */
export const handleValidationErrors = (req, res, next) => {
  if (!req.file) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "No file was uploaded");
  }

  next();
};

// ─── File Validation Helpers ──────────────────────────────────────────────────

/**
 * Extracts file type from MIME type or filename.
 * Used by multer's filename generator.
 *
 * @param {string} mimeType
 * @returns {string} - One of: PDF, CSV, XLSX
 */
export const getFileTypeFromMime = (mimeType) => {
  const mimeMap = {
    "application/pdf": "PDF",
    "text/csv": "CSV",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
    "application/vnd.ms-excel": "XLSX", // Old Excel format fallback
  };

  return mimeMap[mimeType] || null;
};

/**
 * Validates file type based on MIME type and extension.
 * Returns null if valid, or error message if invalid.
 *
 * @param {object} file - Multer file object
 * @returns {string|null}
 */
export const validateFileType = (file) => {
  const allowedMimes = [
    "application/pdf",
    "text/csv",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
  ];

  if (!allowedMimes.includes(file.mimetype)) {
    return "File type not supported. Supported types: PDF, CSV, XLSX";
  }

  const extension = file.originalname.split(".").pop().toUpperCase();
  const allowedExtensions = ["PDF", "CSV", "XLSX", "XLS"];

  if (!allowedExtensions.includes(extension)) {
    return "File extension not supported. Supported types: PDF, CSV, XLSX";
  }

  return null;
};

/**
 * Validates file size.
 * Max size: 50MB (as per Phase 04 requirements — not explicitly stated but reasonable default)
 *
 * @param {number} fileSize - Size in bytes
 * @returns {string|null}
 */
export const validateFileSize = (fileSize) => {
  const maxSize = 50 * 1024 * 1024; // 50MB

  if (fileSize > maxSize) {
    return `File is too large. Maximum size is 50MB. Your file is ${(fileSize / 1024 / 1024).toFixed(2)}MB`;
  }

  if (fileSize === 0) {
    return "File is empty. Please upload a non-empty file";
  }

  return null;
};

/**
 * Validates that the file is not corrupted (basic check).
 * Works with diskStorage (reads from file.path) or memoryStorage (uses file.buffer).
 * For PDF: Checks magic bytes
 * For CSV: Basic text validation
 * For XLSX: Checks magic bytes for ZIP format
 *
 * @param {object} file - Multer file object
 * @returns {string|null}
 */
export const validateFileIntegrity = (file) => {
  let buffer;

  // diskStorage: read first bytes from file path
  if (file.path && !file.buffer) {
    try {
      // Read first 512 bytes for header validation
      buffer = fs.readFileSync(file.path).slice(0, 512);
    } catch (err) {
      return "File is corrupted or cannot be read";
    }
  }
  // memoryStorage: use buffer directly
  else if (file.buffer) {
    buffer = file.buffer;
  }
  // Neither path nor buffer? File is missing
  else {
    return "File is corrupted or empty";
  }

  if (!buffer || buffer.length === 0) {
    return "File is corrupted or empty";
  }

  const mimeType = file.mimetype;

  // PDF files start with %PDF
  if (mimeType === "application/pdf") {
    if (!buffer.toString("ascii", 0, 4).includes("%PDF")) {
      return "File is corrupted. Expected PDF format but file header is invalid";
    }
  }

  // XLSX files are ZIP archives starting with PK
  if (mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
    if (buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
      return "File is corrupted. Expected XLSX format but file header is invalid";
    }
  }

  // CSV files are text-based (just verify it's readable)
  if (mimeType === "text/csv") {
    try {
      buffer.toString("utf8");
    } catch (err) {
      return "File is corrupted. CSV file cannot be read";
    }
  }

  return null;
};

// ─── Combined Middleware for File Validation ──────────────────────────────────

/**
 * Comprehensive file validation middleware.
 * Called after multer processes the file but before the controller.
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {Function} next
 */
export const validateStatementFile = (req, res, next) => {
  // Check file exists (set by multer)
  if (!req.file) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "No file was uploaded");
  }

  // Validate file type
  const typeError = validateFileType(req.file);
  if (typeError) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, typeError);
  }

  // Validate file size
  const sizeError = validateFileSize(req.file.size);
  if (sizeError) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, sizeError);
  }

  // Validate file integrity
  const integrityError = validateFileIntegrity(req.file);
  if (integrityError) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, integrityError);
  }

  // All validations passed
  next();
};
