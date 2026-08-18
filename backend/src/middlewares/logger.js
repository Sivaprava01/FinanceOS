/**
 * HTTP Request Logger Middleware
 *
 * Uses Morgan for logging HTTP requests
 * Provides information about incoming requests and responses
 *
 * Format: 'dev' - Concise output with colors for development
 */

import morgan from "morgan";

// Create and configure morgan logger
const httpLogger = morgan("dev");

export default httpLogger;
