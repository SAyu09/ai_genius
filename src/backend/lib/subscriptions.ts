import { db } from "@/backend/db";
import { subscriptions } from "@/backend/db/schema";
import { and, eq, gt } from "drizzle-orm";
import { redis } from "./redis";

// Cached subscription check — avoids DB hit on every tool page load
// Cache key: sub:{userId}:{agentId}  TTL: 5 minutes (300s)
export async function getActiveSubscription(userId: string, agentId: string) {
  const cacheKey = `sub:${userId}:${agentId}`;

  try {
    // 1. Check Redis cache first (O(1), no DB)
    const cachedStr = await redis.get(cacheKey);

    if (cachedStr) {
      const cached = JSON.parse(cachedStr) as {
        active: boolean;
        planType: string | null;
        periodEnd: string | null;
      };

      // Validate period end hasn't passed since cache was written
      if (cached.active && cached.periodEnd && new Date(cached.periodEnd) > new Date()) {
        return { active: true, planType: cached.planType };
      }
      if (!cached.active) {
        return { active: false, planType: null };
      }
    }
  } catch (err) {
    console.error("Redis cache error:", err);
  }

  // 2. Cache miss — query DB
  const sub = await db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptions.buyerId, userId),
      eq(subscriptions.agentId, agentId),
      eq(subscriptions.status, "active"),
      gt(subscriptions.currentPeriodEnd, new Date())
    ),
    columns: { id: true, planType: true, currentPeriodEnd: true },
  });

  // 3. Write result to KV (even negative result, to prevent DB hammering)
  const cacheValue = sub
    ? {
        active: true,
        planType: sub.planType,
        periodEnd: sub.currentPeriodEnd?.toISOString() || null,
      }
    : { active: false, planType: null, periodEnd: null };

  try {
    await redis.setex(cacheKey, 300, JSON.stringify(cacheValue));
  } catch (err) {
    console.error("Redis cache error (set):", err);
  }

  return { active: !!sub, planType: sub?.planType ?? null };
}

// Call this after any subscription status change (cancel, suspend, restore)
export async function invalidateSubscriptionCache(userId: string, agentId: string) {
  try {
    await redis.del(`sub:${userId}:${agentId}`);
  } catch (err) {
    console.error("Redis cache error (del):", err);
  }
}
