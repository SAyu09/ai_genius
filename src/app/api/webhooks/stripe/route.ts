import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/backend/lib/stripe";
import { db } from "@/backend/db";
import { agents, subscriptions, purchases } from "@/backend/db/schema";
import { eq, sql } from "drizzle-orm";
import { invalidateSubscriptionCache } from "@/backend/lib/subscriptions";
import { redis } from "@/backend/lib/redis";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return new Response("Missing signature", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response("Invalid signature", { status: 400 });
  }

  // Handler map — clean, easy to extend
  const handlers: Partial<Record<Stripe.Event["type"], (e: Stripe.Event) => Promise<void>>> = {
    "checkout.session.completed": handleCheckoutCompleted,
    "customer.subscription.deleted": handleSubscriptionCancelled,
    "invoice.payment_failed": handlePaymentFailed,
    "invoice.payment_succeeded": handleRenewal,
  };

  const handler = handlers[event.type];
  if (handler) {
    // Deduplication check
    const eventKey = `stripe:event:${event.id}`;
    try {
      const alreadyProcessed = await redis.get(eventKey);
      if (alreadyProcessed) {
        console.log(`Webhook event ${event.id} already processed`);
        return new Response("already processed", { status: 200 });
      }
    } catch (err) {
      // If Redis fails, continue processing rather than failing open/closed, 
      // but it might risk duplicates.
      console.error("Redis dedupe check failed:", err);
    }

    // Run handler synchronously — return 500 on failure so Stripe retries
    try {
      await handler(event);
      // Mark as processed (72h TTL to match Stripe retry window)
      await redis.setex(eventKey, 72 * 3600, "1").catch(console.error);
    } catch (e) {
      console.error("Webhook handler error sync:", e);
      return new Response("Webhook processing failed", { status: 500 });
    }
  }

  return new Response("ok", { status: 200 });
}

// ── Handlers ────────────────────────────────────────────────────────────────

async function handleCheckoutCompleted(event: Stripe.Event) {
  const session = event.data.object as any;
  
  let metadata = session.metadata;
  if (!metadata || !metadata.buyerId) {
    // Try to get from subscription_data or payment_intent
    if (session.subscription) {
      const stripeSub = await stripe.subscriptions.retrieve(session.subscription as string);
      metadata = stripeSub.metadata;
    }
  }

  if (!metadata || !(metadata.buyerId || metadata.userId) || !metadata.agentId) {
    console.error("Webhook missing metadata fields:", metadata);
    return;
  }

  const buyerId = metadata.buyerId || metadata.userId;
  const { agentId, sellerId, planType, pricingModel } = metadata;
  const amountCents = session.amount_total || 0;

  // Atomic — either all succeed or nothing does
  await db.transaction(async (tx) => {
    let dbSubscriptionId: string | undefined;

    if ((pricingModel === "subscription" || session.mode === "subscription") && session.subscription) {
      const stripeSubId = session.subscription as string;
      const stripeSub = await stripe.subscriptions.retrieve(stripeSubId) as any;

      const startDate = stripeSub.current_period_start ? new Date(stripeSub.current_period_start * 1000) : new Date();
      const endDate = stripeSub.current_period_end ? new Date(stripeSub.current_period_end * 1000) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error("Invalid dates from stripeSub:", stripeSub);
      }

      const [sub] = await tx.insert(subscriptions).values({
        buyerId: buyerId as string,
        agentId: agentId as string,
        stripeSubscriptionId: stripeSubId,
        stripeCustomerId: session.customer as string,
        planType: planType || "monthly",
        status: "active",
        currentPeriodStart: startDate,
        currentPeriodEnd: endDate,
      }).onConflictDoNothing().returning({ id: subscriptions.id });
      
      if (sub) dbSubscriptionId = sub.id;
    }

    await tx.insert(purchases).values({
      buyerId: buyerId as string,
      agentId: agentId as string,
      sellerId: sellerId as string,
      subscriptionId: dbSubscriptionId,
      stripePaymentId: session.payment_intent as string | undefined,
      amountPaid: amountCents,
      platformFee: Math.round(amountCents * 0.15),
      sellerPayout: Math.round(amountCents * 0.85),
      currency: "usd",
      type: session.mode === "subscription" ? "subscription" : "one_time",
      settlementStatus: "pending",
    });

    // Increment sales count
    await tx.update(agents)
      .set({ salesCount: sql`${agents.salesCount} + 1` })
      .where(eq(agents.id, agentId as string));
  });

  // After commit — invalidate KV cache
  await invalidateSubscriptionCache(buyerId as string, agentId as string);
}

async function handleSubscriptionCancelled(event: Stripe.Event) {
  const sub = event.data.object as any;
  const metadata = sub.metadata;

  await db.update(subscriptions)
    .set({ status: "cancelled", cancelledAt: new Date() })
    .where(eq(subscriptions.stripeSubscriptionId, sub.id));

  if (metadata?.buyerId && metadata?.agentId) {
    await invalidateSubscriptionCache(metadata.buyerId, metadata.agentId);
  }
}

async function handlePaymentFailed(event: Stripe.Event) {
  const invoice = event.data.object as any;
  const stripeSubId = invoice.subscription as string;

  if (stripeSubId) {
    const subRecord = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.stripeSubscriptionId, stripeSubId)
    });
    
    if (subRecord) {
      await db.update(subscriptions)
        .set({ status: "past_due" })
        .where(eq(subscriptions.stripeSubscriptionId, stripeSubId));

      await invalidateSubscriptionCache(subRecord.buyerId, subRecord.agentId);
    }
  }
}

async function handleRenewal(event: Stripe.Event) {
  const invoice = event.data.object as any;
  if (invoice.billing_reason !== "subscription_cycle") return; // skip first payment

  const stripeSubId = invoice.subscription as string;
  if (!stripeSubId) return;

  const stripeSub = await stripe.subscriptions.retrieve(stripeSubId) as any;
  const metadata = stripeSub.metadata;
  const amountCents = invoice.amount_paid;

  if (!metadata || !metadata.buyerId || !metadata.agentId) return;

  await db.transaction(async (tx) => {
    const startDate = stripeSub.current_period_start ? new Date(stripeSub.current_period_start * 1000) : new Date();
    const endDate = stripeSub.current_period_end ? new Date(stripeSub.current_period_end * 1000) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const [sub] = await tx.update(subscriptions)
      .set({
        status: "active",
        currentPeriodStart: startDate,
        currentPeriodEnd: endDate,
        updatedAt: new Date()
      })
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubId))
      .returning({ id: subscriptions.id });

    if (sub) {
      await tx.insert(purchases).values({
        buyerId: metadata.buyerId,
        agentId: metadata.agentId,
        sellerId: metadata.sellerId,
        subscriptionId: sub.id,
        stripePaymentId: invoice.payment_intent as string | undefined,
        amountPaid: amountCents,
        platformFee: Math.round(amountCents * 0.15),
        sellerPayout: Math.round(amountCents * 0.85),
        currency: "usd",
        type: "renewal",
        settlementStatus: "pending",
      });
    }
  });
  
  await invalidateSubscriptionCache(metadata.buyerId, metadata.agentId);
}
