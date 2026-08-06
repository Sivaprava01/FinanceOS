/**
 * User Controller
 *
 * Thin layer between user routes and the user service.
 * Responsibilities:
 * - Extract validated input from req
 * - Call the appropriate service method
 * - Return a consistent ApiResponse
 *
 * No business logic lives here.
 */

import { userService } from "../services/user.service.js";
import { ApiResponse, asyncHandler } from "../utils/index.js";
import { HTTP_STATUS, USER_MESSAGES } from "../constants/index.js";

// ─── GET /users/me ────────────────────────────────────────────────────────────

export const getMe = asyncHandler(async (req, res) => {
  const user = await userService.getMe(req.user._id);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, USER_MESSAGES.PROFILE_FETCHED, { user }));
});

// ─── PATCH /users/profile ─────────────────────────────────────────────────────

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user._id, req.body);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, USER_MESSAGES.PROFILE_UPDATED, { user }));
});

// ─── PATCH /users/preferences ─────────────────────────────────────────────────

export const updatePreferences = asyncHandler(async (req, res) => {
  const user = await userService.updatePreferences(req.user._id, req.body);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, USER_MESSAGES.PREFERENCES_UPDATED, { user }));
});

// ─── DELETE /users/me ─────────────────────────────────────────────────────────

export const deleteAccount = asyncHandler(async (req, res) => {
  await userService.deleteAccount(req.user._id);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, USER_MESSAGES.ACCOUNT_DELETED, null));
});

// ─── POST /users/change-password ──────────────────────────────────────────────

export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await userService.changePassword(req.user._id, oldPassword, newPassword);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, "Password changed successfully", { user }));
});

// ─── POST /users/google/link ──────────────────────────────────────────────────

export const linkGoogle = asyncHandler(async (req, res) => {
  const { googleId } = req.body;

  const user = await userService.linkGoogleAccount(req.user._id, googleId);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, "Google account linked successfully", { user }));
});

// ─── POST /users/google/unlink ────────────────────────────────────────────────

export const unlinkGoogle = asyncHandler(async (req, res) => {
  const user = await userService.unlinkGoogleAccount(req.user._id);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, "Google account unlinked successfully", { user }));
});
