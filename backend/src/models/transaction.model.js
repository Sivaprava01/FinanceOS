/**
 * Transaction Model
 *
 * Represents a financial transaction (imported from statement or manually added).
 * Stores both original extracted values and user-corrected values.
 *
 * Fields:
 * - user: Reference to the User who owns this transaction
 * - statementId: Reference to the Statement this was extracted from (null if manual)
 * - date: Transaction date (corrected value)
 * - originalDate: Date as extracted (preserved for transparency)
 * - amount: Transaction amount (corrected value, always positive)
 * - originalAmount: Amount as extracted
 * - type: Debit or Credit
 * - originalType: Type as extracted
 * - merchant: Merchant name (corrected value)
 * - originalMerchant: Merchant as extracted
 * - description: Transaction description (corrected)
 * - originalDescription: Description as extracted
 * - category: Transaction category (user-assigned)
 * - notes: User notes
 * - isEdited: Whether user has edited this transaction
 * - editedAt: When user last edited
 * - isDeleted: Soft delete flag
 *
 * Privacy note: Transaction data is retained but extracted statement files are deleted.
 */

import mongoose from "mongoose";

const { Schema } = mongoose;

const transactionSchema = new Schema(
  {
    // Reference to the user who owns this transaction
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },

    // Reference to the statement this was extracted from (null for manual entries)
    statementId: {
      type: Schema.Types.ObjectId,
      ref: "Statement",
      default: null,
    },

    // ─── Corrected Values (what user sees and uses) ─────────────────────────

    // Transaction date (user can correct if OCR was wrong)
    date: {
      type: Date,
      required: [true, "Transaction date is required"],
      index: true,
    },

    // Amount in base currency (always positive, type determines direction)
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },

    // Transaction type: income, expense, asset, liability (supports legacy Debit, Credit, etc.)
    type: {
      type: String,
      enum: [
        "income",
        "expense",
        "asset",
        "liability",
        "Debit",
        "Credit",
        "Income",
        "Expense",
        "Asset",
        "Liability",
      ],
      required: [true, "Transaction type is required"],
    },

    // Payment method (for expense transactions only)
    paymentMethod: {
      type: String,
      enum: {
        values: [
          "cash",
          "upi",
          "debit_card",
          "credit_card",
          "bank_transfer",
          "net_banking",
          "cheque",
          "wallet",
          "other",
        ],
        message: "{VALUE} is not a valid payment method",
      },
      required: false,
      default: undefined,
      set: (v) => (v ? String(v).toLowerCase().trim() : undefined),
    },

    // Merchant name (user can correct if OCR extracted wrong name)
    merchant: {
      type: String,
      default: '',
      trim: true,
    },

    // Transaction description (user can edit)
    description: {
      type: String,
      default: "",
      trim: true,
    },

    // Category (user-assigned for organizing transactions)
    category: {
      type: String,
      default: "Uncategorized",
      trim: true,
    },

    // User notes (optional)
    notes: {
      type: String,
      default: "",
      trim: true,
    },

    // ─── Original Extracted Values (preserved for transparency) ───────────────

    // Original date as extracted from statement
    originalDate: {
      type: Date,
      default: null,
    },

    // Original amount as extracted
    originalAmount: {
      type: Number,
      default: null,
    },

    // Original type as extracted
    originalType: {
      type: String,
      default: null,
    },

    // Original merchant as extracted
    originalMerchant: {
      type: String,
      default: null,
    },

    // Original description as extracted
    originalDescription: {
      type: String,
      default: null,
    },

    // ─── Metadata ────────────────────────────────────────────────────────────

    // Whether user has edited this transaction
    isEdited: {
      type: Boolean,
      default: false,
    },

    // When user last edited this transaction
    editedAt: {
      type: Date,
      default: null,
    },

    // Soft delete flag
    isDeleted: {
      type: Boolean,
      default: false,
    },

    // Currency of this transaction (ISO 4217 code, e.g. "INR", "USD")
    // null means same as user's preferred currency — no conversion needed
    currency: {
      type: String,
      uppercase: true,
      trim: true,
      default: null,
    },

    // Source of this transaction: "manual" or "statement"
    // "manual" = user-created transaction with statementId = null
    // "statement" = parsed from bank statement import with statementId set
    source: {
      type: String,
      enum: ["manual", "statement"],
      default: "manual",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Query transactions for a specific user
transactionSchema.index({ user: 1, date: -1 });

// Query transactions by user and type
transactionSchema.index({ user: 1, type: 1 });

// Query transactions by user and payment method
transactionSchema.index({ user: 1, paymentMethod: 1 });

// Query transactions by merchant (for merchant learning)
transactionSchema.index({ user: 1, merchant: 1 });

// Query non-deleted records
transactionSchema.index({ isDeleted: 1 });

// Query by statement (to get transactions from a specific import)
transactionSchema.index({ statementId: 1 });

// ─── Model ────────────────────────────────────────────────────────────────────

const Transaction = mongoose.model("Transaction", transactionSchema);

// Diagnostic logging for runtime schema verification
if (process.env.NODE_ENV !== "production") {
  console.log("\n[RUNTIME] Transaction Model Loaded");
  console.log("[RUNTIME] paymentMethod enum values:", transactionSchema.path("paymentMethod").enumValues);
  console.log("[RUNTIME] paymentMethod required:", transactionSchema.path("paymentMethod").isRequired);
  console.log("[RUNTIME] paymentMethod default:", transactionSchema.path("paymentMethod").defaultValue);
  console.log("");
}

export default Transaction;
