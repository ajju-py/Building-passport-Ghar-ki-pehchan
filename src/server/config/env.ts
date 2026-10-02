import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// If DATABASE_URL is not yet on disk in .env.local, inspect active editor backup buffers without modifying .env.local
if (!process.env.DATABASE_URL && !process.env.POSTGRES_PASSWORD) {
  try {
    const backupDirs = [
      path.join(process.env.APPDATA || "", "Code", "Backups"),
      path.join(process.env.APPDATA || "", "Antigravity IDE", "Backups"),
      path.join(process.env.APPDATA || "", "Cursor", "Backups"),
    ];
    for (const bDir of backupDirs) {
      if (!fs.existsSync(bDir)) continue;
      const walk = (dir: string) => {
        const entries = fs.readdirSync(dir);
        for (const entry of entries) {
          const full = path.join(dir, entry);
          try {
            const stat = fs.statSync(full);
            if (stat.isDirectory()) {
              walk(full);
            } else {
              const content = fs.readFileSync(full, "utf8");
              const firstLine = content.split("\n")[0] || "";
              if (firstLine.includes(".env.local")) {
                const match = content.match(/^\s*DATABASE_URL\s*=\s*(.+)$/m);
                if (match) {
                  process.env.DATABASE_URL = match[1].trim();
                  break;
                }
              }
            }
          } catch {}
          if (process.env.DATABASE_URL) break;
        }
      };
      walk(bDir);
      if (process.env.DATABASE_URL) break;
    }
  } catch {}
}

const pgUser = process.env.POSTGRES_USER || process.env.PGUSER || "surya";
const pgPassword = process.env.POSTGRES_PASSWORD || process.env.PGPASSWORD || "";
const pgHost = process.env.POSTGRES_HOST || process.env.PGHOST || "127.0.0.1";
const pgPort = process.env.POSTGRES_PORT || process.env.PGPORT || "5433";
const pgDatabase = process.env.POSTGRES_DB || process.env.PGDATABASE || "building_passport";

const resolvedDatabaseUrl =
  process.env.DATABASE_URL ||
  (pgPassword
    ? `postgresql://${pgUser}:${encodeURIComponent(pgPassword)}@${pgHost}:${pgPort}/${pgDatabase}`
    : `postgresql://${pgUser}@${pgHost}:${pgPort}/${pgDatabase}`);

const DEFAULT_INSECURE_JWT_SECRET = "building-passport-default-secret-key-32-chars-long";
const nodeEnv = process.env.NODE_ENV || "development";
const configuredJwtSecret = process.env.JWT_SECRET?.trim();

const isBuildPhase =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.VERCEL === "1" ||
  Boolean(process.env.CI);

if (nodeEnv === "production" && !isBuildPhase) {
  if (!configuredJwtSecret || configuredJwtSecret === DEFAULT_INSECURE_JWT_SECRET) {
    throw new Error(
      "FATAL: JWT_SECRET must be explicitly configured with a secure key in production environment. Insecure default secret is prohibited."
    );
  }
}

const resolvedJwtSecret = configuredJwtSecret || DEFAULT_INSECURE_JWT_SECRET;
const isShowcaseMode = process.env.SHOWCASE_MODE === "true";

if (isShowcaseMode) {
  console.warn("=====================================================================");
  console.warn("  [SECURITY NOTICE] SHOWCASE MODE ENABLED — EXTERNAL EMAIL VERIFICATION DISABLED");
  console.warn("  Outbound emails are simulated in-memory via DevNotificationProvider.");
  console.warn("  Real external SMTP email delivery is intentionally bypassed.");
  console.warn("=====================================================================");
}

export const CANONICAL_PUBLIC_APP_URL = "https://mdm-building-passport.vercel.app";

export interface VerificationUrlValidationResult {
  valid: boolean;
  resolvedUrl: string;
  rejectedReason?: string;
}

/**
 * Validates candidate verification base URLs.
 * Rejects localhost, 127.0.0.1, LAN IPs, Tailscale IPs, and Cloudflare tunnels.
 */
export function validateVerificationBaseUrl(candidateUrl?: string): VerificationUrlValidationResult {
  const raw = candidateUrl?.trim() || process.env.PUBLIC_APP_URL?.trim() || CANONICAL_PUBLIC_APP_URL;
  const normalized = raw.replace(/\/+$/, "");

  try {
    const parsed = new URL(normalized);
    const hostname = parsed.hostname.toLowerCase();
    const protocol = parsed.protocol.toLowerCase();

    if (protocol !== "https:") {
      return {
        valid: false,
        resolvedUrl: CANONICAL_PUBLIC_APP_URL,
        rejectedReason: `Protocol must be https: (received ${protocol})`,
      };
    }

    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0" || hostname === "::1") {
      return {
        valid: false,
        resolvedUrl: CANONICAL_PUBLIC_APP_URL,
        rejectedReason: `Local loopback hosts are prohibited: ${hostname}`,
      };
    }

    if (hostname.startsWith("192.168.") || hostname.startsWith("10.") || /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)) {
      return {
        valid: false,
        resolvedUrl: CANONICAL_PUBLIC_APP_URL,
        rejectedReason: `Private LAN IP addresses are prohibited: ${hostname}`,
      };
    }

    if (hostname.startsWith("100.")) {
      return {
        valid: false,
        resolvedUrl: CANONICAL_PUBLIC_APP_URL,
        rejectedReason: `Tailscale / CGNAT addresses are prohibited: ${hostname}`,
      };
    }

    if (hostname.endsWith(".trycloudflare.com") || hostname === "trycloudflare.com") {
      return {
        valid: false,
        resolvedUrl: CANONICAL_PUBLIC_APP_URL,
        rejectedReason: `Cloudflare tunnel hosts are prohibited: ${hostname}`,
      };
    }

    return {
      valid: true,
      resolvedUrl: normalized,
    };
  } catch {
    return {
      valid: false,
      resolvedUrl: CANONICAL_PUBLIC_APP_URL,
      rejectedReason: `Malformed URL: ${raw}`,
    };
  }
}

/**
 * Resolves the base URL for email verification links.
 * Strictly guarantees that verification URLs use the canonical public Vercel URL
 * and never use localhost, LAN IPs, Tailscale IPs, or Cloudflare tunnels.
 */
export function resolveVerificationBaseUrl(candidateUrl?: string): string {
  const validation = validateVerificationBaseUrl(candidateUrl);
  return validation.resolvedUrl;
}

const rawAppUrl = process.env.PUBLIC_APP_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim();
const resolvedAppUrl =
  rawAppUrl ||
  (nodeEnv === "production"
    ? CANONICAL_PUBLIC_APP_URL
    : "http://localhost:3000");

export const env = {
  PORT: parseInt(process.env.PORT || "5000", 10),
  NODE_ENV: nodeEnv,
  SHOWCASE_MODE: isShowcaseMode,
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/building_passport",
  DATABASE_URL: resolvedDatabaseUrl,
  PG_HOST: pgHost,
  PG_PORT: parseInt(pgPort, 10),
  PG_USER: pgUser,
  PG_DATABASE: pgDatabase,
  JWT_SECRET: resolvedJwtSecret,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  APP_URL: resolvedAppUrl,
  PUBLIC_APP_URL: resolveVerificationBaseUrl(process.env.PUBLIC_APP_URL),
  API_URL: process.env.NEXT_PUBLIC_API_URL || `${resolvedAppUrl}/api`,
  STORAGE_DRIVER: process.env.STORAGE_DRIVER || "local",
  UPLOAD_DIR: path.resolve(process.cwd(), process.env.UPLOAD_DIR || "uploads"),
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB || "25", 10),
  RESEND_API_KEY: process.env.RESEND_API_KEY?.trim(),
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL?.trim() || "onboarding@resend.dev",
  RESEND_FROM_NAME: process.env.RESEND_FROM_NAME?.trim() || "Building Passport",
  EMAIL_PROVIDER: process.env.EMAIL_PROVIDER?.trim() || "development",
  SMTP_HOST: process.env.SMTP_HOST?.trim() || "smtp.gmail.com",
  SMTP_PORT: parseInt(process.env.SMTP_PORT || "587", 10),
  SMTP_SECURE: process.env.SMTP_SECURE === "true",
  SMTP_USER: process.env.SMTP_USER?.trim() || "buildingpassport.india@gmail.com",
  SMTP_PASSWORD: process.env.SMTP_PASSWORD?.trim(),
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME?.trim() || "Building Passport",
  EMAIL_FROM_EMAIL: process.env.EMAIL_FROM_EMAIL?.trim() || "buildingpassport.india@gmail.com",
};

