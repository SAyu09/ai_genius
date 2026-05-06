import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/backend/lib/auth";
import { db } from "@/backend/db";
import { purchases, agents } from "@/backend/db/schema";
import { eq, sql } from "drizzle-orm";

/**
 * GET /api/purchases
 * Returns all agents the authenticated user has purchased (their library).
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userPurchases = await db
    .select({
      purchaseId: purchases.id,
      purchasedAt: purchases.purchasedAt,
      amountPaid: purchases.amountPaid,
      agentId: agents.id,
      agentSlug: agents.slug,
      agentName: agents.name,
      agentTag: agents.tag,
      agentDesc: agents.description,
    })
    .from(purchases)
    .innerJoin(agents, eq(purchases.agentId, agents.id))
    .where(eq(purchases.buyerId, session.user.id))
    .orderBy(sql`${purchases.purchasedAt} DESC`);

  return NextResponse.json({
    purchases: userPurchases.map((p) => ({
      ...p,
      amountPaid: p.amountPaid / 100,
    })),
  });
}
