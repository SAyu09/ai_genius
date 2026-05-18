import { auth } from "@/backend/lib/auth";
import { db } from "@/backend/db";
import { agents, purchases, users } from "@/backend/db/schema";
import { eq, inArray, desc } from "drizzle-orm";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent } from "@/frontend/components/ui/card";
import { Bot, Package, TrendingUp, Globe, Workflow, Plus, Users, Clock, CheckCircle, XCircle, MessageSquare, FormInput, ExternalLink } from "lucide-react";
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
    <div className="space-y-8">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your agents and track transaction performance.</p>
        </div>
        <div className="header-actions">
          <Button asChild size="default" className="gap-2">
            <Link href="/dashboard/list-agent">
              <Plus className="h-4 w-4" /> Create Listing
            </Link>
          </Button>
        </div>
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
              <div key={agent.id} className="flex flex-col md:flex-row items-center gap-4 bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-gray-300 transition-all duration-200">
                {/* Left: Agent icon */}
                <div className="h-12 w-12 rounded-xl bg-primary-subtle flex items-center justify-center shrink-0">
                  <TypeIcon className="h-[22px] w-[22px] text-primary" />
                </div>
                
                {/* Middle: Agent info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <h3 className="text-base font-semibold text-gray-900 truncate">{agent.name}</h3>
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">
                      {typeCfg.label}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${statusCfg.className}`}>
                      <StatusIcon className="h-3 w-3" />
                      {statusCfg.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-1">{agent.description}</p>

                  {/* Stats row */}
                  <div className="flex flex-wrap items-center gap-4 mt-2">
                    <span className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Users className="h-3.5 w-3.5 text-gray-400" /> {agent.subscriberCount || 0} active
                    </span>
                    <span className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                      <TrendingUp className="h-3.5 w-3.5 text-green-500" /> ${(revenue / 100).toFixed(2)} earned
                    </span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-row md:flex-col items-center justify-end gap-1 shrink-0 mt-4 md:mt-0 w-full md:w-36">
                  <ActionButtons agentId={agent.id} />
                  {agent.status === "approved" && (
                    <Button asChild size="sm" variant="ghost" className="w-full justify-start h-8 rounded-md text-sm gap-2 text-gray-700">
                      <Link href={`/marketplace/${agent.id}`}>
                        <ExternalLink className="h-4 w-4 text-gray-500" /> View Marketplace
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl py-16 flex items-center justify-center">
          <div className="text-center">
            <Bot className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-500">No agents listed yet</h3>
            <p className="text-sm text-gray-400 mt-1 max-w-[300px] mx-auto">
              Create your first listing and start earning.
            </p>
            <Button asChild size="default" className="mt-4 gap-2">
              <Link href="/dashboard/list-agent">
                <Plus className="h-4 w-4" /> Create your first listing
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <section className="pt-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
        </div>
        {transactions.length > 0 ? (
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="text-left font-medium px-5 py-3 text-xs uppercase tracking-wider text-gray-500">Agent</th>
                  <th className="text-left font-medium px-5 py-3 text-xs uppercase tracking-wider text-gray-500">Buyer</th>
                  <th className="text-left font-medium px-5 py-3 text-xs uppercase tracking-wider text-gray-500">Amount</th>
                  <th className="text-left font-medium px-5 py-3 text-xs uppercase tracking-wider text-gray-500">Your Payout</th>
                  <th className="text-left font-medium px-5 py-3 text-xs uppercase tracking-wider text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(({ purchase, agent, buyer }) => (
                  <tr key={purchase.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900 truncate max-w-[150px]">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-md bg-primary-subtle flex items-center justify-center shrink-0">
                          <Bot className="h-3 w-3 text-primary" />
                        </div>
                        <span className="truncate">{agent.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600 overflow-hidden shrink-0">
                          {buyer.image ? (
                            <img src={buyer.image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            (buyer.name || "U")[0].toUpperCase()
                          )}
                        </div>
                        <span className="text-sm text-gray-700 truncate max-w-[100px]">{buyer.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-gray-700">${(purchase.amountPaid / 100).toFixed(2)}</td>
                    <td className="px-5 py-3 font-mono font-semibold text-green-600">${(purchase.sellerPayout / 100).toFixed(2)}</td>
                    <td className="px-5 py-3 text-sm text-gray-400">
                      {new Date(purchase.purchasedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl py-12 flex items-center justify-center">
            <div className="text-center">
              <Package className="h-8 w-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No transactions yet. Sales will appear here as buyers subscribe.</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
