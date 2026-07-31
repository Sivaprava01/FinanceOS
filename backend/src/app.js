/**
 * Express App Configuration
 * 
 * Sets up the Express application with:
 * - Middleware
 * - CORS
 * - Routes
 * - Error handling
 * - Global prefix
 */

import express from "express";
import cors from "cors";
import httpLogger from "./middlewares/logger.js";
import errorHandler from "./middlewares/errorHandler.js";
import { API_PREFIX, CORS_ORIGINS } from "./constants/index.js";
import routes from "./routes/index.js";

const app = express();

// CORS Configuration
// Restrict to specific origins in development
const corsOptions = {
  origin: CORS_ORIGINS,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Middleware: Body parser
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ limit: "16kb", extended: true }));

// Middleware: CORS
app.use(cors(corsOptions));

// Middleware: HTTP Logger
app.use(httpLogger);

// Routes: API v1
app.use(API_PREFIX, routes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    statusCode: 404,
  });
});

// Middleware: Global Error Handler (Must be last)
app.use(errorHandler);

export default app;
