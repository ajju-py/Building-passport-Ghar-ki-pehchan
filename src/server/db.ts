import mongoose from "mongoose";
import { env } from "./config/env";

declare global {
  var mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | undefined;
}

const cached = global.mongooseCache || { conn: null, promise: null };
if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectDb(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose
      .connect(env.MONGODB_URI, opts)
      .then((m) => {
        console.log(`[Database] MongoDB successfully connected to ${env.MONGODB_URI.replace(/\/\/.*@/, "//***:***@")}`);
        return m;
      })
      .catch((err) => {
        cached.promise = null;
        console.warn(`[Database Warning] Unable to connect to MongoDB at ${env.MONGODB_URI}: ${err.message}`);
        console.warn(`[Database Guide] To connect local MongoDB, run 'mongod' or 'docker run -d -p 27017:27017 mongo' or configure MONGODB_URI in .env.local.`);
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
