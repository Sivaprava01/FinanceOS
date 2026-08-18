/**
 * Global Error Handler Middleware
 *
 * This middleware should be registered LAST in the Express app.
 * It catches all errors thrown anywhere in the application
 * and returns a consistent error response format.
 */

import { HTTP_STATUS, APP_MESSAGES } from "../constants/index.js";

const errorHandler = (err, req, res, next) => {
  // Default error properties
  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = err.message || APP_MESSAGES.INTERNAL_ERROR;

  // Log error details (in production, use a proper logging service)
  console.error({
    message,
    statusCode,
    path: req.originalUrl,
    method: req.method,
    stack: err.stack,
  });

  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    statusCode,
    ...(err.errors?.length && { errors: err.errors }),
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export default errorHandler;
