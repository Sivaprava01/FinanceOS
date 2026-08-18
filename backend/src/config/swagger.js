/**
 * Swagger / OpenAPI Configuration
 *
 * Generates the OpenAPI spec from JSDoc annotations across the codebase.
 * Swagger UI is mounted only in non-production environments — there is
 * no value in exposing the API explorer to the public internet.
 */

import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { API_PREFIX } from "../constants/index.js";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "FinanceOS API",
      version: "1.0.0",
      description: "FinanceOS Backend REST API — Phase 02 Authentication",
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 8000}${API_PREFIX}`,
        description: "Local development server",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your access token",
        },
      },
      schemas: {
        ApiSuccess: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            statusCode: { type: "integer", example: 200 },
            message: { type: "string" },
            data: { type: "object" },
          },
        },
        ApiError: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            statusCode: { type: "integer", example: 400 },
            message: { type: "string" },
            errors: {
              type: "array",
              items: { type: "string" },
            },
          },
        },
        UserProfile: {
          type: "object",
          properties: {
            _id: { type: "string", example: "6649f1..." },
            name: { type: "string", example: "Jane Doe" },
            email: { type: "string", example: "jane@example.com" },
            avatar: { type: "string", nullable: true },
            provider: { type: "string", enum: ["local", "google"] },
            isEmailVerified: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }],
  },
  // Scan these paths for JSDoc @swagger annotations
  apis: ["./src/docs/*.js", "./src/routes/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);

/**
 * Mounts Swagger UI on the Express app.
 * Only active in non-production environments.
 *
 * @param {import("express").Application} app
 */
const setupSwagger = (app) => {
  if (process.env.NODE_ENV === "production") return;

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log(`📖 Swagger UI: http://localhost:${process.env.PORT || 8000}/api-docs`);
};

export default setupSwagger;
