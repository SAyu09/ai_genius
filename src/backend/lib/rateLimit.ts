import { redis } from "./redis";

interface RateLimitConfig {
  /** Max requests allowed within the window */
  maxRequests: number;
  /** Window size in seconds */
  windowSeconds: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // epoch seconds
}

/**
 * Sliding-window rate limiter backed by Redis.
 * Falls back to "allow" if Redis is unavailable (fail-open for availability,
 * but logs a warning so ops can investigate).
 *
 * Key format: rl:{identifier}:{window}
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const { maxRequests, windowSeconds } = config;
  const now = Math.floor(Date.now() / 1000);
  const windowKey = Math.floor(now / windowSeconds);
  const key = `rl:${identifier}:${windowKey}`;
  const resetAt = (windowKey + 1) * windowSeconds;

  try {
    const current = await redis.incr(key);

    // Set expiry on first increment only
    if (current === 1) {
      await redis.expire(key, windowSeconds + 1);
    }

    return {
      allowed: current <= maxRequests,
      remaining: Math.max(0, maxRequests - current),
      resetAt,
    };
  } catch (err) {
    // Redis down — fail open but log
    console.warn("[RateLimit] Redis unavailable, allowing request:", (err as Error).message);
    return { allowed: true, remaining: maxRequests, resetAt };
  }
}

// ── Preset Configs ──────────────────────────────────────────────────────────

/** Auth endpoints: 5 req / 60s per IP */
export const RATE_LIMIT_AUTH: RateLimitConfig = { maxRequests: 5, windowSeconds: 60 };

/** Checkout: 10 req / 60s per user */
export const RATE_LIMIT_CHECKOUT: RateLimitConfig = { maxRequests: 10, windowSeconds: 60 };

/** Upload: 10 req / 300s per user */
export const RATE_LIMIT_UPLOAD: RateLimitConfig = { maxRequests: 10, windowSeconds: 300 };

/** General API: 60 req / 60s per user */
export const RATE_LIMIT_API: RateLimitConfig = { maxRequests: 60, windowSeconds: 60 };

/** Admin endpoints: 30 req / 60s per user */
export const RATE_LIMIT_ADMIN: RateLimitConfig = { maxRequests: 30, windowSeconds: 60 };
