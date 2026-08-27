/**
 * Environment Validation
 *
 * Validates that all required environment variables are set.
 * Prevents the server from starting with incomplete configuration.
 */

export function validateEnvironment() {
  const required = [
    "MONGODB_URI",
    "JWT_SECRET",
    "JWT_REFRESH_SECRET",
    "NODE_ENV",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }

  // Production-specific checks
  if (process.env.NODE_ENV === "production") {
    const corsOrigins = (process.env.CORS_ORIGINS || "")
      .split(",")
      .map((o) => o.trim());
    const unsafeOrigins = corsOrigins.filter(
      (o) => o.includes("localhost") || o.includes("127.0.0.1")
    );

    if (unsafeOrigins.length > 0) {
      throw new Error(
        `Production environment cannot have localhost in CORS_ORIGINS: ${unsafeOrigins.join(
          ", "
        )}`
      );
    }

    // Check for weak JWT secrets
    if (process.env.JWT_SECRET.length < 32) {
      throw new Error(
        "JWT_SECRET must be at least 32 characters in production"
      );
    }
    if (process.env.JWT_REFRESH_SECRET.length < 32) {
      throw new Error(
        "JWT_REFRESH_SECRET must be at least 32 characters in production"
      );
    }
  }

  console.log("✅ Environment validation passed");
}
