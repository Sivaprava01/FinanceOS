/**
 * Database Connection Module
 *
 * Handles MongoDB connection setup with Mongoose
 * The connection must be successful before the server starts
 */

import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    const connectionInstance = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(
      `\n✅ MongoDB Connected Successfully\nDatabase Host: ${connectionInstance.connection.host}\n`
    );

    return connectionInstance;
  } catch (error) {
    console.error(`\n❌ MongoDB Connection Error: ${error.message}\n`);
    console.error("The server cannot start without a database connection.\n");
    process.exit(1);
  }
};

export default connectDB;
