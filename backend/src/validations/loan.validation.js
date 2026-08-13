/**
 * Loan Request Validation
 *
 * Validation chains for loan creation and update.
 * Follows the same pattern as user.validation.js — uses express-validator
 * chains terminated by handleValidationErrors from auth.validation.js.
 */

import { body } from "express-validator";
import { handleValidationErrors } from "./auth.validation.js";
import { LOAN_TYPES, LOAN_STATUS } from "../constants/index.js";

// ─── Create Loan ──────────────────────────────────────────────────────────────

export const validateCreateLoan = [
  body("loanName")
    .trim()
    .notEmpty()
    .withMessage("Loan name is required")
    .isLength({ max: 100 })
    .withMessage("Loan name cannot exceed 100 characters"),

  body("loanType")
    .notEmpty()
    .withMessage("Loan type is required")
    .isIn(LOAN_TYPES)
    .withMessage(`Loan type must be one of: ${LOAN_TYPES.join(", ")}`),

  body("lenderName")
    .trim()
    .notEmpty()
    .withMessage("Lender name is required")
    .isLength({ max: 100 })
    .withMessage("Lender name cannot exceed 100 characters"),

  body("principalAmount")
    .notEmpty()
    .withMessage("Principal amount is required")
    .isFloat({ gt: 0 })
    .withMessage("Principal amount must be greater than 0"),

  body("interestRate")
    .notEmpty()
    .withMessage("Interest rate is required")
    .isFloat({ min: 0, max: 100 })
    .withMessage("Interest rate must be between 0 and 100"),

  body("loanStartDate")
    .notEmpty()
    .withMessage("Loan start date is required")
    .isISO8601()
    .withMessage("Loan start date must be a valid date"),

  body("loanEndDate")
    .notEmpty()
    .withMessage("Loan end date is required")
    .isISO8601()
    .withMessage("Loan end date must be a valid date")
    .custom((endDate, { req }) => {
      if (req.body.loanStartDate && new Date(endDate) <= new Date(req.body.loanStartDate)) {
        throw new Error("Loan end date must be after the start date");
      }
      return true;
    }),

  body("emiAmount")
    .notEmpty()
    .withMessage("EMI amount is required")
    .isFloat({ gt: 0 })
    .withMessage("EMI amount must be greater than 0"),

  body("emiDueDay")
    .notEmpty()
    .withMessage("EMI due day is required")
    .isInt({ min: 1, max: 31 })
    .withMessage("EMI due day must be between 1 and 31"),

  body("outstandingBalance")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Outstanding balance cannot be negative"),

  body("loanStatus")
    .optional()
    .isIn(Object.values(LOAN_STATUS))
    .withMessage(`Loan status must be one of: ${Object.values(LOAN_STATUS).join(", ")}`),

  handleValidationErrors,
];

// ─── Update Loan ──────────────────────────────────────────────────────────────

export const validateUpdateLoan = [
  body("loanName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Loan name cannot be empty")
    .isLength({ max: 100 })
    .withMessage("Loan name cannot exceed 100 characters"),

  body("loanType")
    .optional()
    .isIn(LOAN_TYPES)
    .withMessage(`Loan type must be one of: ${LOAN_TYPES.join(", ")}`),

  body("lenderName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Lender name cannot be empty")
    .isLength({ max: 100 })
    .withMessage("Lender name cannot exceed 100 characters"),

  body("principalAmount")
    .optional()
    .isFloat({ gt: 0 })
    .withMessage("Principal amount must be greater than 0"),

  body("interestRate")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Interest rate must be between 0 and 100"),

  body("loanStartDate").optional().isISO8601().withMessage("Loan start date must be a valid date"),

  body("loanEndDate").optional().isISO8601().withMessage("Loan end date must be a valid date"),

  body("emiAmount").optional().isFloat({ gt: 0 }).withMessage("EMI amount must be greater than 0"),

  body("emiDueDay")
    .optional()
    .isInt({ min: 1, max: 31 })
    .withMessage("EMI due day must be between 1 and 31"),

  body("outstandingBalance")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Outstanding balance cannot be negative"),

  body("loanStatus")
    .optional()
    .isIn(Object.values(LOAN_STATUS))
    .withMessage(`Loan status must be one of: ${Object.values(LOAN_STATUS).join(", ")}`),

  handleValidationErrors,
];
