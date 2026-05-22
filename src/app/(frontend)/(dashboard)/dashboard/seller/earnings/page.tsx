import { auth } from "@/backend/lib/auth";
import { db } from "@/backend/db";
import { purchases, sellerSettlements, sellerBankDetails } from "@/backend/db/schema";
import { eq, and, sum, count, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Button } from "@/frontend/components/ui/button";
import { DollarSign, CheckCircle, Wallet, ArrowRight, AlertTriangle, Activity } from "lucide-react";
import Link from "next/link";
import { TelemetryCharts } from "./TelemetryCharts";

export default async function SellerEarningsPage() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "seller" && session.user.role !== "admin")) redirect("/dashboard");

  const sellerId = session.user.id;

  // Check bank details
  const bankDetails = await db.query.sellerBankDetails.findFirst({
    where: eq(sellerBankDetails.sellerId, sellerId),
    columns: { isVerified: true },
  });

  // Pending earnings (unsettled)
  const [pendingEarnings] = await db
    .select({ total: sum(purchases.sellerPayout), txCount: count() })
    .from(purchases)
    .where(and(eq(purchases.sellerId, sellerId), eq(purchases.settlementStatus, "pending")));

  // All-time earnings
  const [allTimeEarnings] = await db
    .select({ total: sum(purchases.sellerPayout), txCount: count() })
    .from(purchases)
    .where(eq(purchases.sellerId, sellerId));

  // Settlement history
  const settlements = await db
    .select()
    .from(sellerSettlements)
    .where(eq(sellerSettlements.sellerId, sellerId))
    .orderBy(desc(sellerSettlements.createdAt))
    .limit(20);

  const fmt = (v: string | number | null) => `$${(Number(v || 0) / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Activity className="h-5 w-5 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Creator Studio</span>
        </div>
        <h1 className="font-display text-3xl font-bold">Telemetry & Earnings</h1>
        <p className="text-muted-foreground text-sm mt-1">Track actionable performance metrics and revenue settlements.</p>
      </div>

      {/* Actionable Insights Bar */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 shrink-0">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-indigo-900">Actionable Insight: Optimization Opportunity</h3>
            <p className="text-xs text-indigo-700">"Acme Sales Agent" has a 40% user drop-off at prompt #3. Consider simplifying the required inputs.</p>
          </div>
        </div>
        <Button variant="outline" className="shrink-0 bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-100">View Logs</Button>
      </div>

      {/* Telemetry Charts (Client Component) */}
      <TelemetryCharts />

      {/* Bank details warning */}
      {!bankDetails?.isVerified && (
        <Card className="rounded-2xl border-yellow-500/30 bg-yellow-500/5 mt-8">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-yellow-700">Bank details required for payouts</p>
              <p className="text-xs text-yellow-600 mt-0.5">
                Complete your KYC progressively to receive the earnings below.
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="rounded-xl shrink-0 border-yellow-500/30 text-yellow-700 hover:bg-yellow-50">
              <Link href="/dashboard/seller/billing">Update Bank Details <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mt-8">
        <Card className="rounded-2xl border-none shadow-sm bg-primary/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <Wallet className="h-3.5 w-3.5" /> Pending Payout
            </div>
            <div className="text-3xl font-bold mt-2">{fmt(pendingEarnings?.total)}</div>
            <div className="text-xs text-muted-foreground mt-1">{Number(pendingEarnings?.txCount || 0)} unsettled transactions</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5" /> All-Time Earned
            </div>
            <div className="text-2xl font-bold mt-2">{fmt(allTimeEarnings?.total)}</div>
            <div className="text-xs text-muted-foreground mt-1">{Number(allTimeEarnings?.txCount || 0)} total transactions</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <CheckCircle className="h-3.5 w-3.5" /> Settlements
            </div>
            <div className="text-2xl font-bold mt-2">{settlements.length}</div>
            <div className="text-xs text-muted-foreground mt-1">{settlements.filter(s => s.status === "completed").length} completed</div>
          </CardContent>
        </Card>
      </div>

      {/* Settlement History */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-sm">Settlement History</CardTitle>
        </CardHeader>
        <CardContent>
          {settlements.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left px-4 py-2 text-xs uppercase text-muted-foreground">Period</th>
                  <th className="text-right px-4 py-2 text-xs uppercase text-muted-foreground">Net</th>
                  <th className="text-left px-4 py-2 text-xs uppercase text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {settlements.map((s) => (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="px-4 py-3 text-xs">
                      {s.periodStart.toLocaleDateString()} — {s.periodEnd.toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold">{fmt(s.netPayoutPaise)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                        s.status === "completed" ? "bg-green-500/10 text-green-600" :
                        s.status === "failed" ? "bg-red-500/10 text-red-500" :
                        "bg-yellow-500/10 text-yellow-600"
                      }`}>{s.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">No settlements yet. Settlements are processed weekly.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
