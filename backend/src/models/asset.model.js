/**
 * Asset Model
 *
 * Represents a financial asset belonging to a user.
 * Only currentValue is required for Net Worth calculations — all other
 * fields enrich the asset record but are optional.
 *
 * Net Worth is never stored. It is calculated dynamically in the service
 * layer by combining asset currentValues with active loan outstandingBalances.
 */

import mongoose from "mongoose";
import { ASSET_CATEGORIES } from "../constants/index.js";

const { Schema } = mongoose;

const assetSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true,
    },

    assetName: {
      type: String,
      required: [true, "Asset name is required"],
      trim: true,
      maxlength: [100, "Asset name cannot exceed 100 characters"],
    },

    assetCategory: {
      type: String,
      required: [true, "Asset category is required"],
      enum: {
        values: ASSET_CATEGORIES,
        message: `Asset category must be one of: ${ASSET_CATEGORIES.join(", ")}`,
      },
    },

    // Current market / estimated value — used in all Net Worth calculations
    currentValue: {
      type: Number,
      required: [true, "Current value is required"],
      min: [0, "Current value cannot be negative"],
    },

    // Original purchase value — optional, used to show gain/loss
    purchaseValue: {
      type: Number,
      min: [0, "Purchase value cannot be negative"],
      default: null,
    },

    purchaseDate: {
      type: Date,
      default: null,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

assetSchema.index({ user: 1, assetCategory: 1 });
assetSchema.index({ user: 1, createdAt: -1 });

// ─── Model ────────────────────────────────────────────────────────────────────

const Asset = mongoose.model("Asset", assetSchema);

export default Asset;
