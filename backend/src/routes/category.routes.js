/**
 * Category Routes
 *
 * All routes require authentication via the protect middleware.
 *
 * POST   /api/v1/categories        - Create a category
 * GET    /api/v1/categories        - List all categories (custom + default)
 * GET    /api/v1/categories/:id    - Get a single category
 * PUT    /api/v1/categories/:id    - Update a category
 * DELETE /api/v1/categories/:id    - Delete a category
 *
 * Route order: static segments must come before dynamic /:id segment.
 */

import express from "express";
import protect from "../middlewares/auth.middleware.js";
import {
  validateCreateCategory,
  validateUpdateCategory,
} from "../validations/category.validation.js";
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";

const router = express.Router();

// All category routes require a valid access token
router.use(protect);

router.post("/", validateCreateCategory, createCategory);
router.get("/", getCategories);
router.get("/:id", getCategoryById);
router.put("/:id", validateUpdateCategory, updateCategory);
router.delete("/:id", deleteCategory);

export default router;
