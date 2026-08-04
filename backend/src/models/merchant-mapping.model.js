/**
 * Merchant Mapping Model
 *
 * Stores merchant name mappings learned by the user.
 * When user edits a transaction's merchant name, FinanceOS asks if they want to learn
 * this mapping for future imports. Only merchant names are learned, not categories.
 *
 * Fields:
 * - user: Reference to the User
 * - extractedName: The original name as extracted from statement (might be abbreviated, garbled, etc.)
 * - correctedName: The name user corrected it to
 * - count: How many times this mapping has been applied
 * - lastUsedAt: When this mapping was last applied
 * - isActive: Whether this mapping is still active
 *
 * Example:
 * extractedName: "AMAZON *MKTPLC"
 * correctedName: "Amazon"
 * count: 5
 * lastUsedAt: 2026-08-05T10:00:00Z
 */

import mongoose from "mongoose";

const { Schema } = mongoose;

const merchantMappingSchema = new Schema(
  {
    // Reference to the user
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },

    // Original merchant name as extracted from statement
    extractedName: {
      type: String,
      required: [true, "Extracted merchant name is required"],
      lowercase: true,
      trim: true,
    },

    // What user corrected it to
    correctedName: {
      type: String,
      required: [true, "Corrected merchant name is required"],
      trim: true,
    },

    // How many times this mapping has been automatically applied
    count: {
      type: Number,
      default: 1,
      min: 1,
    },

    // When this mapping was last used
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },

    // Whether this mapping is still active (user can disable)
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Query mappings for a specific user
merchantMappingSchema.index({ user: 1, extractedName: 1 }, { unique: true });

// Query active mappings for a user
merchantMappingSchema.index({ user: 1, isActive: 1 });

// ─── Model ────────────────────────────────────────────────────────────────────

const MerchantMapping = mongoose.model("MerchantMapping", merchantMappingSchema);

export default MerchantMapping;
