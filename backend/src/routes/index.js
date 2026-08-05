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
import statementRoutes from "./statement.routes.js";
import transactionRoutes from "./transaction.routes.js";
import loanRoutes from "./loan.routes.js";
import assetRoutes from "./asset.routes.js";

const router = express.Router();

router.use("/", healthRoutes);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/statements", statementRoutes);
router.use("/transactions", transactionRoutes);
router.use("/loans", loanRoutes);
router.use("/assets", assetRoutes);

export default router;
