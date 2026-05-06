import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/backend/lib/stripe";
import { db } from "@/backend/db";
import { agents, subscriptions } from "@/backend/db/schema";
import { eq, sql } from "drizzle-orm";

/**
 * POST /api/webhooks/stripe
 * Handles Stripe webhook events for the full subscription lifecycle.
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: { code: "MISSING_SIGNATURE", message: "Missing signature" } },
      { status: 400 }
    );
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json(
      { error: { code: "INVALID_SIGNATURE", message: "Invalid signature" } },
      { status: 400 }
    );
  }

  // ─── checkout.session.completed — New subscription created ───
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const buyerId = session.metadata?.buyerId;
    const agentId = session.metadata?.agentId;
    const planType = session.metadata?.planType || "monthly";
    const subscriptionId = session.subscription as string;

    if (!buyerId || !agentId || !subscriptionId) {
      console.error("Missing metadata in checkout session");
      return NextResponse.json({ received: true });
    }

    try {
      await db.insert(subscriptions).values({
        buyerId: buyerId as string,
        agentId: agentId as string,
        stripeSubscriptionId: subscriptionId,
        stripeCustomerId: session.customer as string,
        planType,
        status: "active",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(
          Date.now() + (planType === "annual" ? 365 : 30) * 24 * 60 * 60 * 1000
        ),
      });

      // Increment sales count on the agent
      await db
        .update(agents)
        .set({ salesCount: sql`${agents.salesCount} + 1` })
        .where(eq(agents.id, agentId));
    } catch (err: any) {
      if (err.code === "23505") {
        console.log("Duplicate webhook, already processed:", session.id);
      } else {
        throw err;
      }
    }
  }

  // ─── customer.subscription.updated — Plan changes, billing cycle ───
  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object as any;
    try {
      const updates: Record<string, any> = {
        updatedAt: new Date(),
      };

      // Update period dates if available
      if (subscription.current_period_start) {
        updates.currentPeriodStart = new Date(subscription.current_period_start * 1000);
      }
      if (subscription.current_period_end) {
        updates.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
      }

      // Map Stripe status to our status
      if (subscription.status === "active") {
        updates.status = "active";
      } else if (subscription.status === "past_due") {
        updates.status = "expired";
      } else if (subscription.status === "canceled") {
        updates.status = "cancelled";
        updates.cancelledAt = new Date();
      }

      await db
        .update(subscriptions)
        .set(updates)
        .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
    } catch (err) {
      console.error("Failed to update subscription:", err);
    }
  }

  // ─── invoice.payment_failed — Mark as expired ───
  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as any;
    const subscriptionId = invoice.subscription as string;
    if (subscriptionId) {
      try {
        await db
          .update(subscriptions)
          .set({ status: "expired", updatedAt: new Date() })
          .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));
      } catch (err) {
        console.error("Failed to mark subscription as expired:", err);
      }
    }
  }

  // ─── customer.subscription.deleted — Cancelled ───
  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as any;
    try {
      await db
        .update(subscriptions)
        .set({ status: "cancelled", cancelledAt: new Date(), updatedAt: new Date() })
        .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
    } catch (err) {
      console.error("Failed to cancel subscription", err);
    }
  }

  return NextResponse.json({ received: true });
}
