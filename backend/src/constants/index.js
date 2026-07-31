/**
 * Application Constants
 * 
 * Centralized constants used across the application
 * Update these values in one place instead of scattered throughout the code
 */

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

export const API_PREFIX = "/api/v1";

export const CORS_ORIGINS = process.env.CORS_ORIGINS?.split(",") || [
  "http://localhost:3000",
  "http://localhost:3001",
];

export const APP_MESSAGES = {
  SERVER_RUNNING: "FinanceOS Backend is running",
  HEALTH_CHECK: "Health check successful",
  INTERNAL_ERROR: "An unexpected error occurred. Please try again later.",
  NOT_FOUND: "Resource not found",
  INVALID_REQUEST: "Invalid request parameters",
};
