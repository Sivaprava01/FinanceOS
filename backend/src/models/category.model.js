/**
 * Category Model
 *
 * Represents a transaction category created by a user.
 * Categories are user-scoped (each user has their own custom categories).
 *
 * Fields:
 * - userId: Reference to the User who created this category
 * - name: Category name (unique per user)
 * - type: Enum (Expense, Income, Asset, Liability) - optional, defaults to Expense
 * - color: Hex color code for UI display (optional, defaults to #10b981)
 * - icon: Lucide icon name for UI display (optional)
 * - isCustom: Always true for user-created categories (for future expansion)
 * - description: Optional description for the category
 * - createdAt, updatedAt: Timestamps
 */

import mongoose from "mongoose";

const { Schema } = mongoose;

const categorySchema = new Schema(
  {
    // Reference to the user who created this category
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },

    // Category name (unique per user)
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      maxlength: [50, "Category name cannot exceed 50 characters"],
    },

    // Category type (Expense, Income, Asset, Liability)
    type: {
      type: String,
      enum: ["Expense", "Income", "Asset", "Liability"],
      default: "Expense",
    },

    // Hex color code for UI display (e.g., #10b981)
    color: {
      type: String,
      default: "#10b981",
      match: [/^#[0-9A-F]{6}$/i, "Color must be a valid hex code (e.g., #10b981)"],
    },

    // Lucide icon name (e.g., "ShoppingCart", "Home", "Zap")
    icon: {
      type: String,
      default: null,
      trim: true,
    },

    // Always true for user-created categories
    // Future: false for system-defined categories
    isCustom: {
      type: Boolean,
      default: true,
    },

    // Optional description
    description: {
      type: String,
      default: null,
      trim: true,
      maxlength: [200, "Description cannot exceed 200 characters"],
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Query categories for a specific user
categorySchema.index({ userId: 1, name: 1 }, { unique: true });

// Query by type
categorySchema.index({ userId: 1, type: 1 });

// ─── Model ────────────────────────────────────────────────────────────────────

const Category = mongoose.model("Category", categorySchema);

export default Category;
