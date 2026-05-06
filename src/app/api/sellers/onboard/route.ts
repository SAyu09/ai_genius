import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/backend/lib/auth";
import { stripe } from "@/backend/lib/stripe";
import { db } from "@/backend/db";
import { users } from "@/backend/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  let stripeAccountId = dbUser?.stripeAccountId;

  try {
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: session.user.email!,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      stripeAccountId = account.id;

      await db
        .update(users)
        .set({ stripeAccountId, role: "seller" })
        .where(eq(users.id, session.user.id));
    }

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/seller/stripe-connect`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/seller?stripe=connected`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error: any) {
    console.error("Stripe Connect Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create Stripe account" },
      { status: 500 }
    );
  }
}

