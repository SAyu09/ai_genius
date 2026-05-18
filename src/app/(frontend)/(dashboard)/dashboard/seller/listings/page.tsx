import { auth } from "@/backend/lib/auth";
import { db } from "@/backend/db";
import { agents, purchases, users } from "@/backend/db/schema";
import { eq, inArray, desc } from "drizzle-orm";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent } from "@/frontend/components/ui/card";
import { Bot, Package, TrendingUp, Globe, Workflow, Plus, Users, Clock, CheckCircle, XCircle, MessageSquare, FormInput } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ActionButtons } from "./ActionButtons";
import { DeveloperIntegrationModal } from "./DeveloperIntegrationModal";

export const metadata: Metadata = {
  title: "My Listings — Manage Agents",
  description: "View, manage, and track your AI agents.",
};

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: typeof CheckCircle }> = {
  approved: { label: "Live", className: "bg-green-500/10 text-green-600 border-green-500/20", icon: CheckCircle },
  pending: { label: "Pending", className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", icon: Clock },
  testing: { label: "Testing", className: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: Clock },
  pending_review: { label: "In Review", className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", icon: Clock },
  rejected_performance: { label: "Perf. Failed", className: "bg-red-500/10 text-red-500 border-red-500/20", icon: XCircle },
  rejected_admin: { label: "Rejected", className: "bg-red-500/10 text-red-500 border-red-500/20", icon: XCircle },
  suspended: { label: "Suspended", className: "bg-orange-500/10 text-orange-600 border-orange-500/20", icon: XCircle },
};

const TYPE_CONFIG: Record<string, { label: string; icon: typeof Globe; className: string }> = {
  chat: { label: "Chat Agent", icon: MessageSquare, className: "bg-blue-500/10 text-blue-600" },
  form: { label: "Form Tool", icon: FormInput, className: "bg-indigo-500/10 text-indigo-600" },
  workflow: { label: "n8n Agent", icon: Workflow, className: "bg-purple-500/10 text-purple-600" },
  hosted: { label: "Legacy Hosted", icon: Globe, className: "bg-gray-500/10 text-gray-600" },
};

export default async function SellerListingsPage() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "seller" && session.user.role !== "admin")) redirect("/marketplace");

  const myAgents = await db.query.agents.findMany({
    where: eq(agents.sellerId, session.user.id),
    orderBy: desc(agents.createdAt),
  });

  const agentIds = myAgents.map((a) => a.id);
  const approvedCount = myAgents.filter((a) => a.status === "approved").length;
  const totalSubscribers = myAgents.reduce((sum, a) => sum + (a.subscriberCount || 0), 0);

  // Fetch transactions for these agents
  let transactions: {
    purchase: typeof purchases.$inferSelect;
    agent: typeof agents.$inferSelect;
    buyer: typeof users.$inferSelect;
  }[] = [];

  if (agentIds.length > 0) {
    transactions = await db
      .select({ purchase: purchases, agent: agents, buyer: users })
      .from(purchases)
      .innerJoin(agents, eq(purchases.agentId, agents.id))
      .innerJoin(users, eq(purchases.buyerId, users.id))
      .where(inArray(purchases.agentId, agentIds))
      .orderBy(desc(purchases.purchasedAt))
      .limit(20);
  }

  // Per-agent revenue breakdown
  const agentRevenue = new Map<string, number>();
  transactions.forEach(({ purchase }) => {
    const current = agentRevenue.get(purchase.agentId) || 0;
    agentRevenue.set(purchase.agentId, current + purchase.sellerPayout);
  });

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">My Listings</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your agents and track transaction performance.</p>
        </div>
        <Button asChild className="rounded-xl gap-2 shadow-lg shadow-primary/20 self-start sm:self-auto">
          <Link href="/dashboard/list-agent">
            <Plus className="h-4 w-4" /> Create Listing
          </Link>
        </Button>
      </div>

      {/* Agents list */}
      {myAgents.length > 0 ? (
        <div className="grid gap-4">
          {myAgents.map((agent) => {
            const statusCfg = STATUS_CONFIG[agent.status] || STATUS_CONFIG.pending;
            const typeCfg = TYPE_CONFIG[agent.agentType || agent.type] || TYPE_CONFIG.hosted;
            const StatusIcon = statusCfg.icon;
            const TypeIcon = typeCfg.icon;
            const revenue = agentRevenue.get(agent.id) || 0;

            return (
              <Card key={agent.id} className="rounded-2xl border shadow-sm overflow-hidden p-0">
                <div className="flex flex-col md:flex-row">
                  {/* Left: Agent info */}
                  <div className="flex-1 p-5 flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Bot className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-lg truncate">{agent.name}</h3>
                        {/* Type badge */}
                        <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${typeCfg.className}`}>
                          <TypeIcon className="h-2.5 w-2.5" />
                          {typeCfg.label}
                        </span>
                        {/* Status badge */}
                        <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold border ${statusCfg.className}`}>
                          <StatusIcon className="h-2.5 w-2.5" />
                          {statusCfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mb-4">{agent.description}</p>

                      {/* Stats & Integrations row */}
                      <div className="flex flex-wrap items-center gap-4 text-xs">
                        <div className="flex items-center gap-4 text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" /> {agent.subscriberCount || 0} active
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3.5 w-3.5" /> ${(revenue / 100).toFixed(2)} earned
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex md:flex-col items-center justify-end gap-2 p-4 md:p-5 md:border-l border-t md:border-t-0 border-border bg-muted/10 md:w-48 shrink-0">
                    <ActionButtons agentId={agent.id} />
                    {agent.status === "approved" && (
                      <Button asChild size="sm" variant="ghost" className="h-8 rounded-lg text-xs w-full">
                        <Link href={`/marketplace/${agent.id}`}>View Marketplace</Link>
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="rounded-3xl border-dashed border-2 bg-transparent shadow-none min-h-[400px] flex items-center justify-center">
          <div className="text-center p-8">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-muted mb-6 opacity-50">
              <Package className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold font-display">No listings created yet</h3>
            <p className="text-muted-foreground text-sm max-w-[300px] mx-auto mt-2">
              Create your first agent listing to start accepting buyers.
            </p>
            <Button asChild className="mt-6 rounded-xl gap-2 shadow-lg shadow-primary/20">
              <Link href="/dashboard/list-agent">
                <Plus className="h-4 w-4" /> Create Listing
              </Link>
            </Button>
          </div>
        </Card>
      )}

      {/* Transaction History (from old tools logic) */}
      <section className="pt-4">
        <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Recent Transactions
        </h2>
        {transactions.length > 0 ? (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left font-semibold px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">Agent</th>
                  <th className="text-left font-semibold px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">Buyer</th>
                  <th className="text-left font-semibold px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">Amount</th>
                  <th className="text-left font-semibold px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">Your Payout</th>
                  <th className="text-left font-semibold px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(({ purchase, agent, buyer }) => (
                  <tr key={purchase.id} className="border-b last:border-b-0 hover:bg-muted/10 transition">
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
          <Card className="rounded-2xl border-dashed bg-transparent shadow-none">
            <CardContent className="p-10 text-center">
              <Package className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No transactions yet. Sales will appear here as buyers subscribe.</p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
