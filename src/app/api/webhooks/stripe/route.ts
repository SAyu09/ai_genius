import { NextRequest, NextResponse } from "next/server";
import { stripe, calculateSplit } from "@/lib/stripe";
import { db } from "@/db";
import { agents, purchases } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

/**
 * POST /api/webhooks/stripe
 * Listens for Stripe webhook events.
 * On successful payment → inserts purchase record → increments agent sales count.
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
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
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // ─── Handle checkout.session.completed ───
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const buyerId = session.metadata?.buyerId;
    const agentId = session.metadata?.agentId;

    if (!buyerId || !agentId) {
      console.error("Missing metadata in checkout session");
      return NextResponse.json({ received: true });
    }

    // Fetch agent price
    const [agent] = await db
      .select()
      .from(agents)
      .where(eq(agents.id, agentId))
      .limit(1);

    if (!agent) {
      console.error("Agent not found:", agentId);
      return NextResponse.json({ received: true });
    }

    const { platformFee, sellerPayout } = calculateSplit(agent.price);

    // Create purchase record (idempotent via unique stripeSessionId)
    try {
      await db.insert(purchases).values({
        buyerId,
        agentId,
        stripeSessionId: session.id,
        amountPaid: agent.price,
        platformFee,
        sellerPayout,
      });

      // Increment sales count on the agent
      await db
        .update(agents)
        .set({ salesCount: sql`${agents.salesCount} + 1` })
        .where(eq(agents.id, agentId));
    } catch (err: any) {
      // Unique constraint on stripeSessionId prevents double-processing
      if (err.code === "23505") {
        console.log("Duplicate webhook, already processed:", session.id);
      } else {
        throw err;
      }
    }
  }

  return NextResponse.json({ received: true });
}
