/**
 * Auth Routes
 *
 * POST   /api/v1/auth/register           - Create new account
 * POST   /api/v1/auth/login              - Login with email & password
 * POST   /api/v1/auth/logout             - Logout (protected)
 * POST   /api/v1/auth/refresh            - Rotate refresh token
 * GET    /api/v1/auth/me                 - Get current user profile (protected)
 * POST   /api/v1/auth/forgot-password    - Request password reset email
 * POST   /api/v1/auth/reset-password     - Reset password with token
 * GET    /api/v1/auth/google             - Initiate Google OAuth
 * GET    /api/v1/auth/google/callback    - Google OAuth callback
 */

import express from "express";
import passport from "passport";
import protect from "../middlewares/auth.middleware.js";
import { validateRegister, validateLogin } from "../validations/auth.validation.js";
import {
  register,
  login,
  logout,
  refreshToken,
  getProfile,
  requestPasswordReset,
  resetPassword,
} from "../controllers/auth.controller.js";
import { COOKIE_NAMES, COOKIE_OPTIONS, AUTH_MESSAGES } from "../constants/index.js";
import { HTTP_STATUS } from "../constants/index.js";

const router = express.Router();

// ─── Local Auth ───────────────────────────────────────────────────────────────

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.post("/logout", protect, logout);
router.post("/refresh", refreshToken);
router.get("/me", protect, getProfile);

// ─── Password Reset ───────────────────────────────────────────────────────────

router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPassword);

// ─── Google OAuth ─────────────────────────────────────────────────────────────

// Step 1: Redirect user to Google's consent screen
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

// Step 2: Google redirects back with auth code; Passport exchanges it for tokens
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed`,
  }),

  (req, res) => {
    // req.user is the token pair returned by passport strategy's done(null, tokens)
    const { accessToken, refreshToken: newRefreshToken } = req.user;

    const maxAge = parseInt(process.env.JWT_REFRESH_EXPIRE_MS, 10) || 30 * 24 * 60 * 60 * 1000;

    // Set refresh token as HTTP-only cookie — never exposed to the browser
    res.cookie(COOKIE_NAMES.REFRESH_TOKEN, newRefreshToken, {
      ...COOKIE_OPTIONS,
      maxAge,
    });

    // Redirect to frontend dashboard — frontend fetches /me to get user data
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${accessToken}`);
  }
);

export default router;
