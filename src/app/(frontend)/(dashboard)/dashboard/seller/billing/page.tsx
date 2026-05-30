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
    <div className="p-6 lg:p-8 max-w-[1000px] mx-auto">
      <div className="page-header mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Billing & Payout</h1>
        <p className="text-sm text-gray-500 mt-0.5">Track your earnings and manage payout settings.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 mb-10">
        {/* Left Column (60%): Forms & Bank Info */}
        <div className="flex-1 space-y-6">
          {/* Bank Setup Banner */}
          {settlementStatus === "pending_details" && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Setup Payouts</h2>
              <p className="text-sm text-gray-500 mb-6">
                Provide your bank account details to receive weekly payouts. You&apos;ll receive 85% of every transaction.
              </p>
              <SettlementDetailsForm />
            </div>
          )}

          {settlementStatus === "pending_verification" && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="shrink-0 p-2.5 bg-blue-100 rounded-full text-blue-600">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">Verification Pending</h3>
                  <p className="text-blue-700 text-sm">Your bank details are being verified. This usually takes 1-2 business days.</p>
                </div>
              </div>
            </div>
          )}

          {/* Bank Details Status */}
          {bankDetails && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-primary-subtle p-3 text-primary">
                    <BanknoteIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Bank Account</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {bankDetails.bankName} · ****{bankDetails.accountNumberEncrypted.slice(-4)} · {bankDetails.accountType}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {bankDetails.isVerified ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full">
                      <CheckCircle className="h-3.5 w-3.5" /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-yellow-700 bg-yellow-100 px-3 py-1 rounded-full">
                      <Clock className="h-3.5 w-3.5" /> Pending
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (40%): Revenue Cards */}
        <div className="lg:w-[340px] flex flex-col gap-4">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-md bg-green-100 p-1.5 text-green-600"><TrendingUp className="h-4 w-4" /></div>
              <h3 className="text-sm font-semibold text-gray-700">Total Earned</h3>
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenueCents)}</div>
            <p className="text-xs text-green-600 font-medium mt-1">Lifetime earnings</p>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-md bg-yellow-100 p-1.5 text-yellow-600"><Wallet className="h-4 w-4" /></div>
              <h3 className="text-sm font-semibold text-gray-700">Pending Payout</h3>
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(pendingPayoutCents)}</div>
            <p className="text-xs text-yellow-600 font-medium mt-1">Settles on 1st of month</p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-md bg-gray-200 p-1.5 text-gray-600"><CreditCard className="h-4 w-4" /></div>
              <h3 className="text-sm font-semibold text-gray-700">Platform Fee</h3>
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(platformFeeCents)}</div>
            <p className="text-xs text-gray-500 mt-1">15% platform commission</p>
          </div>
        </div>
      </div>

      {/* Settlement History */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold text-gray-900">Settlement History</h2>
        </div>
        {settlements.length > 0 ? (
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="text-left font-medium px-5 py-3 text-xs uppercase tracking-wider text-gray-500">Period</th>
                  <th className="text-left font-medium px-5 py-3 text-xs uppercase tracking-wider text-gray-500">Gross</th>
                  <th className="text-left font-medium px-5 py-3 text-xs uppercase tracking-wider text-gray-500">Deductions</th>
                  <th className="text-left font-medium px-5 py-3 text-xs uppercase tracking-wider text-gray-500">Net Payout</th>
                  <th className="text-left font-medium px-5 py-3 text-xs uppercase tracking-wider text-gray-500">Status</th>
                  <th className="text-left font-medium px-5 py-3 text-xs uppercase tracking-wider text-gray-500">Reference</th>
                </tr>
              </thead>
              <tbody>
                {settlements.map((s) => (
                  <tr key={s.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3 text-sm text-gray-900">
                      {new Date(s.periodStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {new Date(s.periodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-900">{formatCurrency(s.grossPayoutCents / 100)}</td>
                    <td className="px-5 py-3 text-gray-500">{formatCurrency((s.tdsDeductedCents + s.refundDeductionsCents) / 100)}</td>
                    <td className="px-5 py-3 font-semibold text-green-600">{formatCurrency(s.netPayoutCents / 100)}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        s.status === "completed" ? "bg-green-100 text-green-700" :
                        s.status === "processing" ? "bg-blue-100 text-blue-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {s.status === "completed" ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                        {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-400 font-mono">{s.bankReferenceNumber || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl py-12 flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No settlements yet. Payouts begin after your first sale.</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
