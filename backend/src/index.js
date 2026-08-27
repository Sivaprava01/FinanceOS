/**
 * FinanceOS Backend - Server Entry Point
 *
 * Initialization Sequence:
 * 1. Load environment variables
 * 2. Validate environment variables
 * 3. Connect to MongoDB
 * 4. Start Express server
 * 5. Handle graceful shutdown
 */

import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./db/index.js";
import { validateEnvironment } from "./utils/validateEnv.js";

// Load environment variables from .env file
dotenv.config();

const PORT = process.env.PORT || 8000;

// Start server
const startServer = async () => {
  try {
    // Validate environment first
    console.log("\n🔍 Validating environment variables...");
    validateEnvironment();

    // Connect to MongoDB
    console.log("🔄 Connecting to MongoDB...");
    await connectDB();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`\n🚀 FinanceOS Backend Server running on http://localhost:${PORT}`);
      console.log(`📍 Health Check: http://localhost:${PORT}/api/v1/health\n`);
    });

    // Graceful shutdown
    process.on("SIGINT", () => {
      console.log("\n\n⛔ Server shutting down gracefully...");
      process.exit(0);
    });
  } catch (error) {
    console.error(`\n❌ Failed to start server: ${error.message}\n`);
    process.exit(1);
  }
};

startServer();
