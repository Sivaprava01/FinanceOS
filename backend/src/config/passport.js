/**
 * Passport Configuration
 *
 * Registers the Google OAuth 2.0 strategy.
 * Called once during server startup — passport.initialize() is NOT
 * added as global middleware because we use JWT (stateless).
 * Passport is used here only for the OAuth handshake, not session management.
 */

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { authService } from "../services/auth.service.js";
import ApiError from "../utils/ApiError.js";
import { HTTP_STATUS, AUTH_MESSAGES } from "../constants/index.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },

    // This verify callback runs after Google returns the user profile.
    // We extract only what we need and delegate to the service.
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

        // authService returns our own token pair — never the Google tokens
        const tokens = await authService.handleGoogleAuth(googleProfile);

        // Pass tokens through to the route callback via done's user argument
        done(null, tokens);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

export default passport;
