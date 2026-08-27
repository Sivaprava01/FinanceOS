/**
 * Express App Configuration
 *
 * Middleware registration order matters:
 * 1. HTTPS Redirect  — redirect HTTP to HTTPS in production
 * 2. Security Headers — helmet must come before routes
 * 3. Input Sanitization — mongo-sanitize prevents NoSQL injection
 * 4. Rate Limiting — auth limiter for auth endpoints, api limiter for others
 * 5. Body parsers  — must come first so controllers can read req.body
 * 6. Cookie parser — must come before auth middleware reads req.cookies
 * 7. CORS          — must come before routes so pre-flight requests are handled
 * 8. Logger        — after CORS so every request (including pre-flights) is logged
 * 9. Routes
 * 10. 404 handler
 * 11. Global error handler — must be last
 */

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import httpLogger from "./middlewares/logger.js";
import errorHandler from "./middlewares/errorHandler.js";
import setupSwagger from "./config/swagger.js";
import initPassport from "./config/passport.js";
import { API_PREFIX, CORS_ORIGINS } from "./constants/index.js";
import routes from "./routes/index.js";

const app = express();

// ─── HTTPS Redirect (Production) ──────────────────────────────────────────────

// Redirect HTTP to HTTPS in production
app.use((req, res, next) => {
  if (process.env.NODE_ENV === "production" && req.header("x-forwarded-proto") !== "https") {
    return res.redirect(`https://${req.header("host")}${req.url}`);
  }
  next();
});

// ─── Security Headers (Helmet) ────────────────────────────────────────────────

// Adds various HTTP headers for security (X-Frame-Options, X-Content-Type-Options, etc.)
app.use(helmet());

// ─── Input Sanitization ───────────────────────────────────────────────────────

// Custom NoSQL injection prevention (simpler than mongo-sanitize)
// Sanitizes $ and . from object keys recursively
const sanitizeNoSQL = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    if (Array.isArray(obj)) return obj.map(sanitize);
    
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const sanitizedKey = key.replace(/^\$|\./, '');
        sanitized[sanitizedKey] = sanitize(obj[key]);
      }
    }
    return sanitized;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);
  next();
};

app.use(sanitizeNoSQL);

// ─── Rate Limiting ────────────────────────────────────────────────────────────

// Auth endpoints: stricter limits (5 attempts per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: "Too many login attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

// API endpoints: moderate limits (100 requests per minute)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: "Too many requests, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === "/health";
  },
});

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
    credentials: true, // Allow cookies cross-origin
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ─── HTTP Logger ──────────────────────────────────────────────────────────────

app.use(httpLogger);

// ─── Apply Rate Limiting ──────────────────────────────────────────────────────

// Auth endpoints get stricter rate limiting
app.use(`${API_PREFIX}/auth`, authLimiter);

// All API endpoints get moderate rate limiting
app.use(API_PREFIX, apiLimiter);

// ─── Passport (OAuth) ─────────────────────────────────────────────────────────

// Must be initialized after body/cookie parsers so req is fully populated
initPassport(app);

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
