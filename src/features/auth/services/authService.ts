import { db } from "@/backend/db";
import { users } from "@/backend/db/schema";
import { eq } from "drizzle-orm";
import type { UserRole } from "@/types/auth.types";

/**
 * Validates that a callbackUrl is same-origin (prevents open redirect attacks).
 * Returns the URL if valid, otherwise null.
 */
export function isValidCallbackUrl(
  callbackUrl: string | null | undefined,
  baseUrl: string
): string | null {
  if (!callbackUrl) return null;

  try {
    const url = new URL(callbackUrl, baseUrl);
    const base = new URL(baseUrl);
    // Must be same origin
    if (url.origin !== base.origin) return null;
    // Must not be an auth route (prevent redirect loops)
    if (url.pathname === "/auth" || url.pathname === "/sign-in" || url.pathname === "/sign-up") return null;
    return url.pathname + url.search;
  } catch {
    return null;
  }
}

/**
 * Returns the default redirect path based on user role.
 */
export function getRoleBasedRedirect(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "seller":
      return "/dashboard/seller";
    case "buyer":
    default:
      return "/marketplace";
  }
}

/**
 * Updates the user's isFirstLogin flag to false after first dashboard visit.
 */
export async function markFirstLoginComplete(userId: string): Promise<void> {
  await db
    .update(users)
    .set({ isFirstLogin: false })
    .where(eq(users.id, userId));
}

/**
 * Upgrades a buyer to a seller role.
 * Returns the updated user or null if already a seller.
 */
export async function upgradeToSeller(userId: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) throw new Error("User not found");
  if (user.role === "seller" || user.role === "admin") {
    return { alreadySeller: true, user };
  }

  const [updated] = await db
    .update(users)
    .set({ role: "seller", updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();

  return { alreadySeller: false, user: updated };
}
