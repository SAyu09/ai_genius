import { NextResponse } from "next/server";
import { withAuth } from "@/backend/lib/api";
import { stripe, getCheckoutParams, getLocalizedPaymentMethods } from "@/backend/lib/stripe";
import { db } from "@/backend/db";
import { agents, users } from "@/backend/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getActiveSubscription } from "@/backend/lib/subscriptions";

export const POST = withAuth(async ({ userId, req }) => {
  try {
    let agentId: string | undefined;
    let planType: "monthly" | "annual" | "one_time" | "trial" = "monthly";
    let checkoutMode: "embedded" | "hosted" = "hosted";

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      agentId = formData.get("agentId") as string;
      planType = (formData.get("planType") as "monthly" | "annual" | "one_time" | "trial") || "monthly";
      checkoutMode = (formData.get("checkoutMode") as "embedded" | "hosted") || "hosted";
    } else {
      const body = await req.json();
      agentId = body.agentId;
      planType = body.planType || "monthly";
      checkoutMode = body.checkoutMode || "hosted";
    }

    if (!agentId) {
      return NextResponse.json({ error: { code: "MISSING_AGENT", message: "agentId is required" } }, { status: 400 });
    }

    // 1. Check already subscribed
    const existing = await getActiveSubscription(userId, agentId);
    if (existing.active) {
      const redirectUrl = new URL(`/tools/${agentId}`, req.url);
      if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
        return NextResponse.redirect(redirectUrl, { status: 303 });
      }
      return NextResponse.json({ alreadySubscribed: true, url: redirectUrl.toString() });
    }

    // 2. Fetch agent + user in parallel
    const [agent, user] = await Promise.all([
      db.query.agents.findFirst({
        where: and(eq(agents.id, agentId), inArray(agents.status, ['approved', 'published'])),
        columns: { 
          id: true, name: true, description: true, pricingModel: true, 
          monthlyPricePaise: true, annualPricePaise: true, 
          stripePriceIdMonthly: true, stripePriceIdAnnual: true, sellerId: true 
        }
      }),
      db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { email: true, name: true, stripeCustomerId: true }
      })
    ]);

    if (!agent) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Agent not found or unavailable" } }, { status: 404 });
    }

    // 3. Ensure Stripe customer
    let stripeCustomerId = user!.stripeCustomerId;
    
    // Verify customer exists in Stripe if we have an ID
    if (stripeCustomerId) {
      try {
        const existingCustomer = await stripe.customers.retrieve(stripeCustomerId);
        if (existingCustomer.deleted) {
          stripeCustomerId = null;
        }
      } catch (err: any) {
        if (err.code === 'resource_missing') {
          stripeCustomerId = null;
        } else {
          throw err;
        }
      }
    }

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user!.email,
        name: user!.name ?? undefined,
        metadata: { userId, platform: 'aigenius' }
      });
      stripeCustomerId = customer.id;
      await db.update(users).set({ stripeCustomerId }).where(eq(users.id, userId));
    }

    // 4. Map Pricing Model
    let unitAmount = 0;
    let mode: "subscription" | "payment" = "subscription";
    let lineItemConfig: any = {};

    if (agent.pricingModel === "subscription" || agent.pricingModel === "tiered_subscription") {
      mode = "subscription";
      const interval: "month" | "year" = planType === "annual" ? "year" : "month";
      unitAmount = planType === "annual"
        ? (agent.annualPricePaise || 0)
        : (agent.monthlyPricePaise || 0);

      if (unitAmount === 0) {
        return NextResponse.json({ error: { code: "INVALID_PRICE", message: "Pricing not configured for this agent." } }, { status: 400 });
      }

      lineItemConfig = {
        price_data: {
          currency: "usd",
          product_data: { name: agent.name, description: agent.description },
          unit_amount: unitAmount,
          recurring: { interval },
        },
        quantity: 1,
      };
    } else if (agent.pricingModel === "usage_based") {
      mode = "subscription";
      lineItemConfig = {
        price_data: {
          currency: "usd",
          product_data: { name: `${agent.name} (Usage-Based)`, description: "Pay per successful transaction or token." },
          unit_amount: 0, // Setup base zero-dollar subscription; usage is metered subsequently via webhooks
          recurring: { interval: "month" },
        },
        quantity: 1,
      };
    } else if (agent.pricingModel === "outcome_based") {
      mode = "payment"; // Escrow setup
      unitAmount = agent.monthlyPricePaise || 5000; // Use an initial escrow amount
      lineItemConfig = {
        price_data: {
          currency: "usd",
          product_data: { name: `${agent.name} (Outcome Escrow)`, description: "Escrow payment for promised outcome." },
          unit_amount: unitAmount,
        },
        quantity: 1,
      };
    } else {
      mode = "payment";
      unitAmount = agent.monthlyPricePaise || 0; // Using monthly price for one_time as a fallback
      if (unitAmount === 0) {
        return NextResponse.json({ error: { code: "INVALID_PRICE", message: "Pricing not configured for this agent." } }, { status: 400 });
      }

      lineItemConfig = {
        price_data: {
          currency: "usd",
          product_data: { name: agent.name, description: agent.description },
          unit_amount: unitAmount,
        },
        quantity: 1,
      };
    }

    // 5. Create session using Stripe UI Mode Helpers
    const idempotencyKey = `checkout:${userId}:${agentId}:${planType}:${Date.now()}`;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const uiParams = getCheckoutParams(checkoutMode, baseUrl);

    const sessionParams: any = {
      ...uiParams,
      mode,
      customer: stripeCustomerId,
      line_items: [lineItemConfig],
      payment_method_types: getLocalizedPaymentMethods('usd'),
      expires_at: Math.floor(Date.now() / 1000) + 1800,
      metadata: { buyerId: userId, agentId, sellerId: agent.sellerId, planType, pricingModel: agent.pricingModel, platform: 'aigenius' },
    };

    if (mode === "subscription") {
      sessionParams.subscription_data = {
        trial_period_days: planType === 'trial' ? 7 : undefined,
        metadata: { buyerId: userId, agentId, sellerId: agent.sellerId, platform: 'aigenius' }
      };
    } else {
      sessionParams.payment_intent_data = {
        metadata: { buyerId: userId, agentId, sellerId: agent.sellerId }
      };
    }

    const checkoutSession = await stripe.checkout.sessions.create(sessionParams, { idempotencyKey });

    // Return embedded client secret if requested, otherwise URL
    if (checkoutMode === 'embedded') {
      return NextResponse.json({ clientSecret: checkoutSession.client_secret });
    }

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
});
