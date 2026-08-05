/**
 * Loan Routes
 *
 * All routes require authentication via the protect middleware.
 *
 * POST   /api/v1/loans             - Create a loan
 * GET    /api/v1/loans             - List all loans (optional ?status=Active|Closed)
 * GET    /api/v1/loans/summary     - Aggregated loan summary
 * GET    /api/v1/loans/:id         - Get a single loan
 * PUT    /api/v1/loans/:id         - Update a loan
 * DELETE /api/v1/loans/:id         - Delete a loan
 *
 * Route order: /summary must be declared before /:id so Express does not
 * treat the string "summary" as a dynamic :id parameter.
 */

import express from "express";
import protect from "../middlewares/auth.middleware.js";
import { validateCreateLoan, validateUpdateLoan } from "../validations/loan.validation.js";
import {
  createLoan,
  getLoans,
  getLoanSummary,
  getLoanById,
  updateLoan,
  deleteLoan,
} from "../controllers/loan.controller.js";

const router = express.Router();

// All loan routes require a valid access token
router.use(protect);

router.post("/",            validateCreateLoan, createLoan);
router.get("/",             getLoans);
router.get("/summary",      getLoanSummary);
router.get("/:id",          getLoanById);
router.put("/:id",          validateUpdateLoan, updateLoan);
router.delete("/:id",       deleteLoan);

export default router;
