/**
 * User Model
 *
 * Central identity document for FinanceOS.
 * Supports both local (email/password) and Google OAuth authentication.
 *
 * Phase 02 fields: name, email, password, provider, googleId,
 *                  refreshToken, isEmailVerified, avatar
 *
 * Phase 03 fields: country, preferredCurrency, timeZone,
 *                  preferences (nested), isDeleted
 *
 * Security notes:
 * - password and refreshToken use select:false so they are never
 *   accidentally returned in API responses
 * - Passwords are hashed in the pre-save hook, never stored in plain text
 * - comparePassword is an instance method to keep crypto logic with the model
 */

import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { AUTH_PROVIDERS } from "../constants/index.js";

const { Schema } = mongoose;

// ─── Preferences Sub-schema ───────────────────────────────────────────────────
// Kept as an embedded sub-document so we can add fields (budgetAlerts,
// twoFactorAuth, etc.) in future phases without touching top-level schema.

const preferencesSchema = new Schema(
  {
    language: {
      type: String,
      default: "en",
      trim: true,
    },

    theme: {
      type: String,
      enum: ["light", "dark", "system"],
      default: "system",
    },

    notifications: {
      email: {
        type: Boolean,
        default: true,
      },
      push: {
        type: Boolean,
        default: true,
      },
    },

    dateFormat: {
      type: String,
      enum: ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"],
      default: "DD/MM/YYYY",
    },
  },
  { _id: false } // No separate _id for this embedded document
);

// ─── User Schema ──────────────────────────────────────────────────────────────

const userSchema = new Schema(
  {
    // ── Phase 02: Auth fields ─────────────────────────────────────────────────

    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },

    password: {
      type: String,
      // Not required at schema level — Google users never set a password
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },

    provider: {
      type: String,
      enum: Object.values(AUTH_PROVIDERS),
      default: AUTH_PROVIDERS.LOCAL,
    },

    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },

    // Stored as plain token string; select:false prevents accidental exposure
    refreshToken: {
      type: String,
      select: false,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    avatar: {
      type: String,
      default: null,
    },

    // ── Phase 03: Profile fields ──────────────────────────────────────────────

    country: {
      type: String,
      trim: true,
      uppercase: true,
      // ISO 3166-1 alpha-2 format validated at the service/validation layer
      default: null,
    },

    preferredCurrency: {
      type: String,
      uppercase: true,
      trim: true,
      default: "USD",
    },

    timeZone: {
      type: String,
      trim: true,
      default: "UTC",
    },

    preferences: {
      type: preferencesSchema,
      default: () => ({}), // Mongoose will populate defaults from preferencesSchema
    },

    // Soft delete — document is retained in MongoDB but excluded from all queries
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Pre-save Hook ────────────────────────────────────────────────────────────

userSchema.pre("save", async function (next) {
  // Only hash when the password field has been set or changed.
  // Without this guard, every document save (e.g. updating refreshToken)
  // would re-hash an already-hashed password and break authentication.
  if (!this.isModified("password") || !this.password) return next();

  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;
  this.password = await bcrypt.hash(this.password, saltRounds);
  next();
});

// ─── Instance Methods ─────────────────────────────────────────────────────────

/**
 * Compares a plain-text password against the stored hash.
 * Calling code must first query with .select("+password").
 *
 * @param {string} candidatePassword
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ─── Model ────────────────────────────────────────────────────────────────────

const User = mongoose.model("User", userSchema);

export default User;
