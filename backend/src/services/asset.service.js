/**
 * Asset Service
 *
 * All asset business logic lives here.
 * Controllers stay thin — they call these methods and return ApiResponse.
 * This service never touches req or res.
 *
 * Net Worth is calculated here by combining:
 *   totalAssets  (sum of all asset currentValues)
 *   totalLiabilities (sum of all active loan outstandingBalances)
 *   netWorth = totalAssets - totalLiabilities
 *
 * Nothing is stored — consistent with the PRD "calculate dynamically" rule.
 */

import Asset from "../models/asset.model.js";
import Loan from "../models/loan.model.js";
import ApiError from "../utils/ApiError.js";
import { HTTP_STATUS, ASSET_MESSAGES, LOAN_STATUS } from "../constants/index.js";

// ─── Response Shape ───────────────────────────────────────────────────────────

/**
 * Builds the public asset payload.
 * Adds gainLoss when both currentValue and purchaseValue are present.
 *
 * @param {object} asset - Mongoose document or plain object
 * @returns {object}
 */
const buildAssetPayload = (asset) => {
  const doc = asset.toObject ? asset.toObject() : asset;

  // Gain/loss is only meaningful when a purchase value was recorded
  const gainLoss =
    doc.purchaseValue !== null && doc.purchaseValue !== undefined
      ? Math.round((doc.currentValue - doc.purchaseValue) * 100) / 100
      : null;

  const gainLossPercent =
    gainLoss !== null && doc.purchaseValue > 0
      ? Math.round((gainLoss / doc.purchaseValue) * 10000) / 100 // 2 dp
      : null;

  return {
    _id:             doc._id,
    assetName:       doc.assetName,
    assetCategory:   doc.assetCategory,
    currentValue:    doc.currentValue,
    purchaseValue:   doc.purchaseValue ?? null,
    purchaseDate:    doc.purchaseDate  ?? null,
    notes:           doc.notes         ?? null,
    gainLoss,
    gainLossPercent,
    createdAt:       doc.createdAt,
    updatedAt:       doc.updatedAt,
  };
};

// ─── Create ───────────────────────────────────────────────────────────────────

/**
 * Creates a new asset for the authenticated user.
 *
 * @param {string} userId
 * @param {object} dto - Validated request body
 * @returns {Promise<object>}
 */
const createAsset = async (userId, dto) => {
  const asset = await Asset.create({ user: userId, ...dto });
  return buildAssetPayload(asset);
};

// ─── List ─────────────────────────────────────────────────────────────────────

/**
 * Returns all assets for the authenticated user.
 * Supports optional category filter.
 *
 * @param {string} userId
 * @param {{ category?: string }} options
 * @returns {Promise<object[]>}
 */
const getAssets = async (userId, { category } = {}) => {
  const query = { user: userId };
  if (category) query.assetCategory = category;

  const assets = await Asset.find(query).sort({ createdAt: -1 }).lean();
  return assets.map(buildAssetPayload);
};

// ─── Get One ──────────────────────────────────────────────────────────────────

/**
 * Returns a single asset by ID, enforcing ownership.
 *
 * @param {string} assetId
 * @param {string} userId
 * @returns {Promise<object>}
 */
const getAssetById = async (assetId, userId) => {
  const asset = await Asset.findById(assetId);

  if (!asset) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, ASSET_MESSAGES.NOT_FOUND);
  }

  if (asset.user.toString() !== userId.toString()) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, ASSET_MESSAGES.FORBIDDEN);
  }

  return buildAssetPayload(asset);
};

// ─── Update ───────────────────────────────────────────────────────────────────

/**
 * Updates an asset's fields. Ownership verified before any write.
 *
 * @param {string} assetId
 * @param {string} userId
 * @param {object} dto - Validated update fields
 * @returns {Promise<object>}
 */
const updateAsset = async (assetId, userId, dto) => {
  const asset = await Asset.findById(assetId);

  if (!asset) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, ASSET_MESSAGES.NOT_FOUND);
  }

  if (asset.user.toString() !== userId.toString()) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, ASSET_MESSAGES.FORBIDDEN);
  }

  const updated = await Asset.findByIdAndUpdate(
    assetId,
    { $set: dto },
    { new: true, runValidators: true }
  );

  return buildAssetPayload(updated);
};

// ─── Delete ───────────────────────────────────────────────────────────────────

/**
 * Permanently removes an asset document.
 * Assets are hard-deleted — no financial records reference them.
 *
 * @param {string} assetId
 * @param {string} userId
 * @returns {Promise<void>}
 */
const deleteAsset = async (assetId, userId) => {
  const asset = await Asset.findById(assetId);

  if (!asset) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, ASSET_MESSAGES.NOT_FOUND);
  }

  if (asset.user.toString() !== userId.toString()) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, ASSET_MESSAGES.FORBIDDEN);
  }

  await Asset.findByIdAndDelete(assetId);
};

// ─── Asset Summary ────────────────────────────────────────────────────────────

/**
 * Aggregates all assets by category and returns totals.
 * Dynamically calculated — nothing stored.
 *
 * @param {string} userId
 * @returns {Promise<object>}
 */
const getAssetSummary = async (userId) => {
  const assets = await Asset.find({ user: userId }).lean();

  const totalAssets    = assets.length;
  const totalValue     = assets.reduce((sum, a) => sum + a.currentValue, 0);

  // Group total value by category for the breakdown
  const byCategory = {};
  for (const asset of assets) {
    byCategory[asset.assetCategory] =
      (byCategory[asset.assetCategory] ?? 0) + asset.currentValue;
  }

  // Round category values to 2 dp
  for (const key of Object.keys(byCategory)) {
    byCategory[key] = Math.round(byCategory[key] * 100) / 100;
  }

  return {
    totalAssets,
    totalValue:  Math.round(totalValue  * 100) / 100,
    byCategory,
  };
};

// ─── Net Worth ────────────────────────────────────────────────────────────────

/**
 * Calculates the user's net worth.
 *
 * Formula:
 *   totalAssets      = sum of all asset currentValues
 *   totalLiabilities = sum of outstandingBalance for all ACTIVE loans
 *   netWorth         = totalAssets - totalLiabilities
 *
 * Only active loans are liabilities — closed loans are settled debts and
 * no longer reduce net worth.
 *
 * Both Asset and Loan models are queried here. The asset service is the
 * correct owner of this calculation because Net Worth is fundamentally an
 * asset-side concept (assets minus liabilities = owner's equity).
 *
 * @param {string} userId
 * @returns {Promise<object>}
 */
const getNetWorth = async (userId) => {
  // Run both queries in parallel — they are independent
  const [assets, loans] = await Promise.all([
    Asset.find({ user: userId }).lean(),
    Loan.find({ user: userId, loanStatus: LOAN_STATUS.ACTIVE }).lean(),
  ]);

  const totalAssets = assets.reduce((sum, a) => sum + a.currentValue, 0);
  const totalLiabilities = loans.reduce((sum, l) => sum + l.outstandingBalance, 0);
  const netWorth = totalAssets - totalLiabilities;

  // Asset breakdown by category
  const assetBreakdown = {};
  for (const asset of assets) {
    assetBreakdown[asset.assetCategory] =
      (assetBreakdown[asset.assetCategory] ?? 0) + asset.currentValue;
  }
  for (const key of Object.keys(assetBreakdown)) {
    assetBreakdown[key] = Math.round(assetBreakdown[key] * 100) / 100;
  }

  return {
    totalAssets:       Math.round(totalAssets       * 100) / 100,
    totalLiabilities:  Math.round(totalLiabilities  * 100) / 100,
    netWorth:          Math.round(netWorth           * 100) / 100,
    assetCount:        assets.length,
    activeLoanCount:   loans.length,
    assetBreakdown,
  };
};

// ─── Exports ──────────────────────────────────────────────────────────────────

export const assetService = {
  createAsset,
  getAssets,
  getAssetById,
  updateAsset,
  deleteAsset,
  getAssetSummary,
  getNetWorth,
};
