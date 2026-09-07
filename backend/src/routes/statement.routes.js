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
  retryStatementWithPassword,
  deleteStatement,
  clearFailedImports,
  retryStatement,
} from "../controllers/statement.controller.js";

const router = express.Router();

// ─── All routes require authentication ─────────────────────────────────────────

router.use(protect);

// ─── Upload Statement ─────────────────────────────────────────────────────────

router.post("/upload", uploadSingle, validateStatementFile, uploadStatement);

// ─── Get Import History ───────────────────────────────────────────────────────

router.get("/", getImportHistory);

// ─── Clear Failed Imports (must be before /:id) ───────────────────────────────

router.delete("/failed", clearFailedImports);

// ─── Retry Statement Processing ───────────────────────────────────────────────

router.post("/:id/retry", retryStatement);

// ─── Retry with Password ──────────────────────────────────────────────────────

router.post("/:id/retry-with-password", retryStatementWithPassword);

// ─── Get Single Statement ─────────────────────────────────────────────────────

router.get("/:id", getStatement);

// ─── Delete Statement ─────────────────────────────────────────────────────────

router.delete("/:id", deleteStatement);

export default router;
