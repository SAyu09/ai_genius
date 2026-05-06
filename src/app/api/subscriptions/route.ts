import { NextResponse } from "next/server";
import { auth } from "@/backend/lib/auth";
import { getUserSubscriptions } from "@/features/subscriptions/services/subscriptionService";

/**
 * GET /api/subscriptions
 * Returns the authenticated user's subscriptions with agent details.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    );
  }

  try {
    const subs = await getUserSubscriptions(session.user.id);

    return NextResponse.json({
      subscriptions: subs.map(({ subscription, agent }) => ({
        id: subscription.id,
        agentId: agent.id,
        agentName: agent.name,
        agentDescription: agent.description,
        agentCategory: agent.category,
        planType: subscription.planType,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelledAt: subscription.cancelledAt,
        createdAt: subscription.createdAt,
      })),
    });
  } catch (error) {
    console.error("Fetch subscriptions error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch subscriptions" } },
      { status: 500 }
    );
  }
}
