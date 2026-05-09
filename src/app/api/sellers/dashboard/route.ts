import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/backend/lib/auth";
import { db } from "@/backend/db";
import { agents, purchases, users, sellerProfiles } from "@/backend/db/schema";
import { eq, sql } from "drizzle-orm";

/**
 * GET /api/sellers/dashboard
 * Returns the seller's listed agents, total revenue, and sales stats.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  const currentUser = session?.user;
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = currentUser.role;
  if (role !== "seller" && role !== "admin") {
    return NextResponse.json(
      { error: "Only sellers can access the dashboard" },
      { status: 403 }
    );
  }

  // Fetch seller's agents
  const sellerAgents = await db
    .select()
    .from(agents)
    .where(eq(agents.sellerId, currentUser.id!))
    .orderBy(sql`${agents.createdAt} DESC`);

  // Calculate total revenue from all their agent purchases
  const revenueResult = await db
    .select({
      totalRevenue: sql<number>`COALESCE(SUM(${purchases.sellerPayout}), 0)`,
      totalSales: sql<number>`COUNT(${purchases.id})`,
    })
    .from(purchases)
    .innerJoin(agents, eq(purchases.agentId, agents.id))
    .where(eq(agents.sellerId, currentUser.id!));

  const { totalRevenue, totalSales } = revenueResult[0] || {
    totalRevenue: 0,
    totalSales: 0,
  };

  // Check settlement details status
  const [profile] = await db
    .select({
      settlementStatus: sellerProfiles.settlementStatus,
    })
    .from(sellerProfiles)
    .where(eq(sellerProfiles.userId, currentUser.id!))
    .limit(1);

  return NextResponse.json({
    agents: sellerAgents.map((a) => ({
      ...a,
      monthlyPrice: (a.monthlyPricePaise || 0) / 100,
      annualPrice: (a.annualPricePaise || 0) / 100,
    })),
    stats: {
      totalRevenue: totalRevenue / 100, // paise → rupees
      totalSales,
      agentCount: sellerAgents.length,
    },
    settlement: {
      status: profile?.settlementStatus || "pending_details",
    },
  });
}
