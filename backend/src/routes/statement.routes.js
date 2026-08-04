/**
 * Statement Routes
 *
 * POST   /api/v1/statements/upload      - Upload a bank statement (protected)
 * GET    /api/v1/statements             - Get import history (protected)
 * GET    /api/v1/statements/:id         - Get single statement details (protected)
 */

import express from "express";
import protect from "../middlewares/auth.middleware.js";
import { uploadSingle } from "../middlewares/upload.middleware.js";
import { validateStatementFile } from "../validations/statement.validation.js";
import {
  uploadStatement,
  getImportHistory,
  getStatement,
} from "../controllers/statement.controller.js";

const router = express.Router();

// ─── All routes require authentication ─────────────────────────────────────────

router.use(protect);

// ─── Upload Statement ─────────────────────────────────────────────────────────

/**
 * POST /api/v1/statements/upload
 *
 * Upload a bank statement.
 * Multipart form-data with file field named "statement".
 *
 * Request:
 * - Form field: "statement" (the file)
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "File uploaded successfully...",
 *   "data": {
 *     "_id": "...",
 *     "originalFileName": "statement.pdf",
 *     "fileType": "PDF",
 *     "fileSize": 123456,
 *     "status": "Uploaded",
 *     "transactionCount": 0,
 *     "uploadedAt": "2026-08-01T10:00:00Z",
 *     ...
 *   }
 * }
 */
router.post(
  "/upload",
  uploadSingle,
  validateStatementFile,
  uploadStatement
);

// ─── Get Import History ───────────────────────────────────────────────────────

/**
 * GET /api/v1/statements?limit=10&skip=0
 *
 * Retrieve user's import history.
 * Returns newest uploads first.
 *
 * Query params:
 * - limit: number (default 10, max 100)
 * - skip: number (default 0, for pagination)
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Import history retrieved",
 *   "data": {
 *     "statements": [
 *       {
 *         "_id": "...",
 *         "originalFileName": "statement.pdf",
 *         "fileType": "PDF",
 *         "fileSize": 123456,
 *         "status": "Completed",
 *         "transactionCount": 42,
 *         "uploadedAt": "2026-08-01T10:00:00Z",
 *         ...
 *       }
 *     ],
 *     "limit": 10,
 *     "skip": 0
 *   }
 * }
 */
router.get("/", getImportHistory);

// ─── Get Single Statement ─────────────────────────────────────────────────────

/**
 * GET /api/v1/statements/:id
 *
 * Retrieve details of a single statement import.
 * Can only access own statements.
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Statement retrieved",
 *   "data": {
 *     "_id": "...",
 *     "originalFileName": "statement.pdf",
 *     "fileType": "PDF",
 *     "fileSize": 123456,
 *     "status": "Processing",
 *     "failureReason": null,
 *     "transactionCount": 0,
 *     "uploadedAt": "2026-08-01T10:00:00Z",
 *     "processedAt": null,
 *     ...
 *   }
 * }
 */
router.get("/:id", getStatement);

export default router;
