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
  let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = err.message || APP_MESSAGES.INTERNAL_ERROR;

  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = Object.values(err.errors || {})
      .map((e) => e.message)
      .join(", ") || err.message;
    console.log("[VALIDATION ERROR DETAILS]", JSON.stringify(err.errors, null, 2));
  } else if (err.name === "CastError") {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = `Invalid ${err.path}: ${err.value}`;
  }

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
