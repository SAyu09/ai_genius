import { NextRequest, NextResponse } from "next/server";
import { db } from "@/backend/db";
import { purchases, sellerSettlements, sellerBankDetails } from "@/backend/db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";

/**
 * POST /api/cron/settlements
 *
 * Weekly settlement cron — processes pending payouts for verified sellers.
 * Called by Vercel cron or external scheduler every Sunday.
 * Authorization: Bearer token from CRON_SECRET env var.
 */
export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const result = await db.transaction(async (tx) => {
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
        return { processed: 0, skipped: 0, settlements: [] };
      }

      // 2. Filter to sellers with verified bank details only
      const verifiedSellers = await tx
        .select({ sellerId: sellerBankDetails.sellerId })
        .from(sellerBankDetails)
        .where(eq(sellerBankDetails.isVerified, true));

      const verifiedSet = new Set(verifiedSellers.map((s) => s.sellerId));

      const eligible = pendingPurchases.filter(
        (p) => verifiedSet.has(p.sellerId) && p.totalPayout >= 100
      );
      const skipped = pendingPurchases.length - eligible.length;

      // 3. Create settlement records with TDS deduction
      const TDS_RATE = 0.01; // 1% TDS
      const settlementsToInsert = eligible.map((p) => {
        const tds = Math.round(p.totalPayout * TDS_RATE);
        return {
          sellerId: p.sellerId,
          periodStart,
          periodEnd: now,
          grossPayoutCents: p.totalPayout,
          tdsDeductedCents: tds,
          refundDeductionsCents: 0,
          netPayoutCents: p.totalPayout - tds,
          status: "processing" as const,
        };
      });

      const insertedSettlements = await tx
        .insert(sellerSettlements)
        .values(settlementsToInsert)
        .returning({ id: sellerSettlements.id, sellerId: sellerSettlements.sellerId });

      // 4. Link purchases to their settlement record
      for (const settlement of insertedSettlements) {
        const sellerPurchases = eligible.find((p) => p.sellerId === settlement.sellerId);
        if (sellerPurchases && sellerPurchases.purchaseIds.length > 0) {
          await tx.update(purchases).set({
            settlementStatus: "settled",
            settlementId: settlement.id,
          }).where(inArray(purchases.id, sellerPurchases.purchaseIds));
        }
      }

      return {
        processed: insertedSettlements.length,
        skipped,
        settlements: insertedSettlements.map((s) => s.id),
      };
    });

    return NextResponse.json({
      success: true,
      ...result,
      periodStart: periodStart.toISOString(),
      periodEnd: now.toISOString(),
    });
  } catch (error) {
    console.error("Settlement cron error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
