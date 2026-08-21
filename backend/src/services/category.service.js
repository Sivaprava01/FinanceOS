/**
 * Category Service
 *
 * Handles all business logic for categories.
 *
 * Responsibilities:
 * - Create user categories
 * - Retrieve categories (custom and default)
 * - Update category metadata
 * - Delete user categories
 * - Manage category lifecycle
 *
 * Never touches req or res — receives plain values and returns objects.
 */

import Category from "../models/category.model.js";
import ApiError from "../utils/ApiError.js";
import { HTTP_STATUS } from "../constants/index.js";

// ─── Create Category ──────────────────────────────────────────────────────────

/**
 * Creates a new category for a user.
 *
 * Category names must be unique per user (different users can have same name).
 * Validates that the category name is not already used by this user.
 *
 * @param {string} userId - User's ID
 * @param {string} name - Category name
 * @param {string} type - Category type (Expense, Income, Asset, Liability)
 * @param {string} color - Hex color code (optional, defaults to #10b981)
 * @param {string} icon - Lucide icon name (optional)
 * @param {string} description - Category description (optional)
 * @returns {Promise<object>} Created category
 * @throws {ApiError} If category name already exists for this user or invalid input
 */
const createCategory = async (userId, name, type = "Expense", color, icon, description) => {
  if (!name || !name.trim()) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Category name is required");
  }

  // Check if category with same name already exists for this user
  const existingCategory = await Category.findOne({
    userId,
    name: { $regex: `^${name.trim()}$`, $options: "i" }, // Case-insensitive check
  });

  if (existingCategory) {
    throw new ApiError(HTTP_STATUS.CONFLICT, `Category "${name}" already exists for this user`);
  }

  const category = await Category.create({
    userId,
    name: name.trim(),
    type,
    color: color || "#10b981",
    icon: icon || null,
    description: description || null,
    isCustom: true,
  });

  return formatCategoryResponse(category);
};

// ─── Get Categories ───────────────────────────────────────────────────────────

/**
 * Retrieves all categories for a user (custom only).
 * Can optionally filter by type.
 *
 * @param {string} userId - User's ID
 * @param {object} options - Filter options
 *   - type: Filter by category type (Expense, Income, Asset, Liability)
 * @returns {Promise<Array>} Array of categories
 */
const getCategories = async (userId, options = {}) => {
  const { type } = options;

  const query = {
    userId,
    isCustom: true,
  };

  if (type) {
    query.type = type;
  }

  const categories = await Category.find(query).sort({ name: 1 }).lean();

  return categories.map(formatCategoryResponse);
};

// ─── Get Default Categories ───────────────────────────────────────────────────

/**
 * Returns default/preset categories that appear for all users.
 * These are not stored in DB but computed on demand.
 *
 * @returns {Array} Default categories with standard setup
 */
const getDefaultCategories = () => {
  return [
    // Expense categories
    {
      _id: "default-groceries",
      name: "Groceries",
      type: "Expense",
      color: "#f59e0b",
      icon: "ShoppingCart",
      isCustom: false,
    },
    {
      _id: "default-transportation",
      name: "Transportation",
      type: "Expense",
      color: "#3b82f6",
      icon: "Car",
      isCustom: false,
    },
    {
      _id: "default-utilities",
      name: "Utilities",
      type: "Expense",
      color: "#8b5cf6",
      icon: "Zap",
      isCustom: false,
    },
    {
      _id: "default-entertainment",
      name: "Entertainment",
      type: "Expense",
      color: "#ec4899",
      icon: "Popcorn",
      isCustom: false,
    },
    {
      _id: "default-healthcare",
      name: "Healthcare",
      type: "Expense",
      color: "#ef4444",
      icon: "Heart",
      isCustom: false,
    },
    {
      _id: "default-dining",
      name: "Dining",
      type: "Expense",
      color: "#f97316",
      icon: "Coffee",
      isCustom: false,
    },
    {
      _id: "default-shopping",
      name: "Shopping",
      type: "Expense",
      color: "#06b6d4",
      icon: "ShoppingBag",
      isCustom: false,
    },
    {
      _id: "default-other",
      name: "Other",
      type: "Expense",
      color: "#6b7280",
      icon: "MoreHorizontal",
      isCustom: false,
    },

    // Income categories
    {
      _id: "default-salary",
      name: "Salary",
      type: "Income",
      color: "#10b981",
      icon: "DollarSign",
      isCustom: false,
    },
    {
      _id: "default-freelance",
      name: "Freelance",
      type: "Income",
      color: "#06b6d4",
      icon: "Briefcase",
      isCustom: false,
    },
    {
      _id: "default-investments",
      name: "Investments",
      type: "Income",
      color: "#8b5cf6",
      icon: "TrendingUp",
      isCustom: false,
    },
    {
      _id: "default-other-income",
      name: "Other",
      type: "Income",
      color: "#6b7280",
      icon: "MoreHorizontal",
      isCustom: false,
    },

    // Asset categories (usually not for transactions, but for reference)
    {
      _id: "default-bank",
      name: "Bank Account",
      type: "Asset",
      color: "#3b82f6",
      icon: "Building",
      isCustom: false,
    },
    {
      _id: "default-savings",
      name: "Savings",
      type: "Asset",
      color: "#10b981",
      icon: "PiggyBank",
      isCustom: false,
    },
  ];
};

// ─── Get Category By ID ────────────────────────────────────────────────────────

/**
 * Retrieves a single category by ID.
 * Verifies the category belongs to the user (authorization check).
 *
 * @param {string} categoryId - Category ID
 * @param {string} userId - User's ID (for authorization)
 * @returns {Promise<object>} Category object
 * @throws {ApiError} If not found or doesn't belong to user
 */
const getCategoryById = async (categoryId, userId) => {
  const category = await Category.findOne({
    _id: categoryId,
    userId,
  });

  if (!category) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Category not found");
  }

  return formatCategoryResponse(category);
};

// ─── Update Category ──────────────────────────────────────────────────────────

/**
 * Updates a category's metadata.
 * User can update: name, type, color, icon, description
 *
 * @param {string} categoryId - Category ID
 * @param {string} userId - User's ID (for authorization)
 * @param {object} updateData - Fields to update
 *   - name: string
 *   - type: string (Expense, Income, Asset, Liability)
 *   - color: hex color code
 *   - icon: lucide icon name
 *   - description: string
 * @returns {Promise<object>} Updated category
 * @throws {ApiError} If not found, doesn't belong to user, or invalid input
 */
const updateCategory = async (categoryId, userId, updateData) => {
  const category = await Category.findOne({
    _id: categoryId,
    userId,
  });

  if (!category) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Category not found");
  }

  // If name is being changed, check it's not a duplicate
  if (updateData.name && updateData.name !== category.name) {
    const existingCategory = await Category.findOne({
      userId,
      _id: { $ne: categoryId },
      name: { $regex: `^${updateData.name.trim()}$`, $options: "i" },
    });

    if (existingCategory) {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        `Category "${updateData.name}" already exists for this user`
      );
    }
  }

  // Update allowed fields
  const allowedFields = ["name", "type", "color", "icon", "description"];
  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      category[field] = updateData[field];
    }
  }

  await category.save();

  return formatCategoryResponse(category);
};

// ─── Delete Category ──────────────────────────────────────────────────────────

/**
 * Deletes a category.
 * Only custom categories can be deleted.
 * Note: Transactions referencing this category are not automatically updated.
 *
 * @param {string} categoryId - Category ID
 * @param {string} userId - User's ID (for authorization)
 * @returns {Promise<object>} Deletion confirmation
 * @throws {ApiError} If not found, doesn't belong to user, or is a default category
 */
const deleteCategory = async (categoryId, userId) => {
  const category = await Category.findOne({
    _id: categoryId,
    userId,
  });

  if (!category) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Category not found");
  }

  if (!category.isCustom) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Default categories cannot be deleted");
  }

  const deletedCategory = await Category.findByIdAndDelete(categoryId);

  return {
    _id: deletedCategory._id,
    name: deletedCategory.name,
    message: "Category deleted successfully",
    deletedAt: new Date(),
  };
};

// ─── Helper: Format Response ───────────────────────────────────────────────────

/**
 * Formats a category for API response.
 *
 * @param {object} category - Category document
 * @returns {object} Formatted category
 */
const formatCategoryResponse = (category) => {
  return {
    _id: category._id,
    name: category.name,
    type: category.type,
    color: category.color,
    icon: category.icon,
    isCustom: category.isCustom,
    description: category.description,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
};

// ─── Export Service ────────────────────────────────────────────────────────────

export const categoryService = {
  createCategory,
  getCategories,
  getDefaultCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
