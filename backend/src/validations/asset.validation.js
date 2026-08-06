/**
 * Asset Request Validation
 *
 * Follows the same pattern as loan.validation.js.
 * Chains terminated by handleValidationErrors from auth.validation.js.
 */

import { body } from "express-validator";
import { handleValidationErrors } from "./auth.validation.js";
import { ASSET_CATEGORIES } from "../constants/index.js";

// ─── Create Asset ─────────────────────────────────────────────────────────────

export const validateCreateAsset = [
  body("assetName")
    .trim()
    .notEmpty().withMessage("Asset name is required")
    .isLength({ max: 100 }).withMessage("Asset name cannot exceed 100 characters"),

  body("assetCategory")
    .notEmpty().withMessage("Asset category is required")
    .isIn(ASSET_CATEGORIES)
    .withMessage(`Asset category must be one of: ${ASSET_CATEGORIES.join(", ")}`),

  body("currentValue")
    .notEmpty().withMessage("Current value is required")
    .isFloat({ min: 0 }).withMessage("Current value cannot be negative"),

  body("purchaseValue")
    .optional({ nullable: true })
    .isFloat({ min: 0 }).withMessage("Purchase value cannot be negative"),

  body("purchaseDate")
    .optional({ nullable: true })
    .isISO8601().withMessage("Purchase date must be a valid date"),

  body("notes")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 }).withMessage("Notes cannot exceed 500 characters"),

  handleValidationErrors,
];

// ─── Update Asset ─────────────────────────────────────────────────────────────

export const validateUpdateAsset = [
  body("assetName")
    .optional()
    .trim()
    .notEmpty().withMessage("Asset name cannot be empty")
    .isLength({ max: 100 }).withMessage("Asset name cannot exceed 100 characters"),

  body("assetCategory")
    .optional()
    .isIn(ASSET_CATEGORIES)
    .withMessage(`Asset category must be one of: ${ASSET_CATEGORIES.join(", ")}`),

  body("currentValue")
    .optional()
    .isFloat({ min: 0 }).withMessage("Current value cannot be negative"),

  body("purchaseValue")
    .optional({ nullable: true })
    .isFloat({ min: 0 }).withMessage("Purchase value cannot be negative"),

  body("purchaseDate")
    .optional({ nullable: true })
    .isISO8601().withMessage("Purchase date must be a valid date"),

  body("notes")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 }).withMessage("Notes cannot exceed 500 characters"),

  handleValidationErrors,
];
