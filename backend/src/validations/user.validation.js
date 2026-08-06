/**
 * User Request Validation
 *
 * Validation chains for user profile and preference updates.
 * Re-uses handleValidationErrors from auth.validation.js — same pattern,
 * same error shape, consistent across the entire project.
 *
 * Fields that must never be updated through these endpoints
 * (email, password, provider, googleId, refreshToken, isEmailVerified)
 * are simply not included in the validation chains. Any unknown field
 * sent in the request body is silently ignored by the service layer.
 */

import { body } from "express-validator";
import { handleValidationErrors } from "./auth.validation.js";
import { USER_THEMES } from "../constants/index.js";

// ─── Update Profile ───────────────────────────────────────────────────────────

export const validateUpdateProfile = [
  body("name")
    .optional()
    .trim()
    .notEmpty().withMessage("Name cannot be empty")
    .isLength({ max: 100 }).withMessage("Name cannot exceed 100 characters"),

  body("avatar")
    .optional()
    .trim()
    .isURL().withMessage("Avatar must be a valid URL"),

 body("preferredCurrency")
  .optional()
  .trim()
  .isLength({ min: 3, max: 3 })
  .withMessage("Currency must be a 3-letter ISO 4217 code")
  .isAlpha()
  .withMessage("Currency must contain only letters")
  .toUpperCase(),

  body("preferredCurrency")
    .optional()
    .trim()
    .isLength({ min: 3, max: 3 }).withMessage("Currency must be a 3-letter ISO 4217 code")
    .isAlpha().withMessage("Currency must contain only letters")
    .toUpperCase(),

  body("timeZone")
  .optional()
  .trim()
  .notEmpty()
  .withMessage("Time zone cannot be empty")
  .custom((value) => {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: value });
      return true;
    } catch {
      throw new Error(
        "Time zone must be a valid IANA time zone (e.g. Asia/Kolkata)"
      );
    }
  }),

  // Block any attempt to update protected fields through this endpoint
  body("email").not().exists().withMessage("Email cannot be updated through this endpoint"),
  body("password").not().exists().withMessage("Password cannot be updated through this endpoint"),
  body("provider").not().exists().withMessage("Provider cannot be updated through this endpoint"),
  body("googleId").not().exists().withMessage("Google ID cannot be updated through this endpoint"),
  body("refreshToken").not().exists().withMessage("Refresh token cannot be updated through this endpoint"),
  body("isEmailVerified").not().exists().withMessage("Email verification status cannot be updated through this endpoint"),

  handleValidationErrors,
];

// ─── Update Preferences ───────────────────────────────────────────────────────

export const validateUpdatePreferences = [
  body("language")
    .optional()
    .trim()
    .isLength({ min: 2, max: 10 }).withMessage("Language must be a valid BCP 47 language tag")
    .matches(/^[a-z]{2,3}(-[A-Z]{2,4})?$/).withMessage("Invalid language format (e.g. en, en-US)"),

  body("theme")
    .optional()
    .isIn(USER_THEMES).withMessage(`Theme must be one of: ${USER_THEMES.join(", ")}`),

  body("notifications")
    .optional()
    .isObject().withMessage("Notifications must be an object"),

  body("notifications.email")
    .optional()
    .isBoolean().withMessage("notifications.email must be a boolean"),

  body("notifications.push")
    .optional()
    .isBoolean().withMessage("notifications.push must be a boolean"),

  handleValidationErrors,
];

// ─── Change Password ──────────────────────────────────────────────────────────

export const validateChangePassword = [
  body("oldPassword")
    .notEmpty().withMessage("Current password is required")
    .isString().withMessage("Current password must be a string"),

  body("newPassword")
    .notEmpty().withMessage("New password is required")
    .isLength({ min: 8 }).withMessage("New password must be at least 8 characters")
    .withMessage("New password must be different from current password"),

  handleValidationErrors,
];

// ─── Currency Conversion ──────────────────────────────────────────────────────

export const validateConvertCurrency = [
  body("amount")
    .notEmpty().withMessage("Amount is required")
    .isFloat({ min: 0 }).withMessage("Amount must be a positive number"),

  body("from")
    .notEmpty().withMessage("Source currency is required")
    .isLength({ min: 3, max: 3 }).withMessage("Currency must be a 3-letter code")
    .isAlpha().withMessage("Currency must contain only letters")
    .toUpperCase(),

  body("to")
    .notEmpty().withMessage("Target currency is required")
    .isLength({ min: 3, max: 3 }).withMessage("Currency must be a 3-letter code")
    .isAlpha().withMessage("Currency must contain only letters")
    .toUpperCase(),

  handleValidationErrors,
];

export const validateConvertBatch = [
  body("amounts")
    .isArray({ min: 1 }).withMessage("Amounts must be a non-empty array"),

  body("amounts.*.amount")
    .isFloat({ min: 0 }).withMessage("Each amount must be a positive number"),

  body("amounts.*.currency")
    .optional()
    .isLength({ min: 3, max: 3 }).withMessage("Currency must be a 3-letter code")
    .isAlpha().withMessage("Currency must contain only letters")
    .toUpperCase(),

  body("to")
    .notEmpty().withMessage("Target currency is required")
    .isLength({ min: 3, max: 3 }).withMessage("Currency must be a 3-letter code")
    .isAlpha().withMessage("Currency must contain only letters")
    .toUpperCase(),

  handleValidationErrors,
];
