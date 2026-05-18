import { NextResponse } from "next/server";
import { withAdmin } from "@/backend/lib/api";
import { db } from "@/backend/db";
import { sellerSettlements, purchases } from "@/backend/db/schema";
import { eq, and } from "drizzle-orm";

export const POST = withAdmin(async ({ userId, req }) => {
  const url = new URL(req.url);
  const parts = url.pathname.split("/");
  const settlementId = parts[parts.indexOf("settlements") + 1];
  const { bankReferenceNumber } = await req.json();

  if (!bankReferenceNumber) {
    return NextResponse.json({ error: "Bank reference number required" }, { status: 400 });
  }

  await db.transaction(async (tx) => {
    // Mark settlement as completed
    await tx.update(sellerSettlements).set({
      status: "completed",
      bankReferenceNumber,
      settledAt: new Date(),
    }).where(eq(sellerSettlements.id, settlementId));

    // Mark related purchases as settled
    await tx.update(purchases).set({
      settlementStatus: "settled",
    }).where(eq(purchases.settlementId, settlementId));
  });

  return NextResponse.json({ ok: true });
});
