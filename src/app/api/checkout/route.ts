import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { stripe, calculateSplit } from "@/lib/stripe";
import { db } from "@/db";
import { agents, purchases, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { agentId } = await req.json();
    if (!agentId) {
      return NextResponse.json({ error: "agentId is required" }, { status: 400 });
    }

    const [agent] = await db
      .select()
      .from(agents)
      .where(eq(agents.id, agentId))
      .limit(1);

    if (!agent || !agent.isApproved) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // Check already purchased
    const [existing] = await db
      .select()
      .from(purchases)
      .where(and(eq(purchases.buyerId, user.id), eq(purchases.agentId, agentId)))
      .limit(1);

    if (existing) {
      return NextResponse.json({ error: "You already own this agent" }, { status: 409 });
    }

    // Get seller Stripe account
    const [seller] = await db
      .select()
      .from(users)
      .where(eq(users.id, agent.sellerId))
      .limit(1);

    if (!seller?.stripeAccountId) {
      return NextResponse.json({ error: "Seller has not connected Stripe" }, { status: 400 });
    }

    const { platformFee } = calculateSplit(agent.price);

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email!,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: agent.name, description: agent.desc },
            unit_amount: agent.price,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: platformFee,
        transfer_data: { destination: seller.stripeAccountId },
      },
      metadata: { buyerId: user.id, agentId: agent.id },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/agents/${agent.slug}?purchased=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/agents/${agent.slug}`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
