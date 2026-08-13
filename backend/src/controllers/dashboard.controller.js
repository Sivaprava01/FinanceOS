/**
 * Dashboard Controller
 *
 * Thin layer between dashboard routes and the dashboard service.
 * Responsibilities:
 * - Call the appropriate service method
 * - Return a consistent ApiResponse
 *
 * No business logic lives here. All calculations are in dashboard.service.js.
 */

import { dashboardService } from "../services/dashboard.service.js";
import { ApiResponse, asyncHandler } from "../utils/index.js";
import { HTTP_STATUS, DASHBOARD_MESSAGES } from "../constants/index.js";

// ─── GET /dashboard/overview ──────────────────────────────────────────────────

export const getOverview = asyncHandler(async (req, res) => {
  const overview = await dashboardService.getOverview(req.user._id);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, DASHBOARD_MESSAGES.OVERVIEW_FETCHED, { overview }));
});

// ─── GET /dashboard/spending-analysis ────────────────────────────────────────

export const getSpendingAnalysis = asyncHandler(async (req, res) => {
  const analysis = await dashboardService.getSpendingAnalysis(req.user._id);

  return res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(HTTP_STATUS.OK, DASHBOARD_MESSAGES.SPENDING_ANALYSIS_FETCHED, { analysis })
    );
});

// ─── GET /dashboard/monthly-comparison ───────────────────────────────────────

export const getMonthlyComparison = asyncHandler(async (req, res) => {
  const comparison = await dashboardService.getMonthlyComparison(req.user._id);

  return res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(HTTP_STATUS.OK, DASHBOARD_MESSAGES.MONTHLY_COMPARISON_FETCHED, { comparison })
    );
});

// ─── GET /dashboard/health-score ─────────────────────────────────────────────

export const getHealthScore = asyncHandler(async (req, res) => {
  const healthScore = await dashboardService.getHealthScore(req.user._id);

  return res
    .status(HTTP_STATUS.OK)
    .json(
      new ApiResponse(HTTP_STATUS.OK, DASHBOARD_MESSAGES.HEALTH_SCORE_FETCHED, { healthScore })
    );
});

// ─── GET /dashboard/insights ──────────────────────────────────────────────────

export const getInsights = asyncHandler(async (req, res) => {
  const result = await dashboardService.getInsights(req.user._id);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, DASHBOARD_MESSAGES.INSIGHTS_FETCHED, result));
});
