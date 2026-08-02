/**
 * User Routes
 *
 * All routes require authentication via the protect middleware.
 *
 * GET    /api/v1/users/me           - Get own profile
 * PATCH  /api/v1/users/profile      - Update own profile fields
 * PATCH  /api/v1/users/preferences  - Update own preferences
 * DELETE /api/v1/users/me           - Soft delete own account
 * GET    /api/v1/users/:id          - Reserved for admin — not yet implemented
 */

import express from "express";
import protect from "../middlewares/auth.middleware.js";
import { validateUpdateProfile, validateUpdatePreferences } from "../validations/user.validation.js";
import {
  getMe,
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

// ── Reserved: GET /:id ────────────────────────────────────────────────────────
// Admin-only endpoint — requires RBAC which is not yet implemented.
// Returns 501 so consumers know the endpoint is intentionally unavailable,
// not missing. Will be gated behind an admin role middleware in a future phase.
router.get("/:id", (req, res) => {
  res.status(501).json({
    success: false,
    statusCode: 501,
    message: "Not implemented. This endpoint requires admin access which is not yet available.",
  });
});

export default router;
