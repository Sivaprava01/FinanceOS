/**
 * ApiResponse - Standard response format for all successful API responses
 * 
 * Format:
 * {
 *   success: boolean,
 *   message: string,
 *   data: any
 * }
 */

class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}

export default ApiResponse;
