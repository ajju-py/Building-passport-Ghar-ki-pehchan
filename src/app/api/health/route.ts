import { NextResponse } from "next/server";
import { isDbConnected } from "@/server/db";
import { checkPostgresHealth } from "@/server/db/postgres";
import { env } from "@/server/config/env";

export async function GET() {
  const dbConnected = isDbConnected();
  const pgHealth = await checkPostgresHealth();

  return NextResponse.json({
    status: pgHealth.connected ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    database: {
      provider: "postgresql",
      connected: pgHealth.connected,
      mode: pgHealth.connected ? "live-postgresql" : "disconnected",
      postgres: {
        connected: pgHealth.connected,
        endpoint: pgHealth.endpoint,
        database: pgHealth.database,
        latencyMs: pgHealth.latencyMs,
        version: pgHealth.version,
      },
      mongodb: {
        connected: dbConnected,
      },
      notice: pgHealth.connected
        ? "Connected to PostgreSQL 17 primary database."
        : `PostgreSQL connection issue: ${pgHealth.error}`,
    },
    version: "2.0.0-stage2",
  });
}
