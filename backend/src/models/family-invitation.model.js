/**
 * Family Invitation Model
 *
 * Represents an invitation sent to a user to join a family.
 *
 * Phase 10 fields:
 * - family: reference to Family
 * - invitedBy: reference to User who sent the invitation
 * - invitedEmail: email of the user being invited
 * - status: pending, accepted, rejected
 * - expiresAt: invitation expiration time (default 7 days)
 * - createdAt, updatedAt: timestamps
 *
 * Design notes:
 * - Invitations use email so users can be invited before they create an account
 * - Only one pending invitation per email per family
 * - Accepted/rejected invitations are kept for audit trail
 * - Invitations auto-expire after 7 days
 */

import mongoose from "mongoose";
import { INVITATION_STATUS } from "../constants/index.js";

const { Schema } = mongoose;

// ─── Family Invitation Schema ─────────────────────────────────────────────────

const familyInvitationSchema = new Schema(
  {
    family: {
      type: Schema.Types.ObjectId,
      ref: "Family",
      required: [true, "Family is required"],
      index: true,
    },

    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Inviting user is required"],
    },

    invitedEmail: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },

    status: {
      type: String,
      enum: Object.values(INVITATION_STATUS),
      default: INVITATION_STATUS.PENDING,
      index: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      index: true,
    },

    respondedAt: {
      type: Date,
      default: null,
    },

    respondedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Unique constraint: only one pending invitation per email per family
familyInvitationSchema.index(
  { family: 1, invitedEmail: 1, status: 1 },
  { unique: true, sparse: true }
);

// Query by invitedEmail and status
familyInvitationSchema.index({ invitedEmail: 1, status: 1 });

// Auto-expire invitations
familyInvitationSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 } // TTL index
);

// ─── Model ────────────────────────────────────────────────────────────────────

const FamilyInvitation = mongoose.model("FamilyInvitation", familyInvitationSchema);

export default FamilyInvitation;
