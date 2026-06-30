import crypto from "crypto";
import { db } from "@/backend/db";
import { apiKeys, users } from "@/backend/db/schema";
import { eq } from "drizzle-orm";

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const KEY_PREFIX = "aig_live_";
const RANDOM_BYTES = 24; // 192 bits of entropy — far beyond brute-force

// ═══════════════════════════════════════════════════════════════
// Key Generation
// ═══════════════════════════════════════════════════════════════

/**
 * Generates a new API key with a recognisable prefix.
 *
 * Format: `aig_live_<48 hex chars>`
 * The raw key is returned to the caller **once** and must never be stored.
 * Only the SHA-256 hash is persisted.
 */
export function generateApiKey(): {
  rawKey: string;
  keyHash: string;
  prefix: string;
} {
  const randomPart = crypto.randomBytes(RANDOM_BYTES).toString("hex");
  const rawKey = `${KEY_PREFIX}${randomPart}`;

  return {
    rawKey,
    keyHash: hashApiKey(rawKey),
    prefix: `${KEY_PREFIX}${randomPart.slice(0, 8)}`, // visible portion for UI
  };
}

// ═══════════════════════════════════════════════════════════════
// Hashing
// ═══════════════════════════════════════════════════════════════

/**
 * Deterministic SHA-256 hash of a raw API key.
 *
 * SHA-256 is appropriate here (instead of bcrypt) because the key
 * has 192 bits of entropy — dictionary / rainbow attacks are infeasible.
 * The deterministic hash also allows efficient `WHERE key_hash = ?` lookups.
 */
export function hashApiKey(rawKey: string): string {
  return crypto.createHash("sha256").update(rawKey).digest("hex");
}

// ═══════════════════════════════════════════════════════════════
// Validation
// ═══════════════════════════════════════════════════════════════

export interface ValidatedApiKey {
  userId: string;
  role: string;
  keyId: string;
}

/**
 * Validates an incoming raw API key against the database.
 *
 * Hashes the key, looks it up, and — if found — returns the owning
 * user's id and role in a single joined query.
 *
 * Returns `null` for any invalid / revoked / missing key.
 */
export async function validateApiKey(
  rawKey: string
): Promise<ValidatedApiKey | null> {
  // Quick format check — avoid DB round-trip for obviously bad keys
  if (!rawKey.startsWith(KEY_PREFIX)) {
    return null;
  }

  const keyHash = hashApiKey(rawKey);

  const result = await db
    .select({
      keyId: apiKeys.id,
      userId: apiKeys.userId,
      role: users.role,
    })
    .from(apiKeys)
    .innerJoin(users, eq(apiKeys.userId, users.id))
    .where(eq(apiKeys.keyHash, keyHash))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const { keyId, userId, role } = result[0];
  return { userId, role, keyId };
}

/**
 * Updates the `lastUsedAt` timestamp on an API key.
 * Designed to be called fire-and-forget (no await needed at call site).
 */
export function touchApiKeyLastUsed(keyId: string): void {
  db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, keyId))
    .then(() => {})
    .catch((err) => {
      console.warn("[ApiKey] Failed to update lastUsedAt:", (err as Error).message);
    });
}
