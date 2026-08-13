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
import { transactionService } from "../services/transaction.service.js";
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

  const statements = await statementService.getImportHistory(user._id, limit, skip);

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

// ─── Process Statement (Parse and Import) ────────────────────────────────────

/**
 * Processes an uploaded statement: extracts transactions and imports them.
 * Only available for statements with status "Uploaded".
 *
 * Route: POST /api/v1/statements/:id/import
 * Protected: Yes (requires authentication)
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export const processStatement = asyncHandler(async (req, res) => {
  const { user } = req;
  const { id: statementId } = req.params;

  // Verify statement exists and belongs to user
  const statement = await statementService.getStatementById(statementId, user._id);

  if (statement.status !== "Uploaded") {
    throw new Error(
      `Statement cannot be processed. Current status: ${statement.status}. Only "Uploaded" statements can be processed.`
    );
  }

  // Extract transactions from file
  const extractedTransactions = await transactionService.extractTransactions(statementId, user._id);

  if (extractedTransactions.length === 0) {
    throw new Error("No transactions were extracted from the statement");
  }

  // Import transactions to database
  const importResult = await transactionService.importTransactions(
    statementId,
    user._id,
    extractedTransactions,
    statement.filePath
  );

  return res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        `Statement processed successfully. ${importResult.transactionCount} transactions imported.`,
        {
          statement: {
            ...statement,
            status: "Completed",
            transactionCount: importResult.transactionCount,
          },
        }
      )
    );
});
