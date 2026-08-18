/**
 * Family Validation
 *
 * Request body validation for family-related endpoints.
 * Uses basic checks here; complex authorization happens in the service layer.
 */

import { ApiError } from "../utils/index.js";
import { HTTP_STATUS } from "../constants/index.js";

/**
 * Validates family creation request
 * @param {object} req
 * @throws {ApiError}
 */
export const validateCreateFamily = (req) => {
  const { familyName, description } = req.body;

  if (!familyName || typeof familyName !== "string" || familyName.trim().length === 0) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      "Family name is required and must be a non-empty string"
    );
  }

  if (familyName.length > 100) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Family name cannot exceed 100 characters");
  }

  if (description && typeof description !== "string") {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Description must be a string");
  }

  if (description && description.length > 500) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Description cannot exceed 500 characters");
  }
};

/**
 * Validates family update request
 * @param {object} req
 * @throws {ApiError}
 */
export const validateUpdateFamily = (req) => {
  const { familyName, description } = req.body;

  if (familyName !== undefined) {
    if (typeof familyName !== "string" || familyName.trim().length === 0) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Family name must be a non-empty string");
    }

    if (familyName.length > 100) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Family name cannot exceed 100 characters");
    }
  }

  if (description !== undefined) {
    if (typeof description !== "string") {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Description must be a string");
    }

    if (description.length > 500) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Description cannot exceed 500 characters");
    }
  }
};

/**
 * Validates invitation send request
 * @param {object} req
 * @throws {ApiError}
 */
export const validateSendInvitation = (req) => {
  const { invitedEmail } = req.body;

  if (!invitedEmail || typeof invitedEmail !== "string") {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Invited email is required and must be a string");
  }

  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(invitedEmail)) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Please provide a valid email address");
  }
};

/**
 * Validates sharing preferences update request
 * @param {object} req
 * @throws {ApiError}
 */
export const validateUpdateSharing = (req) => {
  const { shareTransactions, shareAssets, shareLoans, shareNetWorth, shareEverything } = req.body;

  // All should be booleans if provided
  const fields = {
    shareTransactions,
    shareAssets,
    shareLoans,
    shareNetWorth,
    shareEverything,
  };

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && typeof value !== "boolean") {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, `${key} must be a boolean`);
    }
  }

  // At least one field must be provided
  if (Object.values(fields).every((v) => v === undefined)) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "At least one sharing preference must be provided");
  }
};

/**
 * Validates MongoDB ObjectId format
 * @param {string} id
 * @throws {ApiError}
 */
export const validateObjectId = (id, fieldName = "ID") => {
  const objectIdRegex = /^[0-9a-f]{24}$/i;
  if (!objectIdRegex.test(id)) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, `Invalid ${fieldName} format`);
  }
};
