/**
 * Health Controller
 *
 * Handles health check requests
 * Responsibility:
 * - Receive request
 * - Call service
 * - Return response
 */

import { healthService } from "../services/healthService.js";
import { ApiResponse, asyncHandler } from "../utils/index.js";
import { HTTP_STATUS } from "../constants/index.js";

// Get health status
export const getHealthStatus = asyncHandler(async (req, res) => {
  const healthStatus = await healthService.checkHealth();

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, healthStatus.message, healthStatus));
});
