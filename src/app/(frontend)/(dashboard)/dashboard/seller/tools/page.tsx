import { auth } from "@/backend/lib/auth";
import { db } from "@/backend/db";
import { agents, purchases, users } from "@/backend/db/schema";
import { eq, inArray, desc } from "drizzle-orm";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent } from "@/frontend/components/ui/card";
import { Bot, Package, ArrowUpRight, Calendar, DollarSign, User, TrendingUp, Globe, Workflow } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Tools — Agent Transactions",
  description: "View your listed agents and their transaction history.",
};

const TYPE_CONFIG: Record<string, { label: string; icon: typeof Globe; className: string }> = {
  hosted: { label: "Website", icon: Globe, className: "bg-blue-500/10 text-blue-600" },
  workflow: { label: "n8n Agent", icon: Workflow, className: "bg-purple-500/10 text-purple-600" },
};

export default async function SellerToolsPage() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "seller" && session.user.role !== "admin")) redirect("/marketplace");

  // Fetch seller's approved agents
  const myAgents = await db.query.agents.findMany({
    where: eq(agents.sellerId, session.user.id),
  });

  const agentIds = myAgents.map((a) => a.id);

  // Fetch transactions for these agents
  let transactions: {
    purchase: typeof purchases.$inferSelect;
    agent: typeof agents.$inferSelect;
    buyer: typeof users.$inferSelect;
  }[] = [];

  if (agentIds.length > 0) {
    const rawTransactions = await db
      .select({ purchase: purchases, agent: agents, buyer: users })
      .from(purchases)
      .innerJoin(agents, eq(purchases.agentId, agents.id))
      .innerJoin(users, eq(purchases.buyerId, users.id))
      .where(inArray(purchases.agentId, agentIds))
      .orderBy(desc(purchases.purchasedAt))
      .limit(50);
    transactions = rawTransactions;
  }

  // Per-agent revenue breakdown
  const agentRevenue = new Map<string, number>();
  transactions.forEach(({ purchase }) => {
    const current = agentRevenue.get(purchase.agentId) || 0;
    agentRevenue.set(purchase.agentId, current + purchase.sellerPayout);
  });

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">My Tools</h1>
        <p className="text-muted-foreground text-sm mt-1">Your listed tools and their transaction history.</p>
      </div>

      {/* Per-agent revenue cards */}
      {myAgents.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-10">
            {myAgents.map((agent) => {
              const typeCfg = TYPE_CONFIG[agent.type] || TYPE_CONFIG.hosted;
              const TypeIcon = typeCfg.icon;
              const revenue = agentRevenue.get(agent.id) || 0;

              return (
                <Card key={agent.id} className="rounded-2xl overflow-hidden hover:shadow-md transition">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Bot className="h-5 w-5" />
                      </div>
                      <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${typeCfg.className}`}>
                        <TypeIcon className="h-2.5 w-2.5" />
                        {typeCfg.label}
                      </span>
                    </div>
                    <h3 className="font-semibold truncate">{agent.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{agent.description}</p>

                    <div className="mt-4 pt-3 border-t border-border grid grid-cols-3 gap-2">
                      <div>
                        <div className="text-xs text-muted-foreground">Revenue</div>
                        <div className="font-semibold text-sm text-green-600">${(revenue / 100).toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Sales</div>
                        <div className="font-semibold text-sm">{agent.salesCount || 0}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Active</div>
                        <div className="font-semibold text-sm">{agent.subscriberCount || 0}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Transaction History */}
          <section>
            <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Recent Transactions
            </h2>
            {transactions.length > 0 ? (
              <div className="rounded-2xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left font-semibold px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">Agent</th>
                      <th className="text-left font-semibold px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">Buyer</th>
                      <th className="text-left font-semibold px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">Type</th>
                      <th className="text-left font-semibold px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">Amount</th>
                      <th className="text-left font-semibold px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">Your Payout</th>
                      <th className="text-left font-semibold px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(({ purchase, agent, buyer }) => (
                      <tr key={purchase.id} className="border-b last:border-b-0 hover:bg-muted/20 transition">
                        <td className="px-4 py-3 font-medium truncate max-w-[150px]">{agent.name}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold overflow-hidden flex-shrink-0">
                              {buyer.image ? (
                                <img src={buyer.image} alt="" className="h-full w-full object-cover" />
                              ) : (
                                (buyer.name || "U")[0].toUpperCase()
                              )}
                            </div>
                            <span className="text-xs truncate max-w-[100px]">{buyer.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-muted text-muted-foreground capitalize">
                            {purchase.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium">${(purchase.amountPaid / 100).toFixed(2)}</td>
                        <td className="px-4 py-3 font-semibold text-green-600">${(purchase.sellerPayout / 100).toFixed(2)}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {new Date(purchase.purchasedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Card className="rounded-2xl border-dashed bg-transparent">
                <CardContent className="p-10 text-center">
                  <Package className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No transactions yet. Sales will appear here as buyers subscribe.</p>
                </CardContent>
              </Card>
            )}
          </section>
        </>
      ) : (
        <Card className="rounded-3xl border-dashed border-2 bg-transparent shadow-none min-h-[400px] flex items-center justify-center">
          <div className="text-center p-8">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-muted mb-6 opacity-50">
              <Package className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold font-display">No tools listed yet</h3>
            <p className="text-muted-foreground text-sm max-w-[300px] mx-auto mt-2">
              List your first agent to start tracking tools and transactions.
            </p>
            <Button asChild className="mt-6 rounded-xl">
              <Link href="/dashboard/list-agent">List an Agent</Link>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
