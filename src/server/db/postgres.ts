import { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";
import { env } from "../config/env";

declare global {
  var postgresPoolCache: Pool | undefined;
}

/**
 * Strips password and sensitive auth credentials from connection URLs or error messages.
 */
export function sanitizeConnectionString(urlOrError: string): string {
  if (!urlOrError) return "";
  return urlOrError
    .replace(/(postgres(?:ql)?:\/\/[^:]+:)([^@]+)(@)/gi, "$1***$3")
    .replace(/(password=)([^&;\s]+)/gi, "$1***");
}

/**
 * Returns the singleton PostgreSQL Pool instance.
 */
export function getPostgresPool(): Pool {
  if (global.postgresPoolCache) {
    return global.postgresPoolCache;
  }

  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pool.on("error", (err: Error) => {
    const sanitized = sanitizeConnectionString(err.message);
    console.error(`[PostgreSQL Pool Error] Unexpected client error: ${sanitized}`);
  });

  global.postgresPoolCache = pool;
  return pool;
}

/**
 * Reusable typed query helper that executes parameterized queries on the shared pool.
 * Sanitizes errors before propagation to ensure database passwords are never exposed.
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const pool = getPostgresPool();
  try {
    return await pool.query<T>(text, params);
  } catch (err: unknown) {
    const originalError = err as Error;
    const sanitizedMsg = sanitizeConnectionString(originalError.message);
    const sanitizedError = new Error(sanitizedMsg);
    (sanitizedError as Error & { code?: string }).code = (originalError as Error & { code?: string }).code;
    throw sanitizedError;
  }
}

/**
 * Acquires a client from the pool for multi-statement transactions.
 */
export async function getPostgresClient(): Promise<PoolClient> {
  const pool = getPostgresPool();
  try {
    return await pool.connect();
  } catch (err: unknown) {
    const originalError = err as Error;
    const sanitizedMsg = sanitizeConnectionString(originalError.message);
    const sanitizedError = new Error(sanitizedMsg);
    (sanitizedError as Error & { code?: string }).code = (originalError as Error & { code?: string }).code;
    throw sanitizedError;
  }
}

export interface PostgresHealthResult {
  connected: boolean;
  latencyMs?: number;
  version?: string;
  endpoint?: string;
  database?: string;
  error?: string;
}

/**
 * Checks PostgreSQL connection status and latency with a lightweight SELECT 1 check.
 */
export async function checkPostgresHealth(): Promise<PostgresHealthResult> {
  const start = Date.now();
  try {
    const res = await query<{ health: number; pg_version: string }>(
      "SELECT 1 AS health, version() AS pg_version"
    );
    const latencyMs = Date.now() - start;
    const versionRow = res.rows[0];

    return {
      connected: true,
      latencyMs,
      version: versionRow?.pg_version?.split(" ")?.slice(0, 2)?.join(" ") || "PostgreSQL 17",
      endpoint: `${env.PG_HOST}:${env.PG_PORT}`,
      database: env.PG_DATABASE,
    };
  } catch (err: unknown) {
    const sanitizedMsg = sanitizeConnectionString((err as Error).message);
    return {
      connected: false,
      endpoint: `${env.PG_HOST}:${env.PG_PORT}`,
      database: env.PG_DATABASE,
      error: sanitizedMsg,
    };
  }
}

/**
 * Gracefully terminates the connection pool.
 */
export async function closePostgresPool(): Promise<void> {
  if (global.postgresPoolCache) {
    await global.postgresPoolCache.end();
    global.postgresPoolCache = undefined;
  }
}
