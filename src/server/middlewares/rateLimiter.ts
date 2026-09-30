import { Request, Response, NextFunction } from "express";
import { NextRequest, NextResponse } from "next/server";

interface RateLimitRecord {
  timestamps: number[];
}

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
}

export const RATE_LIMITS: Record<"login" | "register", RateLimitConfig> = {
  login: {
    windowMs: 60 * 1000, // 1 minute
    max: 15,             // 15 attempts per minute per IP
    message: "Too many login attempts. Please try again later.",
  },
  register: {
    windowMs: 60 * 1000, // 1 minute
    max: 10,             // 10 registrations per minute per IP
    message: "Too many registration attempts. Please try again later.",
  },
};

// In-memory sliding window store: Map<key, RateLimitRecord>
const store = new Map<string, RateLimitRecord>();

// Clean up expired records every 5 minutes to prevent memory leak
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let cleanupTimer: NodeJS.Timeout | null = null;

function ensureCleanupTimer() {
  if (!cleanupTimer) {
    cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, record] of store.entries()) {
        const validTimestamps = record.timestamps.filter((ts) => now - ts < 60 * 1000);
        if (validTimestamps.length === 0) {
          store.delete(key);
        } else {
          record.timestamps = validTimestamps;
        }
      }
    }, CLEANUP_INTERVAL_MS);
    if (typeof cleanupTimer.unref === "function") {
      cleanupTimer.unref();
    }
  }
}

ensureCleanupTimer();

/**
 * Checks and updates rate limit for a given key (IP + route type).
 */
export function evaluateRateLimit(
  key: string,
  config: RateLimitConfig
): {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  let record = store.get(key);

  if (!record) {
    record = { timestamps: [] };
    store.set(key, record);
  }

  // Filter timestamps within sliding window
  record.timestamps = record.timestamps.filter((ts) => now - ts < config.windowMs);

  if (record.timestamps.length >= config.max) {
    const oldestTimestamp = record.timestamps[0];
    const retryAfterMs = oldestTimestamp + config.windowMs - now;
    const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  // Record this attempt
  record.timestamps.push(now);
  const remaining = Math.max(0, config.max - record.timestamps.length);

  return {
    allowed: true,
    remaining,
    retryAfterSeconds: 0,
  };
}

/**
 * Resets rate limit store (useful for tests).
 */
export function resetRateLimits(): void {
  store.clear();
}

/**
 * Helper to extract client IP from Express request.
 */
function getExpressIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket.remoteAddress || "127.0.0.1";
}

/**
 * Helper to extract client IP from Next.js NextRequest.
 */
function getNextIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return "127.0.0.1";
}

/**
 * Express middleware for authentication rate limiting.
 */
export function createAuthRateLimiter(type: "login" | "register") {
  const config = RATE_LIMITS[type];

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = getExpressIp(req);
    const key = `${type}:${ip}`;

    const { allowed, remaining, retryAfterSeconds } = evaluateRateLimit(key, config);

    res.setHeader("X-RateLimit-Limit", config.max.toString());
    res.setHeader("X-RateLimit-Remaining", remaining.toString());

    if (!allowed) {
      res.setHeader("Retry-After", retryAfterSeconds.toString());
      res.status(429).json({
        success: false,
        error: config.message,
      });
      return;
    }

    next();
  };
}

/**
 * Next.js App Router rate limit verification helper.
 * Returns NextResponse with 429 if rate limited, or null if allowed.
 */
export function checkNextAuthRateLimit(
  req: NextRequest,
  type: "login" | "register"
): NextResponse | null {
  const config = RATE_LIMITS[type];
  const ip = getNextIp(req);
  const key = `${type}:${ip}`;

  const { allowed, retryAfterSeconds } = evaluateRateLimit(key, config);

  if (!allowed) {
    return NextResponse.json(
      {
        success: false,
        error: config.message,
      },
      {
        status: 429,
        headers: {
          "Retry-After": retryAfterSeconds.toString(),
          "X-RateLimit-Limit": config.max.toString(),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  return null;
}
