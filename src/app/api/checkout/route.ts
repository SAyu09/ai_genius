import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/backend/lib/auth";
import { stripe } from "@/backend/lib/stripe";
import { db } from "@/backend/db";
import { agents, users, subscriptions } from "@/backend/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    // Support both FormData and JSON
    let agentId: string | undefined;
    let planType: "monthly" | "annual" = "monthly";

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      agentId = formData.get("agentId") as string;
      planType = (formData.get("planType") as "monthly" | "annual") || "monthly";
    } else {
      const body = await req.json();
      agentId = body.agentId;
      planType = body.planType || "monthly";
    }

    if (!agentId) {
      return NextResponse.json(
        { error: { code: "MISSING_AGENT", message: "agentId is required" } },
        { status: 400 }
      );
    }

    const [agent] = await db
      .select()
      .from(agents)
      .where(eq(agents.id, agentId))
      .limit(1);

    if (!agent || agent.status !== "approved") {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Agent not found" } },
        { status: 404 }
      );
    }

    // Check already subscribed
    const [existing] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.buyerId, session.user.id),
          eq(subscriptions.agentId, agentId),
          eq(subscriptions.status, "active")
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.redirect(new URL(`/tools/${agent.id}`, req.url));
    }

    // Get seller Stripe account
    const [seller] = await db
      .select()
      .from(users)
      .where(eq(users.id, agent.sellerId))
      .limit(1);

    if (!seller?.stripeAccountId) {
      return NextResponse.json(
        { error: { code: "SELLER_NOT_CONNECTED", message: "Seller has not connected Stripe" } },
        { status: 400 }
      );
    }

    // Calculate price based on plan type
    // Annual = 20% discount (monthly * 12 * 0.8)
    const interval: "month" | "year" = planType === "annual" ? "year" : "month";
    const unitAmount = planType === "annual"
      ? Math.round(agent.price * 12 * 0.8) // 20% annual discount
      : agent.price;

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: session.user.email!,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: agent.name, description: agent.description },
            unit_amount: unitAmount,
            recurring: { interval },
          },
          quantity: 1,
        },
      ],
      subscription_data: {
        transfer_data: {
          destination: seller.stripeAccountId,
          amount_percent: 85, // Seller gets 85%, Platform keeps 15%
        },
      },
      metadata: {
        buyerId: session.user.id,
        agentId: agent.id,
        planType,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/tools/${agent.id}?purchased=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/marketplace/${agent.id}`,
    });

    if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      return NextResponse.redirect(checkoutSession.url!, { status: 303 });
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: { code: "CHECKOUT_ERROR", message: "Failed to create checkout session" } },
      { status: 500 }
    );
  }
}
