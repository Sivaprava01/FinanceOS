/**
 * Loan Controller
 *
 * Thin layer between loan routes and the loan service.
 * Responsibilities:
 * - Extract validated input from req
 * - Call the appropriate service method
 * - Return a consistent ApiResponse
 *
 * No business logic lives here.
 */

import { loanService } from "../services/loan.service.js";
import { ApiResponse, asyncHandler } from "../utils/index.js";
import { HTTP_STATUS, LOAN_MESSAGES } from "../constants/index.js";

// ─── POST /loans ──────────────────────────────────────────────────────────────

export const createLoan = asyncHandler(async (req, res) => {
  const loan = await loanService.createLoan(req.user._id, req.body);

  return res
    .status(HTTP_STATUS.CREATED)
    .json(new ApiResponse(HTTP_STATUS.CREATED, LOAN_MESSAGES.CREATED, { loan }));
});

// ─── GET /loans/summary ───────────────────────────────────────────────────────

// Defined before GET /loans/:id so Express doesn't match "summary" as an :id
export const getLoanSummary = asyncHandler(async (req, res) => {
  const summary = await loanService.getLoanSummary(req.user._id);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, LOAN_MESSAGES.SUMMARY_FETCHED, { summary }));
});

// ─── GET /loans ───────────────────────────────────────────────────────────────

export const getLoans = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const loans = await loanService.getLoans(req.user._id, { status });

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, LOAN_MESSAGES.LIST_FETCHED, { loans }));
});

// ─── GET /loans/:id ───────────────────────────────────────────────────────────

export const getLoanById = asyncHandler(async (req, res) => {
  const loan = await loanService.getLoanById(req.params.id, req.user._id);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, LOAN_MESSAGES.FETCHED, { loan }));
});

// ─── PUT /loans/:id ───────────────────────────────────────────────────────────

export const updateLoan = asyncHandler(async (req, res) => {
  const loan = await loanService.updateLoan(req.params.id, req.user._id, req.body);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, LOAN_MESSAGES.UPDATED, { loan }));
});

// ─── DELETE /loans/:id ────────────────────────────────────────────────────────

export const deleteLoan = asyncHandler(async (req, res) => {
  await loanService.deleteLoan(req.params.id, req.user._id);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, LOAN_MESSAGES.DELETED, null));
});
