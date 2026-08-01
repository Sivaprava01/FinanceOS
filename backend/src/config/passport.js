/**
 * Passport Configuration
 *
 * Exports an `initPassport` function rather than registering the strategy
 * at module load time. This prevents Passport from throwing at import
 * when GOOGLE_CLIENT_ID is not yet available in the environment.
 *
 * Call initPassport(app) once in app.js after dotenv has loaded.
 *
 * Note: passport.initialize() middleware is NOT added globally.
 * We use JWT for session management — Passport is used only for the
 * OAuth handshake on the /auth/google routes.
 */

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { authService } from "../services/auth.service.js";
import ApiError from "../utils/ApiError.js";
import { HTTP_STATUS, AUTH_MESSAGES } from "../constants/index.js";

/**
 * Registers the Google OAuth strategy and mounts passport.initialize()
 * on the provided Express app.
 *
 * @param {import("express").Application} app
 */
const initPassport = (app) => {
  // Skip registration if Google credentials are not configured.
  // This prevents crashes in test/CI environments where OAuth is not needed.
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn("⚠️  Google OAuth credentials not set — /auth/google routes will be unavailable.");
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },

      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const googleProfile = {
            googleId: profile.id,
            email: profile.emails?.[0]?.value,
            name: profile.displayName,
            avatar: profile.photos?.[0]?.value ?? null,
          };

          if (!googleProfile.email) {
            return done(
              new ApiError(HTTP_STATUS.BAD_REQUEST, AUTH_MESSAGES.GOOGLE_AUTH_FAILED),
              null
            );
          }

          const tokens = await authService.handleGoogleAuth(googleProfile);
          done(null, tokens);
        } catch (error) {
          done(error, null);
        }
      }
    )
  );

  // Minimal initialization — only what OAuth routes need
  app.use(passport.initialize());
};

export default initPassport;
