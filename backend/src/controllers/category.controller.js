/**
 * Category Controller
 *
 * Thin layer between routes and category service.
 * Responsibilities:
 * - Extract request data
 * - Call service methods
 * - Return ApiResponse
 *
 * No business logic here. All logic is in categoryService.
 */

import { categoryService } from "../services/category.service.js";
import { ApiResponse, asyncHandler } from "../utils/index.js";
import { HTTP_STATUS } from "../constants/index.js";

// ─── Create Category ──────────────────────────────────────────────────────────

/**
 * Creates a new category for the authenticated user.
 *
 * Route: POST /api/v1/categories
 * Protected: Yes
 * Body: { name, type?, color?, icon?, description? }
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export const createCategory = asyncHandler(async (req, res) => {
  const { user } = req;
  const { name, type, color, icon, description } = req.body;

  const category = await categoryService.createCategory(
    user._id,
    name,
    type,
    color,
    icon,
    description
  );

  return res
    .status(HTTP_STATUS.CREATED)
    .json(new ApiResponse(HTTP_STATUS.CREATED, "Category created successfully", category));
});

// ─── Get Categories ───────────────────────────────────────────────────────────

/**
 * Retrieves all categories for the authenticated user.
 * Combines custom user categories with default categories.
 *
 * Route: GET /api/v1/categories
 * Protected: Yes
 * Query Params: type? (filter by type: Expense, Income, Asset, Liability)
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export const getCategories = asyncHandler(async (req, res) => {
  const { user } = req;
  const { type } = req.query;

  // Get custom categories
  const customCategories = await categoryService.getCategories(user._id, { type });

  // Get default categories (optionally filtered by type)
  const defaultCategories = categoryService
    .getDefaultCategories()
    .filter((cat) => !type || cat.type === type);

  // Combine: custom categories first, then defaults
  const allCategories = [...customCategories, ...defaultCategories];

  return res.status(HTTP_STATUS.OK).json(
    new ApiResponse(HTTP_STATUS.OK, "Categories retrieved successfully", {
      categories: allCategories,
      count: allCategories.length,
      custom: customCategories.length,
      default: defaultCategories.length,
    })
  );
});

// ─── Get Category By ID ────────────────────────────────────────────────────────

/**
 * Retrieves a single category by ID.
 *
 * Route: GET /api/v1/categories/:id
 * Protected: Yes
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export const getCategoryById = asyncHandler(async (req, res) => {
  const { user } = req;
  const { id } = req.params;

  const category = await categoryService.getCategoryById(id, user._id);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, "Category retrieved successfully", category));
});

// ─── Update Category ──────────────────────────────────────────────────────────

/**
 * Updates a category's metadata.
 *
 * Route: PUT /api/v1/categories/:id
 * Protected: Yes
 * Body: { name?, type?, color?, icon?, description? }
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export const updateCategory = asyncHandler(async (req, res) => {
  const { user } = req;
  const { id } = req.params;
  const updateData = req.body;

  const updated = await categoryService.updateCategory(id, user._id, updateData);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, "Category updated successfully", updated));
});

// ─── Delete Category ──────────────────────────────────────────────────────────

/**
 * Deletes a category.
 * Only custom categories can be deleted.
 *
 * Route: DELETE /api/v1/categories/:id
 * Protected: Yes
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export const deleteCategory = asyncHandler(async (req, res) => {
  const { user } = req;
  const { id } = req.params;

  const result = await categoryService.deleteCategory(id, user._id);

  return res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(HTTP_STATUS.OK, "Category deleted successfully", result));
});
