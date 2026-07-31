/**
 * asyncHandler - Higher-order function to wrap async route handlers
 * 
 * Purpose:
 * - Eliminates the need for try-catch blocks in every controller
 * - Automatically catches errors and passes them to the error handler middleware
 * 
 * Usage:
 * app.get('/route', asyncHandler(async (req, res) => {
 *   // your async code here
 *   // any error thrown will be caught automatically
 * }))
 */

const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export default asyncHandler;
