/**
 * User Service
 *
 * All user profile business logic lives here.
 * This service never touches req or res.
 */

import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import { HTTP_STATUS, AUTH_MESSAGES } from "../constants/index.js";
// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Builds the full public user payload for API responses.
 * Sensitive fields (password, refreshToken) are never included.
 * Private to this module — auth responses use their own leaner serializer.
 *
 * @param {import("../models/user.model.js").default} user
 * @returns {object}
 */
const buildPublicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  provider: user.provider,
  isEmailVerified: user.isEmailVerified,
  country: user.country,
  preferredCurrency: user.preferredCurrency,
  timeZone: user.timeZone,
  preferences: user.preferences,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

// ─── Get Current User ─────────────────────────────────────────────────────────

/**
 * Returns the full profile of the authenticated user.
 * The protect middleware already verified the user exists,
 * but we re-fetch to guarantee fresh data and the correct document shape.
 *
 * @param {string} userId
 * @returns {Promise<object>}
 */
const getMe = async (userId) => {
  const user = await User.findById(userId);

  if (!user || user.isDeleted) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, USER_MESSAGES.USER_NOT_FOUND);
  }

  return buildPublicUser(user);
};

// ─── Update Profile ───────────────────────────────────────────────────────────

/**
 * Updates the mutable profile fields of the requesting user.
 *
 * Only an explicit whitelist of fields is applied — this prevents
 * any field not in the whitelist from being updated even if it
 * somehow passes validation.
 *
 * @param {string} userId
 * @param {object} updates - Validated fields from the request body
 * @returns {Promise<object>}
 */
const updateProfile = async (userId, updates) => {
  // Explicit whitelist — only these fields may be updated via this service method
  const ALLOWED_FIELDS = ["name", "avatar", "country", "preferredCurrency", "timeZone"];

  const sanitized = {};
  for (const field of ALLOWED_FIELDS) {
    if (updates[field] !== undefined) {
      sanitized[field] = updates[field];
    }
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: sanitized },
    {
      new: true,           // Return the updated document
      runValidators: true, // Run Mongoose schema validators on update
    }
  );

  if (!user || user.isDeleted) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, USER_MESSAGES.USER_NOT_FOUND);
  }

  return buildPublicUser(user);
};

// ─── Update Preferences ───────────────────────────────────────────────────────

/**
 * Merges preference updates into the user's existing preferences.
 *
 * We use dot-notation keys with $set rather than replacing the entire
 * preferences object. This means sending { theme: "dark" } only changes
 * the theme — it does not wipe out language or notifications.
 *
 * @param {string} userId
 * @param {object} updates - Validated preference fields
 * @returns {Promise<object>}
 */
const updatePreferences = async (userId, updates) => {
  // Build dot-notation update paths to avoid overwriting sibling fields
  const preferenceUpdate = {};

  if (updates.language !== undefined) {
    preferenceUpdate["preferences.language"] = updates.language;
  }
  if (updates.theme !== undefined) {
    preferenceUpdate["preferences.theme"] = updates.theme;
  }
  if (updates.notifications !== undefined) {
    // Merge individual notification toggles rather than replace the object
    if (updates.notifications.email !== undefined) {
      preferenceUpdate["preferences.notifications.email"] = updates.notifications.email;
    }
    if (updates.notifications.push !== undefined) {
      preferenceUpdate["preferences.notifications.push"] = updates.notifications.push;
    }
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: preferenceUpdate },
    { new: true, runValidators: true }
  );

  if (!user || user.isDeleted) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, USER_MESSAGES.USER_NOT_FOUND);
  }

  return buildPublicUser(user);
};

// ─── Delete Account (Soft Delete) ────────────────────────────────────────────

/**
 * Soft-deletes the user's account by setting isDeleted = true.
 *
 * The document is retained in MongoDB so financial data remains intact
 * and the account can be recovered if needed. The user's refresh token
 * is also cleared so existing sessions are immediately invalidated.
 *
 * Hard deletion (GDPR right-to-erasure) will be a separate admin operation.
 *
 * @param {string} userId
 * @returns {Promise<void>}
 */
const deleteAccount = async (userId) => {
  const user = await User.findById(userId);

  if (!user || user.isDeleted) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, USER_MESSAGES.USER_NOT_FOUND);
  }

  await User.findByIdAndUpdate(userId, {
    $set: { isDeleted: true },
    $unset: { refreshToken: 1 }, // Invalidate all active sessions immediately
  });
};

// ─── Exports ──────────────────────────────────────────────────────────────────

export const userService = {
  getMe,
  updateProfile,
  updatePreferences,
  deleteAccount,
};
