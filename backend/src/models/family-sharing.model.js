/**
 * Family Sharing Model
 *
 * Represents what each family member shares with the family.
 *
 * Phase 10 fields:
 * - family: reference to Family
 * - user: reference to User member
 * - shareTransactions: whether to share transactions
 * - shareAssets: whether to share assets
 * - shareLoans: whether to share loans
 * - shareNetWorth: whether to share net worth
 * - createdAt, updatedAt: timestamps
 *
 * Design notes:
 * - Every family member has one sharing preferences document
 * - Sharing preferences are updated independently by each member
 * - Family Head cannot override member's sharing preferences
 * - Family dashboard only displays shared data
 * - Default: all sharing disabled (users opt-in to sharing)
 */

import mongoose from "mongoose";

const { Schema } = mongoose;

// ─── Family Sharing Schema ────────────────────────────────────────────────────

const familySharingSchema = new Schema(
  {
    family: {
      type: Schema.Types.ObjectId,
      ref: "Family",
      required: [true, "Family is required"],
      index: true,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true,
    },

    // Individual sharing preferences
    shareTransactions: {
      type: Boolean,
      default: false,
    },

    shareAssets: {
      type: Boolean,
      default: false,
    },

    shareLoans: {
      type: Boolean,
      default: false,
    },

    shareNetWorth: {
      type: Boolean,
      default: false,
    },

    // Convenience field: user can set to true to share everything at once
    shareEverything: {
      type: Boolean,
      default: false,
    },

    // Timestamp when sharing preferences were last updated
    lastUpdatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Unique: one sharing preference document per family member
familySharingSchema.index({ family: 1, user: 1 }, { unique: true });

// ─── Pre-save Hook ────────────────────────────────────────────────────────────
// When shareEverything is true, enable all sharing options

familySharingSchema.pre("save", function (next) {
  if (this.shareEverything) {
    this.shareTransactions = true;
    this.shareAssets = true;
    this.shareLoans = true;
    this.shareNetWorth = true;
  }

  // If all are false, shareEverything should also be false
  if (!this.shareTransactions && !this.shareAssets && !this.shareLoans && !this.shareNetWorth) {
    this.shareEverything = false;
  }

  this.lastUpdatedAt = Date.now();
  next();
});

// ─── Model ────────────────────────────────────────────────────────────────────

const FamilySharing = mongoose.model("FamilySharing", familySharingSchema);

export default FamilySharing;
