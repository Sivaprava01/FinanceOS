/**
 * FinanceOS Backend - Server Entry Point
 *
 * Initialization Sequence:
 * 1. Load environment variables
 * 2. Connect to MongoDB
 * 3. Start Express server
 * 4. Handle graceful shutdown
 */

import "dotenv/config";
import app from "./app.js";
import connectDB from "./db/index.js";

const PORT = process.env.PORT || 8000;

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB first
    console.log("\n🔄 Connecting to MongoDB...");
    await connectDB();

    // Start Express server
    app.listen(PORT, () => {
      console.log("\n==================================================");
      console.log("FINANCEOS LIVE BACKEND BUILD: DASHBOARD-DEBUG-2026-09-05");
      console.log(`🚀 FinanceOS Backend Server running on http://localhost:${PORT}`);
      console.log(`📍 Health Check: http://localhost:${PORT}/api/v1/health`);
      console.log("==================================================\n");
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
