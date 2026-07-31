/**
 * ApiError - Custom error class for consistent error handling
 * 
 * Extends the native Error class to include statusCode
 * All errors in the application should throw ApiError
 */

class ApiError extends Error {
  constructor(statusCode, message = "Something went wrong", errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.success = false;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ApiError;
