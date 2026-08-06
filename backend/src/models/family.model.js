/**
 * Family Model
 *
 * Represents a family workspace in FinanceOS.
 * Every family has exactly one head and can have multiple members.
 *
 * Phase 10 fields:
 * - familyHead: reference to User who created the family
 * - familyName: name of the family
 * - members: array of member references with roles
 * - createdAt, updatedAt: timestamps
 * - isDeleted: soft delete flag
 *
 * Design notes:
 * - Head cannot be removed from the family
 * - Members are stored separately in the FamilyMember model for permission tracking
 * - Invitations are stored in the FamilyInvitation model
 */

import mongoose from "mongoose";
import { FAMILY_ROLES } from "../constants/index.js";

const { Schema } = mongoose;

// ─── Family Member Sub-schema ─────────────────────────────────────────────────

const familyMemberSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    role: {
      type: String,
      enum: Object.values(FAMILY_ROLES),
      default: FAMILY_ROLES.MEMBER,
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true } // Each member has an ID for easier management
);

// ─── Family Schema ────────────────────────────────────────────────────────────

const familySchema = new Schema(
  {
    familyHead: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Family head is required"],
    },

    familyName: {
      type: String,
      required: [true, "Family name is required"],
      trim: true,
      maxlength: [100, "Family name cannot exceed 100 characters"],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, "Family description cannot exceed 500 characters"],
      default: null,
    },

    members: [familyMemberSchema],

    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

familySchema.index({ familyHead: 1, isDeleted: 1 });
familySchema.index({ "members.user": 1, isDeleted: 1 });

// ─── Model ────────────────────────────────────────────────────────────────────

const Family = mongoose.model("Family", familySchema);

export default Family;
