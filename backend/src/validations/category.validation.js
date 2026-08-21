/**
 * Category Request Validation
 *
 * Validates category creation and update requests.
 * Follows the same pattern as asset.validation.js.
 */

import { body } from "express-validator";
import { handleValidationErrors } from "./auth.validation.js";

const CATEGORY_TYPES = ["Expense", "Income", "Asset", "Liability"];
const HEX_COLOR_REGEX = /^#[0-9A-F]{6}$/i;

// ─── Create Category ──────────────────────────────────────────────────────────

export const validateCreateCategory = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Category name is required")
    .isLength({ min: 1, max: 50 })
    .withMessage("Category name must be between 1 and 50 characters"),

  body("type")
    .optional({ nullable: true })
    .isIn(CATEGORY_TYPES)
    .withMessage(`Category type must be one of: ${CATEGORY_TYPES.join(", ")}`),

  body("color")
    .optional({ nullable: true })
    .matches(HEX_COLOR_REGEX)
    .withMessage("Color must be a valid hex code (e.g., #10b981)"),

  body("icon")
    .optional({ nullable: true })
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Icon name must be between 1 and 50 characters"),

  body("description")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 200 })
    .withMessage("Description cannot exceed 200 characters"),

  handleValidationErrors,
];

// ─── Update Category ──────────────────────────────────────────────────────────

export const validateUpdateCategory = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Category name cannot be empty")
    .isLength({ min: 1, max: 50 })
    .withMessage("Category name must be between 1 and 50 characters"),

  body("type")
    .optional()
    .isIn(CATEGORY_TYPES)
    .withMessage(`Category type must be one of: ${CATEGORY_TYPES.join(", ")}`),

  body("color")
    .optional()
    .matches(HEX_COLOR_REGEX)
    .withMessage("Color must be a valid hex code (e.g., #10b981)"),

  body("icon")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Icon name must be between 1 and 50 characters"),

  body("description")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 200 })
    .withMessage("Description cannot exceed 200 characters"),

  handleValidationErrors,
];
