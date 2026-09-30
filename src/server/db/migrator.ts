import fs from "node:fs";
import path from "node:path";
import { PoolClient } from "pg";
import { getPostgresClient, closePostgresPool, sanitizeConnectionString } from "./postgres";

export interface MigrationFile {
  version: string;
  filename: string;
  filePath: string;
}

export interface MigrationResult {
  applied: string[];
  alreadyApplied: string[];
  totalDiscovered: number;
}

/**
 * Ensures the schema_migrations tracking table exists.
 */
export async function ensureMigrationsTable(client: PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

/**
 * Returns a Set of all migration versions previously applied.
 */
export async function getAppliedMigrations(client: PoolClient): Promise<Set<string>> {
  const result = await client.query<{ version: string }>(
    "SELECT version FROM schema_migrations ORDER BY applied_at ASC;"
  );
  return new Set(result.rows.map((row) => row.version));
}

/**
 * Discovers SQL migration files in deterministic alphabetical order.
 */
export function discoverMigrationFiles(migrationsDir?: string): MigrationFile[] {
  const targetDir =
    migrationsDir ||
    (fs.existsSync(path.join(__dirname, "migrations"))
      ? path.join(__dirname, "migrations")
      : path.resolve(process.cwd(), "src/server/db/migrations"));

  if (!fs.existsSync(targetDir)) {
    return [];
  }

  const files = fs
    .readdirSync(targetDir)
    .filter((f) => f.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

  return files.map((filename) => ({
    version: path.basename(filename, ".sql"),
    filename,
    filePath: path.join(targetDir, filename),
  }));
}

/**
 * Executes pending database migrations sequentially inside transactions.
 */
export async function runMigrations(customDir?: string): Promise<MigrationResult> {
  const client = await getPostgresClient();
  const applied: string[] = [];
  const alreadyApplied: string[] = [];

  try {
    await ensureMigrationsTable(client);
    const appliedSet = await getAppliedMigrations(client);
    const migrationFiles = discoverMigrationFiles(customDir);

    for (const migration of migrationFiles) {
      if (appliedSet.has(migration.version)) {
        alreadyApplied.push(migration.version);
        continue;
      }

      console.log(`[Migrator] Applying migration: ${migration.filename}...`);
      const sqlContent = fs.readFileSync(migration.filePath, "utf8");

      // Transactional boundary
      await client.query("BEGIN");
      try {
        await client.query(sqlContent);
        await client.query(
          "INSERT INTO schema_migrations (version, applied_at) VALUES ($1, NOW());",
          [migration.version]
        );
        await client.query("COMMIT");
        applied.push(migration.version);
        console.log(`[Migrator] Successfully applied: ${migration.filename}`);
      } catch (err: unknown) {
        await client.query("ROLLBACK");
        const originalError = err as Error;
        const sanitizedMsg = sanitizeConnectionString(originalError.message);
        console.error(`[Migrator Error] Failed applying ${migration.filename}: ${sanitizedMsg}`);
        const sanitizedError = new Error(`Migration ${migration.filename} failed: ${sanitizedMsg}`);
        (sanitizedError as Error & { code?: string }).code = (originalError as Error & { code?: string }).code;
        throw sanitizedError;
      }
    }

    return {
      applied,
      alreadyApplied,
      totalDiscovered: migrationFiles.length,
    };
  } finally {
    client.release();
  }
}

/**
 * CLI runner entry point.
 */
async function main() {
  console.log("==================================================");
  console.log("  BUILDING PASSPORT — POSTGRESQL MIGRATION RUNNER  ");
  console.log("==================================================");

  try {
    const result = await runMigrations();
    console.log(`[Migrator] Total discovered: ${result.totalDiscovered}`);
    console.log(`[Migrator] Previously applied: ${result.alreadyApplied.length}`);
    console.log(`[Migrator] Newly applied: ${result.applied.length}`);

    if (result.applied.length > 0) {
      console.log(`[Migrator] Applied migrations: ${result.applied.join(", ")}`);
    } else {
      console.log("[Migrator] Database is up to date. No pending migrations.");
    }

    await closePostgresPool();
    process.exit(0);
  } catch (err: unknown) {
    const msg = sanitizeConnectionString((err as Error).message || "Unknown migration error");
    console.error(`[Migrator Fatal] ${msg}`);
    await closePostgresPool().catch(() => {});
    process.exit(1);
  }
}

// Execute if invoked directly from CLI
if (require.main === module || process.argv[1]?.includes("migrator")) {
  main();
}
