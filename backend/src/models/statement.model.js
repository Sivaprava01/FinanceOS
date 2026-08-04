/**
 * Statement Model
 *
 * Represents a bank statement upload by a user.
 * Stores metadata about the import, not the actual file.
 * The uploaded file itself is temporary and deleted after processing.
 *
 * Fields:
 * - user: Reference to the User who uploaded this statement
 * - originalFileName: The name of the file as uploaded by the user
 * - fileType: The format (PDF, CSV, XLSX)
 * - fileSize: Size in bytes
 * - status: Processing status (Uploaded, Processing, Completed, Failed)
 * - failureReason: If status is Failed, explains why
 * - transactionCount: Number of transactions extracted (Phase 05)
 * - uploadedAt: When the file was uploaded
 * - processedAt: When the processing completed
 * - isDeleted: Soft delete flag for data retention
 *
 * Privacy note: The actual file is stored temporarily and deleted after
 * processing. Only this metadata record remains.
 */

import mongoose from "mongoose";

const { Schema } = mongoose;

const statementSchema = new Schema(
  {
    // Reference to the user who uploaded this statement
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },

    // Original filename as uploaded by the user
    originalFileName: {
      type: String,
      required: [true, "Original file name is required"],
      trim: true,
    },

    // File type: PDF, CSV, XLSX
    fileType: {
      type: String,
      enum: ["PDF", "CSV", "XLSX"],
      required: [true, "File type is required"],
    },

    // File size in bytes
    fileSize: {
      type: Number,
      required: [true, "File size is required"],
      min: [1, "File cannot be empty"],
    },

    // Processing status
    status: {
      type: String,
      enum: ["Uploaded", "Processing", "Completed", "Failed"],
      default: "Uploaded",
    },

    // If processing failed, this explains why
    failureReason: {
      type: String,
      default: null,
    },

    // Number of transactions extracted (populated during processing in Phase 05)
    transactionCount: {
      type: Number,
      default: 0,
    },

    // When the file was uploaded
    uploadedAt: {
      type: Date,
      default: Date.now,
    },

    // When processing completed (success or failure)
    processedAt: {
      type: Date,
      default: null,
    },

    // Soft delete flag
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Query import history for a specific user
statementSchema.index({ user: 1, createdAt: -1 });

// Find non-deleted records
statementSchema.index({ isDeleted: 1 });

// ─── Model ────────────────────────────────────────────────────────────────────

const Statement = mongoose.model("Statement", statementSchema);

export default Statement;
