import { auth } from "@/backend/lib/auth";
import { db } from "@/backend/db";
import { sellerSettlements, sellerBankDetails, users, purchases } from "@/backend/db/schema";
import { eq, desc, sum, count, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Banknote, CheckCircle, Clock, XCircle } from "lucide-react";
import { SettlementActions } from "./SettlementActions";

export default async function AdminSettlementsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") redirect("/dashboard");

  // Pending settlements
  const pendingSettlements = await db
    .select({
      settlement: sellerSettlements,
      seller: { name: users.name, email: users.email },
    })
    .from(sellerSettlements)
    .innerJoin(users, eq(sellerSettlements.sellerId, users.id))
    .where(eq(sellerSettlements.status, "processing"))
    .orderBy(desc(sellerSettlements.createdAt));

  // Completed settlements
  const completedSettlements = await db
    .select({
      settlement: sellerSettlements,
      seller: { name: users.name, email: users.email },
    })
    .from(sellerSettlements)
    .innerJoin(users, eq(sellerSettlements.sellerId, users.id))
    .where(eq(sellerSettlements.status, "completed"))
    .orderBy(desc(sellerSettlements.settledAt))
    .limit(20);

  // Sellers with pending earnings (unsettled)
  const pendingEarnings = await db
    .select({ sellerId: purchases.sellerId, sellerName: users.name, total: sum(purchases.sellerPayout), txCount: count() })
    .from(purchases)
    .innerJoin(users, eq(purchases.sellerId, users.id))
    .where(eq(purchases.settlementStatus, "pending"))
    .groupBy(purchases.sellerId, users.name)
    .orderBy(desc(sum(purchases.sellerPayout)));

  const fmt = (v: number) => `₹${(v / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
    processing: { label: "Processing", className: "bg-yellow-500/10 text-yellow-600", icon: Clock },
    completed: { label: "Completed", className: "bg-green-500/10 text-green-600", icon: CheckCircle },
    failed: { label: "Failed", className: "bg-red-500/10 text-red-500", icon: XCircle },
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Banknote className="h-5 w-5 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Admin</span>
        </div>
        <h1 className="font-display text-3xl font-bold">Settlement Management</h1>
        <p className="text-muted-foreground text-sm mt-1">Process seller payouts, verify bank details, and track settlement history.</p>
      </div>

      {/* Pending Earnings (sellers with unsettled purchases) */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-sm">Unsettled Earnings by Seller</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left px-4 py-2 text-xs uppercase text-muted-foreground">Seller</th>
                <th className="text-right px-4 py-2 text-xs uppercase text-muted-foreground">Pending Payout</th>
                <th className="text-right px-4 py-2 text-xs uppercase text-muted-foreground">Transactions</th>
              </tr>
            </thead>
            <tbody>
              {pendingEarnings.map((row) => (
                <tr key={row.sellerId} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 font-semibold">{row.sellerName}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold">{fmt(Number(row.total || 0))}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{Number(row.txCount)}</td>
                </tr>
              ))}
              {pendingEarnings.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">No pending earnings.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Processing Settlements */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-600" /> Pending Settlements ({pendingSettlements.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingSettlements.map(({ settlement, seller }) => (
            <div key={settlement.id} className="flex items-center justify-between p-4 rounded-xl border bg-yellow-500/5">
              <div>
                <div className="font-semibold text-sm">{seller.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {settlement.periodStart.toLocaleDateString()} — {settlement.periodEnd.toLocaleDateString()} · Net: {fmt(settlement.netPayoutPaise)}
                </div>
              </div>
              <SettlementActions settlementId={settlement.id} />
            </div>
          ))}
          {pendingSettlements.length === 0 && (
            <div className="text-center py-6 text-muted-foreground text-sm">No settlements pending.</div>
          )}
        </CardContent>
      </Card>

      {/* Completed */}
      <Card className="rounded-2xl">
        <CardHeader><CardTitle className="text-sm">Recent Completed Settlements</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left px-4 py-2 text-xs uppercase text-muted-foreground">Seller</th>
                <th className="text-left px-4 py-2 text-xs uppercase text-muted-foreground">Period</th>
                <th className="text-right px-4 py-2 text-xs uppercase text-muted-foreground">Net Payout</th>
                <th className="text-left px-4 py-2 text-xs uppercase text-muted-foreground">Bank Ref</th>
                <th className="text-left px-4 py-2 text-xs uppercase text-muted-foreground">Settled</th>
              </tr>
            </thead>
            <tbody>
              {completedSettlements.map(({ settlement, seller }) => (
                <tr key={settlement.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-semibold">{seller.name}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {settlement.periodStart.toLocaleDateString()} — {settlement.periodEnd.toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{fmt(settlement.netPayoutPaise)}</td>
                  <td className="px-4 py-3 text-xs font-mono">{settlement.bankReferenceNumber || "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{settlement.settledAt?.toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
