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
 *   - type: Filter by category type (expense, income, asset, liability)
 * @returns {Promise<Array>} Array of categories
 */
const getCategories = async (userId, options = {}) => {
  const { type } = options;

  const query = {
    userId,
    isCustom: true,
  };

  if (type) {
    const lowerType = type.toLowerCase();
    const titleType = lowerType.charAt(0).toUpperCase() + lowerType.slice(1);
    query.type = { $in: [lowerType, titleType] };
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
    // ─── Income Categories ─────────────────────────────────────────────────────
    { _id: "default-salary", name: "Salary", type: "income", color: "#10b981", icon: "DollarSign", isCustom: false },
    { _id: "default-freelance", name: "Freelance", type: "income", color: "#06b6d4", icon: "Briefcase", isCustom: false },
    { _id: "default-business-income", name: "Business Income", type: "income", color: "#3b82f6", icon: "TrendingUp", isCustom: false },
    { _id: "default-bonus", name: "Bonus", type: "income", color: "#8b5cf6", icon: "Gift", isCustom: false },
    { _id: "default-interest-income", name: "Interest Income", type: "income", color: "#6366f1", icon: "Percent", isCustom: false },
    { _id: "default-dividend", name: "Dividend", type: "income", color: "#14b8a6", icon: "PieChart", isCustom: false },
    { _id: "default-rental-income", name: "Rental Income", type: "income", color: "#84cc16", icon: "Home", isCustom: false },
    { _id: "default-investment-returns", name: "Investment Returns", type: "income", color: "#059669", icon: "TrendingUp", isCustom: false },
    { _id: "default-refund", name: "Refund", type: "income", color: "#0284c7", icon: "RotateCcw", isCustom: false },
    { _id: "default-gift-received", name: "Gift Received", type: "income", color: "#ec4899", icon: "Gift", isCustom: false },
    { _id: "default-other-income", name: "Other Income", type: "income", color: "#6b7280", icon: "MoreHorizontal", isCustom: false },

    // ─── Expense Categories ────────────────────────────────────────────────────
    { _id: "default-groceries", name: "Groceries", type: "expense", color: "#f59e0b", icon: "ShoppingCart", isCustom: false },
    { _id: "default-transportation", name: "Transportation", type: "expense", color: "#3b82f6", icon: "Car", isCustom: false },
    { _id: "default-utilities", name: "Utilities", type: "expense", color: "#8b5cf6", icon: "Zap", isCustom: false },
    { _id: "default-entertainment", name: "Entertainment", type: "expense", color: "#ec4899", icon: "Popcorn", isCustom: false },
    { _id: "default-healthcare", name: "Healthcare", type: "expense", color: "#ef4444", icon: "Heart", isCustom: false },
    { _id: "default-dining", name: "Dining", type: "expense", color: "#f97316", icon: "Coffee", isCustom: false },
    { _id: "default-shopping", name: "Shopping", type: "expense", color: "#06b6d4", icon: "ShoppingBag", isCustom: false },
    { _id: "default-education", name: "Education", type: "expense", color: "#6366f1", icon: "BookOpen", isCustom: false },
    { _id: "default-travel", name: "Travel", type: "expense", color: "#0284c7", icon: "Plane", isCustom: false },
    { _id: "default-insurance", name: "Insurance", type: "expense", color: "#14b8a6", icon: "Shield", isCustom: false },
    { _id: "default-rent", name: "Rent", type: "expense", color: "#d946ef", icon: "Home", isCustom: false },
    { _id: "default-emi", name: "EMI", type: "expense", color: "#f43f5e", icon: "CreditCard", isCustom: false },
    { _id: "default-subscriptions", name: "Subscriptions", type: "expense", color: "#a855f7", icon: "Tv", isCustom: false },
    { _id: "default-personal-care", name: "Personal Care", type: "expense", color: "#fb7185", icon: "Smile", isCustom: false },
    { _id: "default-other-expense", name: "Other Expense", type: "expense", color: "#6b7280", icon: "MoreHorizontal", isCustom: false },

    // ─── Asset Categories ──────────────────────────────────────────────────────
    { _id: "default-bank-account", name: "Bank Account", type: "asset", color: "#3b82f6", icon: "Building", isCustom: false },
    { _id: "default-cash", name: "Cash", type: "asset", color: "#10b981", icon: "Banknote", isCustom: false },
    { _id: "default-savings", name: "Savings", type: "asset", color: "#059669", icon: "PiggyBank", isCustom: false },
    { _id: "default-emergency-fund", name: "Emergency Fund", type: "asset", color: "#06b6d4", icon: "ShieldCheck", isCustom: false },
    { _id: "default-fixed-deposit", name: "Fixed Deposit", type: "asset", color: "#6366f1", icon: "Lock", isCustom: false },
    { _id: "default-stocks", name: "Stocks", type: "asset", color: "#8b5cf6", icon: "TrendingUp", isCustom: false },
    { _id: "default-mutual-funds", name: "Mutual Funds", type: "asset", color: "#a855f7", icon: "Layers", isCustom: false },
    { _id: "default-cryptocurrency", name: "Cryptocurrency", type: "asset", color: "#f59e0b", icon: "Coins", isCustom: false },
    { _id: "default-real-estate", name: "Real Estate", type: "asset", color: "#84cc16", icon: "Home", isCustom: false },
    { _id: "default-gold-silver", name: "Gold / Silver", type: "asset", color: "#eab308", icon: "Award", isCustom: false },
    { _id: "default-vehicle", name: "Vehicle", type: "asset", color: "#0284c7", icon: "Car", isCustom: false },
    { _id: "default-electronics", name: "Electronics", type: "asset", color: "#14b8a6", icon: "Laptop", isCustom: false },
    { _id: "default-other-asset", name: "Other Asset", type: "asset", color: "#6b7280", icon: "MoreHorizontal", isCustom: false },

    // ─── Liability Categories ──────────────────────────────────────────────────
    { _id: "default-credit-card-debt", name: "Credit Card Debt", type: "liability", color: "#ef4444", icon: "CreditCard", isCustom: false },
    { _id: "default-personal-loan", name: "Personal Loan", type: "liability", color: "#f97316", icon: "User", isCustom: false },
    { _id: "default-home-loan", name: "Home Loan", type: "liability", color: "#f43f5e", icon: "Home", isCustom: false },
    { _id: "default-car-loan", name: "Car Loan", type: "liability", color: "#ea580c", icon: "Car", isCustom: false },
    { _id: "default-education-loan", name: "Education Loan", type: "liability", color: "#d97706", icon: "BookOpen", isCustom: false },
    { _id: "default-business-loan", name: "Business Loan", type: "liability", color: "#dc2626", icon: "Briefcase", isCustom: false },
    { _id: "default-emi-liability", name: "EMI Liability", type: "liability", color: "#e11d48", icon: "Clock", isCustom: false },
    { _id: "default-mortgage", name: "Mortgage", type: "liability", color: "#be123c", icon: "Key", isCustom: false },
    { _id: "default-borrowed-money", name: "Borrowed Money", type: "liability", color: "#b91c1c", icon: "HandCoins", isCustom: false },
    { _id: "default-taxes-payable", name: "Taxes Payable", type: "liability", color: "#991b1b", icon: "FileText", isCustom: false },
    { _id: "default-other-liability", name: "Other Liability", type: "liability", color: "#6b7280", icon: "MoreHorizontal", isCustom: false },
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
