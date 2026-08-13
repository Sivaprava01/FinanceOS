/**
 * Auth Controller
 *
 * Thin layer between routes and the auth service.
 * Responsibilities:
 * - Extract validated input from req
 * - Call the appropriate service method
 * - Set / clear HTTP-only cookies
 * - Return a consistent ApiResponse
 *
 * No business logic lives here.
 */

import { authService } from "../services/auth.service.js";
import { ApiResponse, ApiError, asyncHandler } from "../utils/index.js";
import { HTTP_STATUS, AUTH_MESSAGES, COOKIE_NAMES, COOKIE_OPTIONS } from "../constants/index.js";

// ─── Cookie Helper ────────────────────────────────────────────────────────────

/**
 * Attaches the refresh token as an HTTP-only cookie on the response.
 * Centralised here so all auth endpoints set the cookie identically.
 *
 * @param {import("express").Response} res
 * @param {string} token
 */
const setRefreshTokenCookie = (res, token) => {
  const maxAge = parseInt(process.env.JWT_REFRESH_EXPIRE_MS, 10) || 30 * 24 * 60 * 60 * 1000;

  res.cookie(COOKIE_NAMES.REFRESH_TOKEN, token, {
    ...COOKIE_OPTIONS,
    maxAge,
  });
};

/**
 * Clears the refresh token cookie.
 *
 * @param {import("express").Response} res
 */
const clearRefreshTokenCookie = (res) => {
  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, COOKIE_OPTIONS);
};

// ─── Register ─────────────────────────────────────────────────────────────────

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const { user, accessToken, refreshToken } = await authService.register({
    name,
    email,
    password,
  });

  setRefreshTokenCookie(res, refreshToken);

  return res.status(HTTP_STATUS.CREATED).json(
    new ApiResponse(HTTP_STATUS.CREATED, AUTH_MESSAGES.REGISTER_SUCCESS, {
      user,
      accessToken,
    })
  );
});

// ─── Login ────────────────────────────────────────────────────────────────────

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { user, accessToken, refreshToken } = await authService.login({
    email,
    password,
  });

  setRefreshTokenCookie(res, refreshToken);

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, AUTH_MESSAGES.LOGIN_SUCCESS, {
      user,
      accessToken,
    })
  );
});

// ─── Logout ───────────────────────────────────────────────────────────────────

export const logout = asyncHandler(async (req, res) => {
  // req.user is attached by the protect middleware
  await authService.logout(req.user._id);

  clearRefreshTokenCookie(res);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, AUTH_MESSAGES.LOGOUT_SUCCESS, null));
});

// ─── Refresh Access Token ─────────────────────────────────────────────────────

export const refreshToken = asyncHandler(async (req, res) => {
  const incomingToken = req.cookies[COOKIE_NAMES.REFRESH_TOKEN];

  const { accessToken, refreshToken: newRefreshToken } =
    await authService.refreshAccessToken(incomingToken);

  setRefreshTokenCookie(res, newRefreshToken);

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, AUTH_MESSAGES.TOKEN_REFRESHED, {
      accessToken,
    })
  );
});

// ─── Get Profile ──────────────────────────────────────────────────────────────

export const getProfile = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user._id);

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, AUTH_MESSAGES.PROFILE_FETCHED, {
      user,
    })
  );
});

// ─── Request Password Reset ───────────────────────────────────────────────────

export const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Email is required");
  }

  const result = await authService.requestPasswordReset(email);

  // Always return success message (prevent account enumeration)
  return res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(
        HTTP_STATUS.OK,
        "If an account with this email exists, a password reset link has been sent.",
        result
      )
    );
});

// ─── Reset Password ───────────────────────────────────────────────────────────

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, token, newPassword, confirmPassword } = req.body;

  if (!email || !token || !newPassword || !confirmPassword) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      "Email, token, new password, and confirm password are required"
    );
  }

  if (newPassword !== confirmPassword) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Passwords do not match");
  }

  if (newPassword.length < 8) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Password must be at least 8 characters long");
  }

  const result = await authService.resetPassword(email, token, newPassword);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, result.message, result));
});
