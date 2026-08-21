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
import categoryRoutes from "./category.routes.js";
import loanRoutes from "./loan.routes.js";
import assetRoutes from "./asset.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import familyRoutes from "./family.routes.js";
import currencyRoutes from "./currency.routes.js";

const router = express.Router();

router.use("/", healthRoutes);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/statements", statementRoutes);
router.use("/transactions", transactionRoutes);
router.use("/categories", categoryRoutes);
router.use("/loans", loanRoutes);
router.use("/assets", assetRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/families", familyRoutes);
router.use("/currencies", currencyRoutes);

export default router;
