import { NextResponse } from "next/server";
import { isDbConnected } from "@/server/db";
import { env } from "@/server/config/env";

export async function GET() {
  const dbConnected = isDbConnected();
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    database: {
      provider: "mongodb",
      connected: dbConnected,
      mode: dbConnected ? "live-mongodb" : "memory-fallback-active",
      notice: dbConnected
        ? "Connected to MongoDB instance"
        : "Live MongoDB not reached. Operating in high-fidelity civil in-memory repository.",
    },
    version: "2.0.0-stage2",
  });
}
