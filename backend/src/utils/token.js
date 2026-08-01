/**
 * Token Utilities
 *
 * All JWT operations are centralized here so any future change
 * to token structure, algorithm, or signing keys only touches one file.
 *
 * Access tokens  → short-lived, sent in Authorization header or response body
 * Refresh tokens → long-lived, stored in HTTP-only cookie + User document
 */

import jwt from "jsonwebtoken";
import ApiError from "./ApiError.js";
import { HTTP_STATUS, AUTH_MESSAGES } from "../constants/index.js";

// ─── Access Token ─────────────────────────────────────────────────────────────

/**
 * Signs a new access token for a given user payload.
 *
 * @param {{ _id: string, email: string, role: string }} payload
 * @returns {string} Signed JWT access token
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "15m",
  });
};

// ─── Refresh Token ────────────────────────────────────────────────────────────

/**
 * Signs a new refresh token.
 * Carries only the user ID — the service will re-fetch the user on rotation.
 *
 * @param {{ _id: string }} payload
 * @returns {string} Signed JWT refresh token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || "30d",
  });
};

// ─── Verify ───────────────────────────────────────────────────────────────────

/**
 * Verifies an access token and returns the decoded payload.
 * Throws ApiError on invalid or expired token so callers don't
 * need to handle raw jwt errors.
 *
 * @param {string} token
 * @returns {object} Decoded JWT payload
 * @throws {ApiError} 401 on invalid/expired token
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, AUTH_MESSAGES.INVALID_TOKEN);
  }
};

/**
 * Verifies a refresh token and returns the decoded payload.
 * Uses a separate secret from access tokens intentionally —
 * compromise of one secret does not invalidate the other.
 *
 * @param {string} token
 * @returns {object} Decoded JWT payload
 * @throws {ApiError} 401 on invalid/expired token
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, AUTH_MESSAGES.INVALID_TOKEN);
  }
};

// ─── Exports ──────────────────────────────────────────────────────────────────

export const tokenUtils = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
