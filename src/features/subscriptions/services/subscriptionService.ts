import { db } from "@/backend/db";
import { subscriptions, agents } from "@/backend/db/schema";
import { eq, and } from "drizzle-orm";
import { stripe } from "@/backend/lib/stripe";

/**
 * Checks if a user has an active subscription to a specific agent.
 * Server-side only — never trust client claims.
 */
export async function checkSubscription(
  userId: string,
  agentId: string
): Promise<boolean> {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.buyerId, userId),
        eq(subscriptions.agentId, agentId),
        eq(subscriptions.status, "active")
      )
    )
    .limit(1);

  return !!sub;
}

/**
 * Gets all subscriptions for a user, joined with agent details.
 */
export async function getUserSubscriptions(userId: string) {
  return db
    .select({
      subscription: subscriptions,
      agent: agents,
    })
    .from(subscriptions)
    .innerJoin(agents, eq(subscriptions.agentId, agents.id))
    .where(eq(subscriptions.buyerId, userId));
}

/**
 * Gets a single subscription, verifying ownership.
 */
export async function getSubscriptionById(
  subscriptionId: string,
  userId: string
) {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.id, subscriptionId),
        eq(subscriptions.buyerId, userId)
      )
    )
    .limit(1);

  return sub ?? null;
}

/**
 * Cancels a subscription via Stripe and updates DB.
 */
export async function cancelSubscription(
  subscriptionId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const sub = await getSubscriptionById(subscriptionId, userId);

  if (!sub) {
    return { success: false, error: "Subscription not found" };
  }

  if (sub.status === "cancelled") {
    return { success: false, error: "Subscription is already cancelled" };
  }

  // Cancel in Stripe if there's a Stripe subscription ID
  if (sub.stripeSubscriptionId) {
    try {
      await stripe.subscriptions.cancel(sub.stripeSubscriptionId);
    } catch (err) {
      console.error("Stripe cancel error:", err);
      return { success: false, error: "Failed to cancel with Stripe" };
    }
  }

  // Update our DB
  await db
    .update(subscriptions)
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, subscriptionId));

  return { success: true };
}
