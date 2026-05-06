import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/backend/lib/auth";
import { checkSubscription } from "@/features/subscriptions/services/subscriptionService";
import { generateEmbedToken } from "@/features/tools/services/tokenService";
import { db } from "@/backend/db";
import { subscriptions } from "@/backend/db/schema";
import { eq, and } from "drizzle-orm";
import type { PlanType } from "@/types/auth.types";

type Props = { params: Promise<{ agentId: string }> };

/**
 * POST /api/tools/[agentId]/token
 * Generates a short-lived JWT embed token for the tool iframe.
 * Requires active subscription — subscription check is server-side.
 */
export async function POST(req: NextRequest, { params }: Props) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    );
  }

  const { agentId } = await params;

  // Server-side subscription check — never trust client claims
  const hasAccess = await checkSubscription(session.user.id, agentId);
  if (!hasAccess) {
    return NextResponse.json(
      { error: { code: "SUBSCRIPTION_REQUIRED", message: "Active subscription required" } },
      { status: 403 }
    );
  }

  // Get plan type for the token payload
  const [sub] = await db
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

  const plan = (sub?.planType as "trial" | "monthly" | "annual") || "monthly";

  try {
    const { token, expiresAt } = await generateEmbedToken(
      session.user.id,
      agentId,
      plan
    );

    return NextResponse.json({ token, expiresAt });
  } catch (error) {
    console.error("Token generation error:", error);
    return NextResponse.json(
      { error: { code: "TOKEN_ERROR", message: "Failed to generate token" } },
      { status: 500 }
    );
  }
}
