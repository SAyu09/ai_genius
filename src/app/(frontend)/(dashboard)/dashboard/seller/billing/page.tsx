import { auth } from "@/backend/lib/auth";
import { db } from "@/backend/db";
import { agents, purchases, sellerProfiles, sellerSettlements, sellerBankDetails } from "@/backend/db/schema";
import { eq, inArray, sum, count, desc } from "drizzle-orm";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Wallet, CreditCard, Clock, CheckCircle, TrendingUp, AlertCircle, BanknoteIcon, ArrowUpRight } from "lucide-react";
import { redirect } from "next/navigation";
import { SettlementDetailsForm } from "../SettlementDetailsForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Billing & Payout — Seller Dashboard",
  description: "Track your earnings, manage payouts, and view settlement history.",
};

export default async function SellerBillingPage() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "seller" && session.user.role !== "admin")) redirect("/marketplace");

  // Fetch seller profile
  const [profile] = await db.select({ settlementStatus: sellerProfiles.settlementStatus }).from(sellerProfiles).where(eq(sellerProfiles.userId, session.user.id)).limit(1);
  const settlementStatus = profile?.settlementStatus || "pending_details";

  // Fetch bank details
  const [bankDetails] = await db.select().from(sellerBankDetails).where(eq(sellerBankDetails.sellerId, session.user.id)).limit(1);

  // Fetch seller's agents
  const myAgents = await db.query.agents.findMany({
    where: eq(agents.sellerId, session.user.id),
  });
  const agentIds = myAgents.map((a) => a.id);

  // Revenue stats
  let totalRevenueCents = 0;
  let platformFeeCents = 0;
  let pendingPayoutCents = 0;

  if (agentIds.length > 0) {
    const [revenueRes] = await db
      .select({
        totalPayout: sum(purchases.sellerPayout),
        totalFee: sum(purchases.platformFee),
        totalPending: sum(purchases.sellerPayout),
      })
      .from(purchases)
      .where(inArray(purchases.agentId, agentIds));

    totalRevenueCents = Number(revenueRes?.totalPayout || 0);
    platformFeeCents = Number(revenueRes?.totalFee || 0);

    // Pending = unsettled purchases
    const [pendingRes] = await db
      .select({ total: sum(purchases.sellerPayout) })
      .from(purchases)
      .where(inArray(purchases.agentId, agentIds));
    pendingPayoutCents = Number(pendingRes?.total || 0);
  }

  // Fetch settlement history
  const settlements = await db
    .select()
    .from(sellerSettlements)
    .where(eq(sellerSettlements.sellerId, session.user.id))
    .orderBy(desc(sellerSettlements.createdAt))
    .limit(20);

  const formatCurrency = (cents: number) => (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Billing & Payout</h1>
        <p className="text-muted-foreground text-sm mt-1">Track your earnings and manage payout settings.</p>
      </div>

      {/* Bank Setup Banner */}
      {settlementStatus === "pending_details" && (
        <Card className="mb-8 rounded-3xl border-orange-500/20 bg-orange-500/5 shadow-sm p-6 lg:p-8">
          <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
            <div className="flex-1">
              <h2 className="font-display text-2xl font-bold mb-2">Setup Payouts</h2>
              <p className="text-muted-foreground text-sm max-w-xl mb-6">
                Provide your bank account details to receive weekly payouts. You&apos;ll receive 85% of every transaction.
              </p>
              <SettlementDetailsForm />
            </div>
          </div>
        </Card>
      )}

      {settlementStatus === "pending_verification" && (
        <Card className="mb-8 rounded-3xl border-blue-500/20 bg-blue-500/5 shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="shrink-0 p-3 bg-blue-500/10 rounded-full text-blue-600">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-800">Verification Pending</h3>
              <p className="text-blue-600/80 text-sm">Your bank details are being verified. This usually takes 1-2 business days.</p>
            </div>
          </div>
        </Card>
      )}

      {/* Revenue Cards */}
      <div className="grid gap-4 sm:grid-cols-3 mb-10">
        <Card className="rounded-2xl border-none bg-background shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Earned</CardTitle>
            <div className="rounded-lg bg-green-500/10 p-2 text-green-600"><TrendingUp className="h-4 w-4" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenueCents)}</div>
            <p className="text-xs text-green-600 font-medium mt-1">Lifetime earnings</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none bg-background shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pending Payout</CardTitle>
            <div className="rounded-lg bg-yellow-500/10 p-2 text-yellow-600"><Wallet className="h-4 w-4" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(pendingPayoutCents)}</div>
            <p className="text-xs text-yellow-600 font-medium mt-1">Settles on 1st of month</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none bg-background shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Platform Fee</CardTitle>
            <div className="rounded-lg bg-muted p-2 text-muted-foreground"><CreditCard className="h-4 w-4" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(platformFeeCents)}</div>
            <p className="text-xs text-muted-foreground mt-1">15% platform commission</p>
          </CardContent>
        </Card>
      </div>

      {/* Bank Details Status */}
      {bankDetails && (
        <Card className="rounded-2xl mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-primary/10 p-3 text-primary">
                  <BanknoteIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Bank Account</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {bankDetails.bankName} · ****{bankDetails.accountNumberEncrypted.slice(-4)} · {bankDetails.accountType}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {bankDetails.isVerified ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-500/10 px-3 py-1 rounded-full">
                    <CheckCircle className="h-3 w-3" /> Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-yellow-600 bg-yellow-500/10 px-3 py-1 rounded-full">
                    <Clock className="h-3 w-3" /> Pending
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settlement History */}
      <section>
        <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          Settlement History
        </h2>
        {settlements.length > 0 ? (
          <div className="rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left font-semibold px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">Period</th>
                  <th className="text-left font-semibold px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">Gross</th>
                  <th className="text-left font-semibold px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">Deductions</th>
                  <th className="text-left font-semibold px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">Net Payout</th>
                  <th className="text-left font-semibold px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="text-left font-semibold px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">Reference</th>
                </tr>
              </thead>
              <tbody>
                {settlements.map((s) => (
                  <tr key={s.id} className="border-b last:border-b-0 hover:bg-muted/20 transition">
                    <td className="px-4 py-3 text-xs">
                      {new Date(s.periodStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {new Date(s.periodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(s.grossPayoutPaise / 100)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatCurrency((s.tdsDeductedPaise + s.refundDeductionsPaise) / 100)}</td>
                    <td className="px-4 py-3 font-semibold text-green-600">{formatCurrency(s.netPayoutPaise / 100)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        s.status === "completed" ? "bg-green-500/10 text-green-600" :
                        s.status === "processing" ? "bg-blue-500/10 text-blue-600" :
                        "bg-red-500/10 text-red-500"
                      }`}>
                        {s.status === "completed" ? <CheckCircle className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
                        {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{s.bankReferenceNumber || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Card className="rounded-2xl border-dashed bg-transparent">
            <CardContent className="p-10 text-center">
              <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No settlements yet. Payouts begin after your first sale.</p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
