/**
 * Routes Aggregator
 *
 * Central registration point for all API route modules.
 * Add new modules here as the application grows.
 */

import express from "express";
import healthRoutes from "./health.routes.js";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";

const router = express.Router();

router.use("/", healthRoutes);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);

export default router;
