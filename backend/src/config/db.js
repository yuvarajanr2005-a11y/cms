import mongoose from "mongoose";
import { env } from "./env.js";

let memoryServer = null;

export const connectDB = async () => {
  try {
    mongoose.set("strictQuery", false);

    console.log("Connecting to MongoDB at:", env.MONGODB_URI);
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 4000
    });
    console.log("✅ MongoDB connected successfully to", mongoose.connection.host);
  } catch (error) {
    console.warn(`⚠️ Direct MongoDB connection failed (${error.message}). Attempting fallback to in-memory MongoDB...`);
    try {
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      memoryServer = await MongoMemoryServer.create({
        binary: {
          version: process.env.MONGOMS_VERSION || "8.2.6"
        }
      });
      const inMemoryUri = memoryServer.getUri();
      console.log("🚀 Starting MongoDB In-Memory Server at:", inMemoryUri);
      await mongoose.connect(inMemoryUri);
      console.log("✅ Connected to In-Memory MongoDB successfully");
    } catch (memErr) {
      console.error("❌ Fatal: Failed to initialize in-memory MongoDB:", memErr.message);
      process.exit(1);
    }
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    if (memoryServer) {
      await memoryServer.stop();
    }
    console.log("MongoDB disconnected cleanly.");
  } catch (err) {
    console.error("Error during MongoDB disconnection:", err.message);
  }
};
