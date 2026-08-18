/**
 * Asset Routes
 *
 * All routes require authentication via the protect middleware.
 *
 * POST   /api/v1/assets             - Create an asset
 * GET    /api/v1/assets             - List all assets (optional ?category=...)
 * GET    /api/v1/assets/summary     - Totals and category breakdown
 * GET    /api/v1/assets/net-worth   - Net worth (assets minus active loan liabilities)
 * GET    /api/v1/assets/:id         - Get a single asset
 * PUT    /api/v1/assets/:id         - Update an asset
 * DELETE /api/v1/assets/:id         - Delete an asset
 *
 * Route order: static segments (/summary, /net-worth) must come before
 * the dynamic /:id segment or Express will match them as IDs.
 */

import express from "express";
import protect from "../middlewares/auth.middleware.js";
import { validateCreateAsset, validateUpdateAsset } from "../validations/asset.validation.js";
import {
  createAsset,
  getAssets,
  getAssetSummary,
  getNetWorth,
  getAssetById,
  updateAsset,
  deleteAsset,
} from "../controllers/asset.controller.js";

const router = express.Router();

// All asset routes require a valid access token
router.use(protect);

router.post("/", validateCreateAsset, createAsset);
router.get("/", getAssets);
router.get("/summary", getAssetSummary);
router.get("/net-worth", getNetWorth);
router.get("/:id", getAssetById);
router.put("/:id", validateUpdateAsset, updateAsset);
router.delete("/:id", deleteAsset);

export default router;
