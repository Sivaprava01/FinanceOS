/**
 * Express App Configuration
 *
 * Middleware registration order matters:
 * 1. Body parsers  — must come first so controllers can read req.body
 * 2. Cookie parser — must come before auth middleware reads req.cookies
 * 3. CORS          — must come before routes so pre-flight requests are handled
 * 4. Logger        — after CORS so every request (including pre-flights) is logged
 * 5. Routes
 * 6. 404 handler
 * 7. Global error handler — must be last
 */

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import httpLogger from "./middlewares/logger.js";
import errorHandler from "./middlewares/errorHandler.js";
import setupSwagger from "./config/swagger.js";
import { API_PREFIX, CORS_ORIGINS } from "./constants/index.js";
import routes from "./routes/index.js";

const app = express();

// ─── Body Parsers ─────────────────────────────────────────────────────────────

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ limit: "16kb", extended: true }));

// ─── Cookie Parser ────────────────────────────────────────────────────────────

// Required before auth middleware so refresh tokens can be read from cookies
app.use(cookieParser());

// ─── CORS ─────────────────────────────────────────────────────────────────────

app.use(
  cors({
    origin: CORS_ORIGINS,
    credentials: true,                                     // Allow cookies cross-origin
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ─── HTTP Logger ──────────────────────────────────────────────────────────────

app.use(httpLogger);

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use(API_PREFIX, routes);

// ─── Swagger (non-production only) ────────────────────────────────────────────

setupSwagger(app);

// ─── 404 Handler ──────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: "Route not found",
  });
});

// ─── Global Error Handler (must be last) ─────────────────────────────────────

app.use(errorHandler);

export default app;
