import { NextRequest, NextResponse } from "next/server";
import { db } from "@/backend/db";
import { purchases, sellerSettlements } from "@/backend/db/schema";
import { eq, inArray, sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  // Validate cron secret if provided
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await db.transaction(async (tx) => {
      // 1. Fetch all pending purchases grouped by seller
      const pendingPurchases = await tx
        .select({
          sellerId: purchases.sellerId,
          totalPayout: sql<number>`sum(${purchases.sellerPayout})::int`,
          purchaseIds: sql<string[]>`array_agg(${purchases.id})`,
        })
        .from(purchases)
        .where(eq(purchases.settlementStatus, "pending"))
        .groupBy(purchases.sellerId);

      if (pendingPurchases.length === 0) {
        return; // Nothing to settle
      }

      const now = new Date();
      // Assume a 7-day period ending now (or logic as required)
      const periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // 2. Create settlement records for each seller
      const settlementsToInsert = pendingPurchases.map((p) => ({
        sellerId: p.sellerId,
        periodStart,
        periodEnd: now,
        grossPayoutPaise: p.totalPayout,
        netPayoutPaise: p.totalPayout, // Adjust for TDS/refunds if needed
        status: "processing" as const,
      }));

      const insertedSettlements = await tx
        .insert(sellerSettlements)
        .values(settlementsToInsert)
        .returning({ id: sellerSettlements.id, sellerId: sellerSettlements.sellerId });

      // 3. Map settlement IDs back to purchases and update them
      for (const settlement of insertedSettlements) {
        const sellerPurchases = pendingPurchases.find((p) => p.sellerId === settlement.sellerId);
        if (sellerPurchases && sellerPurchases.purchaseIds.length > 0) {
          await tx
            .update(purchases)
            .set({
              settlementStatus: "settled",
              settlementId: settlement.id,
            })
            .where(inArray(purchases.id, sellerPurchases.purchaseIds));
        }
      }
    });

    return NextResponse.json({ success: true, message: "Settlement batch completed successfully" });
  } catch (error) {
    console.error("Settlement cron error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
