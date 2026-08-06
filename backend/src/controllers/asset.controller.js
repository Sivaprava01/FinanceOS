/**
 * Asset Controller
 *
 * Thin layer between asset routes and the asset service.
 * Responsibilities:
 * - Extract validated input from req
 * - Call the appropriate service method
 * - Return a consistent ApiResponse
 *
 * No business logic lives here.
 */

import { assetService } from "../services/asset.service.js";
import { ApiResponse, asyncHandler } from "../utils/index.js";
import { HTTP_STATUS, ASSET_MESSAGES } from "../constants/index.js";

// ─── POST /assets ─────────────────────────────────────────────────────────────

export const createAsset = asyncHandler(async (req, res) => {
  const asset = await assetService.createAsset(req.user._id, req.body);

  return res
    .status(HTTP_STATUS.CREATED)
    .json(new ApiResponse(HTTP_STATUS.CREATED, ASSET_MESSAGES.CREATED, { asset }));
});

// ─── GET /assets/summary ──────────────────────────────────────────────────────

// Declared before /:id so Express does not match "summary" as a dynamic segment
export const getAssetSummary = asyncHandler(async (req, res) => {
  const summary = await assetService.getAssetSummary(req.user._id);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, ASSET_MESSAGES.SUMMARY_FETCHED, { summary }));
});

// ─── GET /assets/net-worth ────────────────────────────────────────────────────

// Declared before /:id for the same reason
export const getNetWorth = asyncHandler(async (req, res) => {
  const netWorth = await assetService.getNetWorth(req.user._id);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, ASSET_MESSAGES.NET_WORTH_FETCHED, { netWorth }));
});

// ─── GET /assets ──────────────────────────────────────────────────────────────

export const getAssets = asyncHandler(async (req, res) => {
  const { category } = req.query;
  const assets = await assetService.getAssets(req.user._id, { category });

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, ASSET_MESSAGES.LIST_FETCHED, { assets }));
});

// ─── GET /assets/:id ──────────────────────────────────────────────────────────

export const getAssetById = asyncHandler(async (req, res) => {
  const asset = await assetService.getAssetById(req.params.id, req.user._id);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, ASSET_MESSAGES.FETCHED, { asset }));
});

// ─── PUT /assets/:id ──────────────────────────────────────────────────────────

export const updateAsset = asyncHandler(async (req, res) => {
  const asset = await assetService.updateAsset(req.params.id, req.user._id, req.body);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, ASSET_MESSAGES.UPDATED, { asset }));
});

// ─── DELETE /assets/:id ───────────────────────────────────────────────────────

export const deleteAsset = asyncHandler(async (req, res) => {
  await assetService.deleteAsset(req.params.id, req.user._id);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, ASSET_MESSAGES.DELETED, null));
});
