/**
 * Wraps async route handlers and forwards any errors
 * to the global error handling middleware.
 *
 * @param {Function} requestHandler - Async controller function
 * @returns {Function} Express middleware
 */
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch(next);
  };
};

export default asyncHandler;