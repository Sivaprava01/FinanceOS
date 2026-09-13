/**
 * Passport Configuration
 *
 * Exports an `initPassport` function rather than registering the strategy
 * at module load time. This prevents Passport from throwing at import
 * when GOOGLE_CLIENT_ID is not yet available in the environment.
 *
 * Call initPassport(app) once in app.js after dotenv has loaded.
 */

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { authService } from "../services/auth.service.js";
import ApiError from "../utils/ApiError.js";
import { HTTP_STATUS, AUTH_MESSAGES } from "../constants/index.js";

/**
 * Checks if Google OAuth has genuine credentials configured (not placeholders or empty).
 * @returns {boolean}
 */
export const isGoogleOAuthConfigured = () => {
  const id = process.env.GOOGLE_CLIENT_ID;
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  return Boolean(
    id &&
    secret &&
    !id.includes("your_google_client_id") &&
    !id.includes("your_client_id") &&
    !secret.includes("your_google_client_secret") &&
    !secret.includes("your_client_secret")
  );
};

/**
 * Registers the Google OAuth strategy and mounts passport.initialize()
 * on the provided Express app.
 *
 * @param {import("express").Application} app
 */
const initPassport = (app) => {
  // Always mount passport.initialize so passport middleware is attached
  app.use(passport.initialize());

  if (!isGoogleOAuthConfigured()) {
    console.warn("⚠️  Google OAuth credentials not set or contain placeholder values — /auth/google routes will gracefully notify users.");
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:8000/api/v1/auth/google/callback",
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
};

export default initPassport;

