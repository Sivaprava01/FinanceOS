/**
 * User Model
 *
 * Central identity document for FinanceOS.
 * Supports both local (email/password) and Google OAuth authentication.
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

const userSchema = new Schema(
  {
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

    // Stored hashed; select:false prevents accidental exposure in responses
    refreshToken: {
      type: String,
      select: false,
    },

    // Reserved for Phase 03 email verification — included now to avoid a migration later
    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    avatar: {
      type: String,
      default: null,
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
