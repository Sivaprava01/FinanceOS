/**
 * Standardized API success response.
 * Every successful response in FinanceOS should use this class.
 */
class ApiResponse {
  constructor(statusCode, message = "Success", data = null) {
    this.success = statusCode >= 200 && statusCode < 300;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }
}

export default ApiResponse;