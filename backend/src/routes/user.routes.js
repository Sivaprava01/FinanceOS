/**
 * User Routes
 *
 * All routes require authentication via the protect middleware.
 *
 * GET    /api/v1/users/me           - Get own profile
 * PATCH  /api/v1/users/profile      - Update own profile fields
 * PATCH  /api/v1/users/preferences  - Update own preferences
 * DELETE /api/v1/users/me           - Soft delete own account
 * GET    /api/v1/users/:id          - Get user by ID (admin/internal)
 *
 * Route order matters: /me and /profile must come before /:id
 * to prevent Express matching "me" as a dynamic :id parameter.
 */

import express from "express";
import protect from "../middlewares/auth.middleware.js";
import { validateUpdateProfile, validateUpdatePreferences } from "../validations/user.validation.js";
import {
  getMe,
  getUserById,
  updateProfile,
  updatePreferences,
  deleteAccount,
} from "../controllers/user.controller.js";

const router = express.Router();

// All user routes require a valid access token
router.use(protect);

router.get("/me", getMe);
router.patch("/profile", validateUpdateProfile, updateProfile);
router.patch("/preferences", validateUpdatePreferences, updatePreferences);
router.delete("/me", deleteAccount);

// ── Admin/Internal ────────────────────────────────────────────────────────────
// Intentionally placed last — static segments above take precedence over :id
// RBAC will be added in a future phase; for now, any authenticated user can call this
router.get("/:id", getUserById);

export default router;
