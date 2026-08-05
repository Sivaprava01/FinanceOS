/**
 * Application Constants
 *
 * Only truly immutable values live here — things that never change
 * regardless of environment (cookie names, provider identifiers, etc.)
 *
 * Values that vary by environment (secrets, expiry durations, URLs)
 * belong in .env, not here.
 */

// ─── HTTP ────────────────────────────────────────────────────────────────────

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

// ─── Routing ─────────────────────────────────────────────────────────────────

export const API_PREFIX = "/api/v1";

// ─── CORS ────────────────────────────────────────────────────────────────────

export const CORS_ORIGINS = process.env.CORS_ORIGINS?.split(",") || [
  "http://localhost:3000",
  "http://localhost:3001",
];

// ─── Cookies ─────────────────────────────────────────────────────────────────

export const COOKIE_NAMES = {
  // HTTP-only cookie that carries the refresh token
  REFRESH_TOKEN: "fos_rt",
};

export const COOKIE_OPTIONS = {
  // Shared base options for all auth cookies
  httpOnly: true,                                  // Never accessible via JS
  secure: process.env.NODE_ENV === "production",   // HTTPS-only in production
  sameSite: "strict",                              // CSRF protection
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const AUTH_PROVIDERS = {
  LOCAL: "local",
  GOOGLE: "google",
  
};

// ─── Messages ────────────────────────────────────────────────────────────────

export const APP_MESSAGES = {
  SERVER_RUNNING: "FinanceOS Backend is running",
  HEALTH_CHECK: "Health check successful",
  INTERNAL_ERROR: "An unexpected error occurred. Please try again later.",
  NOT_FOUND: "Resource not found",
  INVALID_REQUEST: "Invalid request parameters",
};

export const AUTH_MESSAGES = {
  REGISTER_SUCCESS: "Account created successfully",
  LOGIN_SUCCESS: "Logged in successfully",
  LOGOUT_SUCCESS: "Logged out successfully",
  TOKEN_REFRESHED: "Access token refreshed",
  PROFILE_FETCHED: "Profile fetched successfully",

  // Error messages
  INVALID_CREDENTIALS: "Invalid email or password",
  EMAIL_ALREADY_EXISTS: "An account with this email already exists",
  USER_NOT_FOUND: "User not found",
  UNAUTHORIZED: "Authentication required",
  INVALID_TOKEN: "Invalid or expired token",
  MISSING_TOKEN: "No token provided",
  GOOGLE_AUTH_FAILED: "Google authentication failed",
  ACCOUNT_DELETED: "This account has been deleted",
};
export const USER_MESSAGES = {
  // Success messages
  PROFILE_FETCHED: "Profile fetched successfully",
  PROFILE_UPDATED: "Profile updated successfully",
  PREFERENCES_UPDATED: "Preferences updated successfully",
  ACCOUNT_DELETED: "Account deleted successfully",

  // Error messages
  USER_NOT_FOUND: "User not found",
  FORBIDDEN: "You do not have permission to perform this action",
  ACCOUNT_DELETED_ERROR: "This account has been deleted",
};

// Immutable allowed values — used in validation and schema enum
export const USER_THEMES = ["light", "dark", "system"];

// ─── Loan ─────────────────────────────────────────────────────────────────────

export const LOAN_STATUS = {
  ACTIVE: "Active",
  CLOSED: "Closed",
};

export const LOAN_TYPES = [
  "Home Loan",
  "Car Loan",
  "Personal Loan",
  "Education Loan",
  "Business Loan",
  "Gold Loan",
  "Other",
];

export const LOAN_MESSAGES = {
  CREATED: "Loan created successfully",
  FETCHED: "Loan fetched successfully",
  LIST_FETCHED: "Loans fetched successfully",
  UPDATED: "Loan updated successfully",
  DELETED: "Loan deleted successfully",
  SUMMARY_FETCHED: "Loan summary fetched successfully",

  NOT_FOUND: "Loan not found",
  FORBIDDEN: "You do not have permission to access this loan",
};



// Immutable allowed values — used in validation and schema enum

