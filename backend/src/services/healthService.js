/**
 * Health Service
 *
 * Handles business logic for health checks.
 */

import { APP_MESSAGES } from "../constants/index.js";

const checkHealth = async () => {
  return {
    status: "OK",
    message: APP_MESSAGES.HEALTH_OK || "Health check successful",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  };
};

export const healthService = {
  checkHealth,
};
