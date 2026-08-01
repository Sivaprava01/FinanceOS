/**
 * Auth Middleware
 *
 * Protects routes that require an authenticated user.
 * Attaches the verified user document to req.user so controllers
 * can access identity without re-querying the database themselves.
 *
 * Token must be provided as: Authorization: Bearer <token>
 */

import User from "../models/user.model.js";
import { tokenUtils } from "../utils/token.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { HTTP_STATUS, AUTH_MESSAGES } from "../constants/index.js";

/**
 * Extracts and verifies the access token from the Authorization header.
 * Attaches the full user document to req.user on success.
 *
 * Using asyncHandler so any thrown ApiError propagates to the global
 * error handler without needing try/catch in every protected route.
 */
const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, AUTH_MESSAGES.MISSING_TOKEN);
  }

  const token = authHeader.split(" ")[1];

  // Throws ApiError internally if the token is invalid or expired
  const decoded = tokenUtils.verifyAccessToken(token);

  // Re-fetch from DB rather than trusting the JWT payload —
  // ensures deleted or deactivated users are rejected immediately
  const user = await User.findById(decoded._id);

  if (!user) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, AUTH_MESSAGES.UNAUTHORIZED);
  }

  req.user = user;
  next();
});

export default protect;
