import { app } from "./app";
import { env } from "../config/env";
import { connectDb } from "../db";
import { AuthService } from "../services/auth.service";

async function startServer() {
  console.log("==================================================");
  console.log("  BUILDING PASSPORT — CIVIL BACKEND API SERVER  ");
  console.log("==================================================");

  // Attempt database connection
  try {
    await connectDb();
    console.log("[Server] Database connected successfully.");
    await AuthService.ensureSeedUsers();
  } catch (err: unknown) {
    console.warn(`[Server Notice] Running with in-memory persistence fallback: ${(err as Error).message}`);
    console.warn("[Server Notice] To run with live MongoDB, launch MongoDB on port 27017 or configure MONGODB_URI.");
  }

  const host = process.env.HOST || "127.0.0.1";
  const server = app.listen(env.PORT, host, () => {
    console.log(`[Server] Express API server listening on http://${host}:${env.PORT}`);
    console.log(`[Server] Health check: http://${host}:${env.PORT}/api/health`);
    console.log(`[Server] Environment: ${env.NODE_ENV}`);
  });

  const shutdown = () => {
    console.log("\n[Server] Shutting down gracefully...");
    server.close(() => {
      console.log("[Server] HTTP server closed.");
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startServer();
