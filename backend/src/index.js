/**
 * FinanceOS Backend - Server Entry Point
 *
 * Initialization Sequence:
 * 1. Load environment variables
 * 2. Initialize email service
 * 3. Connect to MongoDB
 * 4. Start Express server
 * 5. Handle graceful shutdown
 */

import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./db/index.js";

// Load environment variables from .env file FIRST (before any other imports)
dotenv.config();

// Then initialize mail service (after env vars are loaded)
await import("./services/mail.service.js");

const PORT = process.env.PORT || 8000;

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB first
    console.log("\n🔄 Connecting to MongoDB...");
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
