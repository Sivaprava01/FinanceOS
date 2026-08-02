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
import { buildPublicUser } from "./user.service.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

// buildPublicUser is the canonical user shape — defined in user.service.js
// and reused here so auth responses match user module responses exactly.

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

  return { user: buildPublicUser(user), accessToken, refreshToken };
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

  // Google-only accounts have no password
  if (user.provider !== AUTH_PROVIDERS.LOCAL || !user.password) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, AUTH_MESSAGES.INVALID_CREDENTIALS);
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, AUTH_MESSAGES.INVALID_CREDENTIALS);
  }

  const { accessToken, refreshToken } = await issueTokenPair(user);

  return { user: buildPublicUser(user), accessToken, refreshToken };
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

  return buildPublicUser(user);
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

// ─── Exports ──────────────────────────────────────────────────────────────────

export const authService = {
  register,
  login,
  logout,
  refreshAccessToken,
  getProfile,
  handleGoogleAuth,
};
