/**
 * Dashboard Routes
 *
 * All routes require authentication via the protect middleware.
 *
 * GET /api/v1/dashboard/overview            - Key figures for current month
 * GET /api/v1/dashboard/spending-analysis   - Category breakdown + trends
 * GET /api/v1/dashboard/monthly-comparison  - Current vs previous month
 * GET /api/v1/dashboard/health-score        - 0–100 financial health score
 * GET /api/v1/dashboard/insights            - Rule-based natural-language insights
 */

import express from "express";
import protect from "../middlewares/auth.middleware.js";
import {
  getOverview,
  getSpendingAnalysis,
  getMonthlyComparison,
  getHealthScore,
  getInsights,
} from "../controllers/dashboard.controller.js";

const router = express.Router();

// All dashboard routes require a valid access token
router.use(protect);

// Dynamic user-specific dashboard data must never be cached by browser/proxies
router.use((req, res, next) => {
  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
    "Surrogate-Control": "no-store",
  });
  // Strip conditional headers to prevent stale 304 Not Modified
  delete req.headers["if-none-match"];
  delete req.headers["if-modified-since"];
  next();
});

router.get("/overview", getOverview);
router.get("/spending-analysis", getSpendingAnalysis);
router.get("/monthly-comparison", getMonthlyComparison);
router.get("/health-score", getHealthScore);
router.get("/insights", getInsights);

export default router;
