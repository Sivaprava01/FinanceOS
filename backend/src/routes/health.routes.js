/**
 * Health Routes
 * 
 * Defines endpoints for health check
 * Route → Controller → Service → Response
 */

import express from "express";
import { getHealthStatus } from "../controllers/healthController.js";

const router = express.Router();

/**
 * GET /api/v1/health
 * 
 * Returns the health status of the server
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "FinanceOS Backend is running",
 *   "data": {
 *     "success": true,
 *     "message": "FinanceOS Backend is running"
 *   }
 * }
 */
router.get("/health", getHealthStatus);

export default router;
