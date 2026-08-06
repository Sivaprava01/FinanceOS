/**
 * Loan Service
 *
 * All loan business logic lives here.
 * Controllers stay thin — they call these methods and return ApiResponse.
 * This service never touches req or res.
 */

import Loan from "../models/loan.model.js";
import ApiError from "../utils/ApiError.js";
import { HTTP_STATUS, LOAN_MESSAGES, LOAN_STATUS } from "../constants/index.js";

// ─── EMI Calculations ─────────────────────────────────────────────────────────

/**
 * Calculates dynamic EMI tracking fields for a loan.
 *
 * All values are calculated at request time from the loan's stored fields.
 * Nothing is persisted — consistent with the PRD's "calculate dynamically" rule.
 *
 * @param {object} loan - Mongoose loan document (plain object or document)
 * @returns {object} EMI tracking fields
 */
const calculateEmiTracking = (loan) => {
  const now        = new Date();
  const startDate  = new Date(loan.loanStartDate);
  const endDate    = new Date(loan.loanEndDate);

  // Total tenure in months from start to end date
  const totalMonths =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth());

  // EMIs paid = months elapsed since start date (floored, capped at total)
  const monthsElapsed =
    (now.getFullYear() - startDate.getFullYear()) * 12 +
    (now.getMonth() - startDate.getMonth());

  const emisPaid      = Math.max(0, Math.min(monthsElapsed, totalMonths));
  const emisRemaining = Math.max(0, totalMonths - emisPaid);

  const totalPaid            = emisPaid * loan.emiAmount;
  const calculatedRemaining  = Math.max(0, loan.principalAmount - totalPaid);

  // Progress percentage based on total tenure
  const progressPercent =
    totalMonths > 0 ? Math.min(100, Math.round((emisPaid / totalMonths) * 100)) : 0;

  // Next EMI due date: set emiDueDay in the current or next month
  const nextEmiDue = (() => {
    if (loan.loanStatus === LOAN_STATUS.CLOSED) return null;
    const d = new Date(now.getFullYear(), now.getMonth(), loan.emiDueDay);
    // If that day has already passed this month, push to next month
    if (d <= now) {
      d.setMonth(d.getMonth() + 1);
    }
    // Don't show an upcoming EMI past the loan end date
    return d <= endDate ? d.toISOString().slice(0, 10) : null;
  })();

  // Remaining tenure expressed in years and months
  const remainingYears  = Math.floor(emisRemaining / 12);
  const remainingMonths = emisRemaining % 12;
  const remainingTenure =
    remainingYears > 0
      ? `${remainingYears}y ${remainingMonths}m`
      : `${remainingMonths}m`;

  return {
    totalMonths,
    emisPaid,
    emisRemaining,
    totalPaid: Math.round(totalPaid * 100) / 100,
    calculatedOutstandingBalance: Math.round(calculatedRemaining * 100) / 100,
    progressPercent,
    nextEmiDue,
    remainingTenure,
  };
};

// ─── Response Shape ───────────────────────────────────────────────────────────

/**
 * Builds the public loan payload, merging stored fields with dynamic calculations.
 *
 * @param {object} loan - Mongoose document or plain object
 * @returns {object}
 */
const buildLoanPayload = (loan) => {
  const doc     = loan.toObject ? loan.toObject() : loan;
  const tracking = calculateEmiTracking(doc);

  return {
    _id:                doc._id,
    loanName:           doc.loanName,
    loanType:           doc.loanType,
    lenderName:         doc.lenderName,
    principalAmount:    doc.principalAmount,
    interestRate:       doc.interestRate,
    loanStartDate:      doc.loanStartDate,
    loanEndDate:        doc.loanEndDate,
    emiAmount:          doc.emiAmount,
    emiDueDay:          doc.emiDueDay,
    outstandingBalance: doc.outstandingBalance,
    loanStatus:         doc.loanStatus,
    // Dynamic calculations
    ...tracking,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

// ─── Create ───────────────────────────────────────────────────────────────────

/**
 * Creates a new loan for the authenticated user.
 *
 * outstandingBalance defaults to principalAmount when not supplied — the
 * loan starts fully outstanding.
 *
 * @param {string} userId
 * @param {object} dto - Validated request body
 * @returns {Promise<object>}
 */
const createLoan = async (userId, dto) => {
  const loan = await Loan.create({
    user: userId,
    ...dto,
    // Default outstanding balance to principal if not explicitly provided
    outstandingBalance: dto.outstandingBalance ?? dto.principalAmount,
  });

  return buildLoanPayload(loan);
};

// ─── List ─────────────────────────────────────────────────────────────────────

/**
 * Returns all loans for the authenticated user.
 * Supports optional status filter.
 *
 * @param {string} userId
 * @param {{ status?: string }} options
 * @returns {Promise<object[]>}
 */
const getLoans = async (userId, { status } = {}) => {
  const query = { user: userId };
  if (status) query.loanStatus = status;

  const loans = await Loan.find(query).sort({ createdAt: -1 }).lean();

  return loans.map(buildLoanPayload);
};

// ─── Get One ──────────────────────────────────────────────────────────────────

/**
 * Returns a single loan by ID, enforcing ownership.
 *
 * @param {string} loanId
 * @param {string} userId
 * @returns {Promise<object>}
 */
const getLoanById = async (loanId, userId) => {
  const loan = await Loan.findById(loanId);

  if (!loan) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, LOAN_MESSAGES.NOT_FOUND);
  }

  // Ownership check — a user must never see another user's loan
  if (loan.user.toString() !== userId.toString()) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, LOAN_MESSAGES.FORBIDDEN);
  }

  return buildLoanPayload(loan);
};

// ─── Update ───────────────────────────────────────────────────────────────────

/**
 * Updates a loan's mutable fields.
 * Ownership is verified before any write occurs.
 *
 * @param {string} loanId
 * @param {string} userId
 * @param {object} dto - Validated update fields
 * @returns {Promise<object>}
 */
const updateLoan = async (loanId, userId, dto) => {
  const loan = await Loan.findById(loanId);

  if (!loan) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, LOAN_MESSAGES.NOT_FOUND);
  }

  if (loan.user.toString() !== userId.toString()) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, LOAN_MESSAGES.FORBIDDEN);
  }

  // Apply updates using findByIdAndUpdate so schema validators run
  const updated = await Loan.findByIdAndUpdate(
    loanId,
    { $set: dto },
    { new: true, runValidators: true }
  );

  return buildLoanPayload(updated);
};

// ─── Delete ───────────────────────────────────────────────────────────────────

/**
 * Permanently removes a loan document.
 *
 * Loans are not soft-deleted — there is no financial data attached to a loan
 * record itself (transactions reference statement IDs, not loan IDs), so
 * hard deletion is safe and keeps the collection clean.
 *
 * @param {string} loanId
 * @param {string} userId
 * @returns {Promise<void>}
 */
const deleteLoan = async (loanId, userId) => {
  const loan = await Loan.findById(loanId);

  if (!loan) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, LOAN_MESSAGES.NOT_FOUND);
  }

  if (loan.user.toString() !== userId.toString()) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, LOAN_MESSAGES.FORBIDDEN);
  }

  await Loan.findByIdAndDelete(loanId);
};

// ─── Summary ──────────────────────────────────────────────────────────────────

/**
 * Calculates a financial summary across all of the user's loans.
 * All values are computed dynamically — nothing extra is stored.
 *
 * @param {string} userId
 * @returns {Promise<object>}
 */
const getLoanSummary = async (userId) => {
  const loans = await Loan.find({ user: userId }).lean();

  let totalActiveLoans     = 0;
  let totalOutstanding     = 0;
  let monthlyEmiTotal      = 0;
  let totalClosedLoans     = 0;

  for (const loan of loans) {
    if (loan.loanStatus === LOAN_STATUS.ACTIVE) {
      totalActiveLoans++;
      totalOutstanding += loan.outstandingBalance;
      monthlyEmiTotal  += loan.emiAmount;
    } else {
      totalClosedLoans++;
    }
  }

  return {
    totalActiveLoans,
    totalClosedLoans,
    totalOutstanding:  Math.round(totalOutstanding  * 100) / 100,
    monthlyEmiTotal:   Math.round(monthlyEmiTotal   * 100) / 100,
  };
};

// ─── Exports ──────────────────────────────────────────────────────────────────

export const loanService = {
  createLoan,
  getLoans,
  getLoanById,
  updateLoan,
  deleteLoan,
  getLoanSummary,
};
