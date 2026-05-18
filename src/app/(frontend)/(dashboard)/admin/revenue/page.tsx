import { auth } from "@/backend/lib/auth";
import { db } from "@/backend/db";
import { purchases, agents, users } from "@/backend/db/schema";
import { eq, sql, sum, count, gte, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default async function AdminRevenuePage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") redirect("/dashboard");

  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(now); weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(now); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);

  // All-time revenue
  const [allTime] = await db.select({ gross: sum(purchases.amountPaid), platform: sum(purchases.platformFee), seller: sum(purchases.sellerPayout), txCount: count() }).from(purchases);
  // This month
  const [monthly] = await db.select({ gross: sum(purchases.amountPaid), platform: sum(purchases.platformFee), txCount: count() }).from(purchases).where(gte(purchases.purchasedAt, monthStart));
  // This week
  const [weekly] = await db.select({ gross: sum(purchases.amountPaid), txCount: count() }).from(purchases).where(gte(purchases.purchasedAt, weekStart));
  // Today
  const [today] = await db.select({ gross: sum(purchases.amountPaid), txCount: count() }).from(purchases).where(gte(purchases.purchasedAt, todayStart));

  // Top agents by revenue
  const topAgents = await db
    .select({ agentId: purchases.agentId, agentName: agents.name, sellerName: users.name, total: sum(purchases.amountPaid), txCount: count() })
    .from(purchases)
    .innerJoin(agents, eq(purchases.agentId, agents.id))
    .innerJoin(users, eq(purchases.sellerId, users.id))
    .groupBy(purchases.agentId, agents.name, users.name)
    .orderBy(desc(sum(purchases.amountPaid)))
    .limit(10);

  const fmt = (v: string | number | null) => `$${(Number(v || 0) / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <DollarSign className="h-5 w-5 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Admin</span>
        </div>
        <h1 className="font-display text-3xl font-bold">Revenue Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Track gross transactions, platform commission, and seller payouts.</p>
      </div>

      {/* Revenue Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-2xl border-none shadow-sm bg-primary/5">
          <CardContent className="p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">All-Time Gross</div>
            <div className="text-3xl font-bold mt-1">{fmt(allTime?.gross)}</div>
            <div className="text-xs text-muted-foreground mt-1">{Number(allTime?.txCount || 0)} transactions</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Platform Fee (15%)</div>
            <div className="text-2xl font-bold mt-1 text-green-600">{fmt(allTime?.platform)}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">This Month</div>
            <div className="text-2xl font-bold mt-1">{fmt(monthly?.gross)}</div>
            <div className="text-xs text-muted-foreground mt-1">{Number(monthly?.txCount || 0)} txns</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Today</div>
            <div className="text-2xl font-bold mt-1">{fmt(today?.gross)}</div>
            <div className="text-xs text-muted-foreground mt-1">{Number(today?.txCount || 0)} txns</div>
          </CardContent>
        </Card>
      </div>

      {/* Top Agents */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Top Agents by Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left px-4 py-2 text-xs uppercase tracking-wider text-muted-foreground">#</th>
                  <th className="text-left px-4 py-2 text-xs uppercase tracking-wider text-muted-foreground">Agent</th>
                  <th className="text-left px-4 py-2 text-xs uppercase tracking-wider text-muted-foreground">Seller</th>
                  <th className="text-right px-4 py-2 text-xs uppercase tracking-wider text-muted-foreground">Revenue</th>
                  <th className="text-right px-4 py-2 text-xs uppercase tracking-wider text-muted-foreground">Txns</th>
                </tr>
              </thead>
              <tbody>
                {topAgents.map((row, i) => (
                  <tr key={row.agentId} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3 font-semibold">{row.agentName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.sellerName}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold">{fmt(row.total)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{Number(row.txCount)}</td>
                  </tr>
                ))}
                {topAgents.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No transactions yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
