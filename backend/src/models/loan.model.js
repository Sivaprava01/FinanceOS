/**
 * Loan Model
 *
 * Represents a single loan belonging to a user.
 * All monetary fields store the value at the time of creation/update.
 * Dynamic calculations (remaining balance, progress, etc.) are computed
 * in the service layer — never stored — to stay consistent with the
 * "calculate dynamically" principle in the PRD.
 */

import mongoose from "mongoose";
import { LOAN_TYPES, LOAN_STATUS } from "../constants/index.js";

const { Schema } = mongoose;

const loanSchema = new Schema(
  {
    // Every loan belongs to exactly one user
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true,
    },

    loanName: {
      type: String,
      required: [true, "Loan name is required"],
      trim: true,
      maxlength: [100, "Loan name cannot exceed 100 characters"],
    },

    loanType: {
      type: String,
      required: [true, "Loan type is required"],
      enum: {
        values: LOAN_TYPES,
        message: `Loan type must be one of: ${LOAN_TYPES.join(", ")}`,
      },
    },

    lenderName: {
      type: String,
      required: [true, "Lender name is required"],
      trim: true,
      maxlength: [100, "Lender name cannot exceed 100 characters"],
    },

    principalAmount: {
      type: Number,
      required: [true, "Principal amount is required"],
      min: [1, "Principal amount must be greater than 0"],
    },

    interestRate: {
      type: Number,
      required: [true, "Interest rate is required"],
      min: [0, "Interest rate cannot be negative"],
      max: [100, "Interest rate cannot exceed 100%"],
    },

    loanStartDate: {
      type: Date,
      required: [true, "Loan start date is required"],
    },

    loanEndDate: {
      type: Date,
      required: [true, "Loan end date is required"],
    },

    emiAmount: {
      type: Number,
      required: [true, "EMI amount is required"],
      min: [1, "EMI amount must be greater than 0"],
    },

    // Day of month the EMI is due (1-31)
    emiDueDay: {
      type: Number,
      required: [true, "EMI due day is required"],
      min: [1, "EMI due day must be between 1 and 31"],
      max: [31, "EMI due day must be between 1 and 31"],
    },

    // User-maintained outstanding balance.
    // Defaults to principalAmount on creation and can be updated by the user.
    // The service layer also exposes a calculated remaining balance based on
    // EMIs paid to date — that is separate from this stored field.
    outstandingBalance: {
      type: Number,
      required: [true, "Outstanding balance is required"],
      min: [0, "Outstanding balance cannot be negative"],
    },

    loanStatus: {
      type: String,
      enum: {
        values: Object.values(LOAN_STATUS),
        message: `Loan status must be one of: ${Object.values(LOAN_STATUS).join(", ")}`,
      },
      default: LOAN_STATUS.ACTIVE,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Efficient queries for a user's loans
loanSchema.index({ user: 1, loanStatus: 1 });
loanSchema.index({ user: 1, createdAt: -1 });

// ─── Model ────────────────────────────────────────────────────────────────────

const Loan = mongoose.model("Loan", loanSchema);

export default Loan;
