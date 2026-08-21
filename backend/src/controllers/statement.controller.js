/**
 * Statement Controller
 *
 * Thin layer between routes and statement service.
 * Responsibilities:
 * - Extract file from multer
 * - Extract user ID from req.user (set by auth middleware)
 * - Call statement service methods
 * - Return ApiResponse
 *
 * No business logic here. All file handling is done by multer middleware.
 * All DB operations are done by the service.
 */

import { statementService } from "../services/statement.service.js";
import { ApiResponse, asyncHandler } from "../utils/index.js";
import { HTTP_STATUS } from "../constants/index.js";

// ─── Upload Statement ──────────────────────────────────────────────────────────

/**
 * Handles file upload and creates a statement record.
 * File is already written to disk by multer before this runs.
 * We only create the database record here.
 *
 * Route: POST /api/v1/statements/upload
 * Protected: Yes (requires authentication)
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export const uploadStatement = asyncHandler(async (req, res) => {
  const { user, file } = req;

  if (!file) {
    throw new Error("File not found"); // Should be caught by validation middleware
  }

  const statement = await statementService.uploadStatement(user._id, file);

  return res
    .status(HTTP_STATUS.CREATED)
    .json(
      new ApiResponse(
        HTTP_STATUS.CREATED,
        "File uploaded successfully. Processing will begin shortly.",
        statement
      )
    );
});

// ─── Get Import History ────────────────────────────────────────────────────────

/**
 * Retrieves the user's import history (list of all previous uploads).
 * Only returns statements belonging to the authenticated user.
 *
 * Route: GET /api/v1/statements
 * Protected: Yes (requires authentication)
 *
 * Query params (for pagination):
 * - limit: number (default 10, max 100)
 * - skip: number (default 0)
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export const getImportHistory = asyncHandler(async (req, res) => {
  const { user } = req;
  let { limit, skip } = req.query;

  // Validate and parse pagination params
  limit = Math.min(parseInt(limit || 10), 100);
  skip = parseInt(skip || 0);

  if (limit < 1 || skip < 0) {
    throw new Error("Invalid pagination parameters");
  }

  const statements = await statementService.getImportHistory(user._id, limit, skip, "Completed");

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, "Import history retrieved", {
      statements,
      limit,
      skip,
    })
  );
});

// ─── Get Single Statement ──────────────────────────────────────────────────────

/**
 * Retrieves details of a single import.
 * Only returns statements belonging to the authenticated user.
 *
 * Route: GET /api/v1/statements/:id
 * Protected: Yes (requires authentication)
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export const getStatement = asyncHandler(async (req, res) => {
  const { user } = req;
  const { id } = req.params;

  const statement = await statementService.getStatementById(id, user._id);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, "Statement retrieved", statement));
});

// ─── Submit Password for Encrypted PDF ─────────────────────────────────────────

/**
 * POST /api/v1/statements/:id/retry-with-password
 *
 * Reprocesses a failed statement with a provided password.
 * Only works for statements that failed with password errors.
 *
 * Request:
 * {
 *   "password": "pdf_password"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Statement reprocessing started",
 *   "data": {
 *     "_id": "...",
 *     "status": "Processing"
 *   }
 * }
 */
export const retryStatementWithPassword = asyncHandler(async (req, res) => {
  const { user } = req;
  const { id } = req.params;
  const { password } = req.body;

  if (!password) {
    throw new Error("Password is required");
  }

  // Verify statement exists and belongs to user
  const statement = await statementService.getStatementById(id, user._id);

  if (!statement) {
    throw new Error("Statement not found");
  }

  // Should have failed with password error
  if (statement.status !== "Failed" || !statement.failureReason?.includes("password")) {
    throw new Error("This statement is not waiting for a password");
  }

  // Reset to Processing and trigger async processing with password
  statement.status = "Processing";
  statement.failureReason = null;
  await statement.save();

  // Trigger reprocessing with password (fire-and-forget)
  // Password is NOT persisted - only used in this call
  statementService.processStatementAsync(id, user._id, password).catch((err) => {
    console.error("[Statement] Error reprocessing with password:", err);
  });

  return res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(HTTP_STATUS.OK, "Statement reprocessing started", {
        _id: id,
        status: "Processing",
      })
    );
});
