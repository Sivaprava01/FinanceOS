/**
 * Auth Request Validation
 *
 * Uses express-validator to define validation rule chains.
 * These are applied as middleware in auth routes — if validation
 * fails, the request never reaches the controller.
 *
 * handleValidationErrors must be the last middleware in every
 * validation chain so all field errors are collected before responding.
 */

import { body, validationResult } from "express-validator";
import ApiError from "../utils/ApiError.js";
import { HTTP_STATUS, APP_MESSAGES } from "../constants/index.js";

// ─── Validation Error Handler ─────────────────────────────────────────────────

/**
 * Collects all validation errors from the chain and throws a single
 * ApiError with the full list. This ensures the client receives every
 * problem in one response rather than one error at a time.
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const messages = errors.array().map((err) => err.msg);
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, APP_MESSAGES.INVALID_REQUEST, messages);
  }

  next();
};

// ─── Register ─────────────────────────────────────────────────────────────────

export const validateRegister = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 100 })
    .withMessage("Name cannot exceed 100 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number"),

  handleValidationErrors,
];

// ─── Login ────────────────────────────────────────────────────────────────────

export const validateLogin = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password").notEmpty().withMessage("Password is required"),

  handleValidationErrors,
];
