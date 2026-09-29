import dotenv from "dotenv";
import path from "node:path";

// Load environment variables
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

export const env = {
  PORT: parseInt(process.env.PORT || "5000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/building_passport",
  JWT_SECRET: process.env.JWT_SECRET || "building-passport-default-secret-key-32-chars-long",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api",
  STORAGE_DRIVER: process.env.STORAGE_DRIVER || "local",
  UPLOAD_DIR: path.resolve(process.cwd(), process.env.UPLOAD_DIR || "uploads"),
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB || "25", 10),
};
