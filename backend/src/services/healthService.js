/**
 * Health Service
 * 
 * Handles business logic for health checks
 * Responsibility:
 * - Perform health check operations
 * - Return health status
 * 
 * This service can be extended in the future to include:
 * - Database connectivity check
 * - Memory usage monitoring
 * - Uptime tracking
 * - Cache status
 */

import { APP_MESSAGES } from "../constants/index.js";

const checkHealth = async () => {
  // Simple health check - server is running
  // Return empty data object since we just need to confirm server is up
  return {};
};

export const healthService = {
  checkHealth,
};
