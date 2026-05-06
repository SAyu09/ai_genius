import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/backend/lib/auth";
import { cancelSubscription } from "@/features/subscriptions/services/subscriptionService";

type Props = { params: Promise<{ id: string }> };

/**
 * DELETE /api/subscriptions/[id]
 * Cancels a subscription (via Stripe + DB update).
 */
export async function DELETE(req: NextRequest, { params }: Props) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    );
  }

  const { id } = await params;

  const result = await cancelSubscription(id, session.user.id);

  if (!result.success) {
    return NextResponse.json(
      { error: { code: "CANCEL_FAILED", message: result.error! } },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true, cancelledAt: new Date().toISOString() });
}
