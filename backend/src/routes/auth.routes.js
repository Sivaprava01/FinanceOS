/**
 * Auth Routes
 *
 * POST   /api/v1/auth/register           - Create new account
 * POST   /api/v1/auth/login              - Login with email & password
 * POST   /api/v1/auth/logout             - Logout (protected)
 * POST   /api/v1/auth/refresh            - Rotate refresh token
 * GET    /api/v1/auth/me                 - Get current user profile (protected)
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
} from "../controllers/auth.controller.js";
import { COOKIE_NAMES, COOKIE_OPTIONS } from "../constants/index.js";

import { isGoogleOAuthConfigured } from "../config/passport.js";

const router = express.Router();

// ─── Local Auth ───────────────────────────────────────────────────────────────

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.post("/logout", protect, logout);
router.post("/refresh", refreshToken);
router.get("/me", protect, getProfile);

// ─── Google OAuth ─────────────────────────────────────────────────────────────

// Guard: verify that Google credentials are configured before delegating to Passport
const ensureGoogleOAuthConfigured = (req, res, next) => {
  if (!isGoogleOAuthConfigured()) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    return res.redirect(`${frontendUrl}/login?error=google_oauth_not_configured`);
  }
  next();
};

// Step 1: Redirect user to Google's consent screen
router.get(
  "/google",
  ensureGoogleOAuthConfigured,
  (req, res, next) => {
    passport.authenticate("google", {
      scope: ["profile", "email"],
      session: false,
    })(req, res, next);
  }
);

// Step 2: Google redirects back with auth code; Passport exchanges it for tokens
router.get(
  "/google/callback",
  ensureGoogleOAuthConfigured,
  (req, res, next) => {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    passport.authenticate("google", {
      session: false,
      failureRedirect: `${frontendUrl}/login?error=google_auth_failed`,
    })(req, res, next);
  },

  (req, res) => {
    // req.user is the token pair returned by passport strategy's done(null, tokens)
    const { accessToken, refreshToken: newRefreshToken } = req.user;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    const maxAge = parseInt(process.env.JWT_REFRESH_EXPIRE_MS, 10) || 30 * 24 * 60 * 60 * 1000;

    // Set refresh token as HTTP-only cookie — never exposed to the browser
    res.cookie(COOKIE_NAMES.REFRESH_TOKEN, newRefreshToken, {
      ...COOKIE_OPTIONS,
      maxAge,
    });

    // Redirect to frontend auth callback handler with accessToken
    res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}`);
  }
);

export default router;
