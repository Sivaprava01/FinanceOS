/**
 * Auth Service
 *
 * All authentication business logic lives here.
 * Controllers stay thin — they call these methods and return ApiResponse.
 *
 * This service never touches req or res. It receives plain values,
 * performs operations, and returns plain results.
 */

import User from "../models/user.model.js";
import { tokenUtils } from "../utils/token.js";
import ApiError from "../utils/ApiError.js";
import { HTTP_STATUS, AUTH_MESSAGES, AUTH_PROVIDERS } from "../constants/index.js";
import { sendPasswordResetEmail, isEmailServiceAvailable } from "./mail.service.js";
import crypto from "crypto";
// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Builds the auth-scoped public user payload.
 * Auth responses only need identity and auth-state fields —
 * profile fields (country, preferences, etc.) are the user module's concern.
 * Keeping this here avoids a cross-module dependency for a shape that
 * belongs to the auth context.
 *
 * @param {import("../models/user.model.js").default} user
 * @returns {object}
 */
const buildUserPayload = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  provider: user.provider,
  isEmailVerified: user.isEmailVerified,
  createdAt: user.createdAt,
});

/**
 * Generates a fresh access + refresh token pair for a user
 * and persists the new refresh token on the document.
 *
 * Keeping token generation + persistence together prevents the service
 * from returning tokens that are not yet saved to the database.
 *
 * @param {import("../models/user.model.js").default} user
 * @returns {Promise<{ accessToken: string, refreshToken: string }>}
 */
const issueTokenPair = async (user) => {
  const tokenPayload = {
    _id: user._id,
    email: user.email,
  };

  const accessToken = tokenUtils.generateAccessToken(tokenPayload);
  const refreshToken = tokenUtils.generateRefreshToken({ _id: user._id });

  // Persist the refresh token so it can be validated and rotated later
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

// ─── Register ─────────────────────────────────────────────────────────────────

/**
 * Creates a new local user account.
 *
 * @param {{ name: string, email: string, password: string }} dto
 * @returns {Promise<{ user: object, accessToken: string, refreshToken: string }>}
 */
const register = async ({ name, email, password }) => {
  const existing = await User.findOne({ email });

  if (existing) {
    throw new ApiError(HTTP_STATUS.CONFLICT, AUTH_MESSAGES.EMAIL_ALREADY_EXISTS);
  }

  // Create with provider:local — password hashing is handled by pre-save hook
  const user = await User.create({
    name,
    email,
    password,
    provider: AUTH_PROVIDERS.LOCAL,
  });

  const { accessToken, refreshToken } = await issueTokenPair(user);

  return { user: buildUserPayload(user), accessToken, refreshToken };
};

// ─── Login ────────────────────────────────────────────────────────────────────

/**
 * Authenticates a local user by email and password.
 *
 * @param {{ email: string, password: string }} dto
 * @returns {Promise<{ user: object, accessToken: string, refreshToken: string }>}
 */
const login = async ({ email, password }) => {
  // Explicitly select password — it is excluded by default via select:false
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    // Use a generic message — never confirm whether the email exists
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, AUTH_MESSAGES.INVALID_CREDENTIALS);
  }

  // Soft-deleted accounts must not receive new tokens under any circumstances
  if (user.isDeleted) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, AUTH_MESSAGES.ACCOUNT_DELETED);
  }

  // Google-only accounts have no password
  if (user.provider !== AUTH_PROVIDERS.LOCAL || !user.password) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, AUTH_MESSAGES.INVALID_CREDENTIALS);
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, AUTH_MESSAGES.INVALID_CREDENTIALS);
  }

  const { accessToken, refreshToken } = await issueTokenPair(user);

  return { user: buildUserPayload(user), accessToken, refreshToken };
};

// ─── Logout ───────────────────────────────────────────────────────────────────

/**
 * Invalidates the user's refresh token on the server side.
 * The client is responsible for clearing the cookie.
 *
 * @param {string} userId
 * @returns {Promise<void>}
 */
const logout = async (userId) => {
  // Null out the stored refresh token — any replay of the old cookie will fail
  await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
};

// ─── Refresh Token ────────────────────────────────────────────────────────────

/**
 * Validates the incoming refresh token, rotates it, and issues a new
 * access + refresh token pair.
 *
 * Rotation means every call produces a new refresh token. If a stolen
 * token is replayed after the legitimate user has already refreshed,
 * it will fail because the stored token no longer matches.
 *
 * @param {string} incomingToken - Token from the HTTP-only cookie
 * @returns {Promise<{ accessToken: string, refreshToken: string }>}
 */
const refreshAccessToken = async (incomingToken) => {
  if (!incomingToken) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, AUTH_MESSAGES.MISSING_TOKEN);
  }

  // Decode and validate the token signature / expiry
  const decoded = tokenUtils.verifyRefreshToken(incomingToken);

  // Fetch the user with their stored refresh token for comparison
  const user = await User.findById(decoded._id).select("+refreshToken");

  if (!user) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, AUTH_MESSAGES.INVALID_TOKEN);
  }

  // Strict equality check — the incoming token must match what is stored.
  // This enforces single-use token rotation and detects replay attacks.
  if (user.refreshToken !== incomingToken) {
    // Clear the stored token — treat this as a potential token theft
    await User.findByIdAndUpdate(user._id, { $unset: { refreshToken: 1 } });
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, AUTH_MESSAGES.INVALID_TOKEN);
  }

  const { accessToken, refreshToken } = await issueTokenPair(user);

  return { accessToken, refreshToken };
};

// ─── Get Profile ──────────────────────────────────────────────────────────────

/**
 * Fetches the authenticated user's profile from the database.
 * Re-queries rather than returning JWT payload so the response always
 * reflects the current state of the user document.
 *
 * @param {string} userId
 * @returns {Promise<object>}
 */
const getProfile = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, AUTH_MESSAGES.USER_NOT_FOUND);
  }

  return buildUserPayload(user);
};

// ─── Google OAuth ─────────────────────────────────────────────────────────────

/**
 * Finds or creates a user after successful Google OAuth authentication.
 * Called by the Passport Google strategy callback.
 *
 * @param {{ googleId: string, email: string, name: string, avatar: string }} profile
 * @returns {Promise<{ accessToken: string, refreshToken: string }>}
 */
const handleGoogleAuth = async ({ googleId, email, name, avatar }) => {
  // First try to find by googleId (returning user)
  let user = await User.findOne({ googleId });

  if (!user) {
    // Check if a local account exists with this email — link it to Google
    user = await User.findOne({ email });

    if (user) {
      // Upgrade the existing local account to also support Google
      user.googleId = googleId;
      user.provider = AUTH_PROVIDERS.GOOGLE;
      if (avatar && !user.avatar) user.avatar = avatar;
      await user.save({ validateBeforeSave: false });
    } else {
      // Brand new user via Google
      user = await User.create({
        name,
        email,
        googleId,
        avatar,
        provider: AUTH_PROVIDERS.GOOGLE,
        isEmailVerified: true, // Google has already verified the email
      });
    }
  }

  const { accessToken, refreshToken } = await issueTokenPair(user);

  return { accessToken, refreshToken };
};

// ─── Password Reset ───────────────────────────────────────────────────────────

/**
 * Generates a password reset token and sends a reset link to the user's email.
 * In development, logs the token to console. In production, send via email.
 *
 * @param {string} email - User's email address
 * @returns {Promise<{ resetTokenSent: boolean, email: string, devToken?: string }>}
 */
const requestPasswordReset = async (email) => {
  // Always return success to prevent account enumeration
  // But still process valid emails
  const user = await User.findOne({ email });

  if (user && user.provider === AUTH_PROVIDERS.LOCAL) {
    // Generate a secure reset token (32 bytes = 64 hex characters)
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash the token before storing (same way we hash passwords)
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    // Store the hashed token and expiry (30 minutes)
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 30 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    // Generate the reset link using configured frontend URL
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${email}`;

    // Try to send email
    const emailResult = await sendPasswordResetEmail(email, resetToken, resetLink);

    // In development mode with no SMTP configured, return the devToken for testing
    if (process.env.NODE_ENV !== "production" && emailResult.devMode) {
      return {
        resetTokenSent: true,
        email,
        devToken: resetToken, // Only in development when SMTP not configured
      };
    }

    // If email sending failed, throw an error
    if (!emailResult.success) {
      throw new ApiError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        "Failed to send password reset email. Please try again later."
      );
    }

    // In production or when SMTP is configured, don't return the token
    // (it should only come via email)
    return {
      resetTokenSent: true,
      email,
    };
  }

  // Always return success message even if email not found (prevents account enumeration)
  return {
    resetTokenSent: true,
    email,
  };
};

/**
 * Validates the password reset token and resets the user's password.
 *
 * @param {string} email - User's email
 * @param {string} token - Plain reset token from URL/request
 * @param {string} newPassword - New password
 * @returns {Promise<{ passwordReset: boolean, message: string }>}
 */
const resetPassword = async (email, token, newPassword) => {
  // Hash the incoming token to compare with stored hash
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // Find user and verify token + expiry
  const user = await User.findOne({
    email,
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      "Password reset token is invalid or has expired. Please request a new reset link."
    );
  }

  // Update password (will be hashed by pre-save hook)
  user.password = newPassword;

  // Clear reset token to prevent reuse
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  // Invalidate all existing refresh tokens (force re-login on all devices)
  user.refreshToken = undefined;

  await user.save();

  return {
    passwordReset: true,
    message: "Password has been reset successfully. Please log in with your new password.",
  };
};

// ─── Exports ──────────────────────────────────────────────────────────────────

export const authService = {
  register,
  login,
  logout,
  refreshAccessToken,
  getProfile,
  handleGoogleAuth,
  requestPasswordReset,
  resetPassword,
};
