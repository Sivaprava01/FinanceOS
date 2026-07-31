/**
 * Routes Aggregator
 * 
 * Combines all route modules
 * Central place to register all API routes
 */

import express from "express";
import healthRoutes from "./health.routes.js";

const router = express.Router();

// Register all routes
router.use("/", healthRoutes);

export default router;
