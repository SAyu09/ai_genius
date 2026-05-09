import { auth } from "@/backend/lib/auth";
import { db } from "@/backend/db";
import { agents } from "@/backend/db/schema";
import { eq } from "drizzle-orm";
import { Button } from "@/frontend/components/ui/button";
import { Card } from "@/frontend/components/ui/card";
import { Bot, Plus, CheckCircle, XCircle, Clock, RotateCw, Globe, Workflow, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ActionButtons } from "./ActionButtons";

export const metadata: Metadata = {
  title: "My Listings — Manage Your Agents",
  description: "View, edit, and manage all your listed AI agents.",
};

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: typeof CheckCircle }> = {
  approved: { label: "Live", className: "bg-green-500/10 text-green-600 border-green-500/20", icon: CheckCircle },
  pending: { label: "Pending", className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", icon: Clock },
  testing: { label: "Testing", className: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: RotateCw },
  pending_review: { label: "In Review", className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", icon: Clock },
  rejected_performance: { label: "Perf. Failed", className: "bg-red-500/10 text-red-500 border-red-500/20", icon: XCircle },
  rejected_admin: { label: "Rejected", className: "bg-red-500/10 text-red-500 border-red-500/20", icon: XCircle },
  suspended: { label: "Suspended", className: "bg-orange-500/10 text-orange-600 border-orange-500/20", icon: XCircle },
};

const TYPE_CONFIG: Record<string, { label: string; icon: typeof Globe; className: string }> = {
  hosted: { label: "Website", icon: Globe, className: "bg-blue-500/10 text-blue-600" },
  workflow: { label: "n8n Agent", icon: Workflow, className: "bg-purple-500/10 text-purple-600" },
};

export default async function SellerListingsPage() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "seller" && session.user.role !== "admin")) redirect("/marketplace");

  const myAgents = await db.query.agents.findMany({
    where: eq(agents.sellerId, session.user.id),
  });

  const approvedCount = myAgents.filter((a) => a.status === "approved").length;
  const pendingCount = myAgents.filter((a) => ["pending", "testing", "pending_review"].includes(a.status)).length;
  const totalSubscribers = myAgents.reduce((sum, a) => sum + (a.subscriberCount || 0), 0);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">My Listings</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage all your AI agents and websites.</p>
        </div>
        <Button asChild className="rounded-xl gap-2 shadow-lg shadow-primary/20 self-start sm:self-auto">
          <Link href="/dashboard/list-agent">
            <Plus className="h-4 w-4" /> List New Agent
          </Link>
        </Button>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-4">
          <div className="rounded-xl bg-green-500/10 p-3 text-green-600"><CheckCircle className="h-5 w-5" /></div>
          <div>
            <div className="text-2xl font-bold">{approvedCount}</div>
            <div className="text-xs text-muted-foreground">Live Agents</div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-4">
          <div className="rounded-xl bg-yellow-500/10 p-3 text-yellow-600"><Clock className="h-5 w-5" /></div>
          <div>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <div className="text-xs text-muted-foreground">Under Review</div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-4">
          <div className="rounded-xl bg-blue-500/10 p-3 text-blue-600"><Users className="h-5 w-5" /></div>
          <div>
            <div className="text-2xl font-bold">{totalSubscribers}</div>
            <div className="text-xs text-muted-foreground">Total Subscribers</div>
          </div>
        </div>
      </div>

      {/* Agents list */}
      {myAgents.length > 0 ? (
        <div className="grid gap-4">
          {myAgents.map((agent) => {
            const statusCfg = STATUS_CONFIG[agent.status] || STATUS_CONFIG.pending;
            const typeCfg = TYPE_CONFIG[agent.type] || TYPE_CONFIG.hosted;
            const StatusIcon = statusCfg.icon;
            const TypeIcon = typeCfg.icon;

            return (
              <Card key={agent.id} className="rounded-2xl border shadow-sm overflow-hidden p-0">
                <div className="flex flex-col sm:flex-row">
                  {/* Left: Agent info */}
                  <div className="flex-1 p-5 flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Bot className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
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
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{agent.description}</p>

                      {/* Stats row */}
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {agent.subscriberCount || 0} subscribers
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" /> {agent.salesCount || 0} sales
                        </span>
                        <span>${(agent.monthlyPricePaise || 0) / 100}/mo</span>
                      </div>

                      {/* Performance metrics */}
                      {agent.performanceTestedAt && (
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                          <span>Avg: <span className="font-mono">{agent.performanceAvgMs?.toFixed(0)}ms</span></span>
                          <span>P95: <span className="font-mono">{agent.performanceP95Ms?.toFixed(0)}ms</span></span>
                          <span>Errors: <span className={`font-mono ${(agent.performanceErrorRate || 0) > 0.5 ? "text-red-500" : "text-green-600"}`}>{agent.performanceErrorRate?.toFixed(2)}%</span></span>
                        </div>
                      )}

                      {/* Rejection reason */}
                      {agent.rejectionReason && agent.status === "rejected_admin" && (
                        <p className="text-[11px] text-red-500 mt-2 bg-red-500/5 rounded-lg px-3 py-1.5">Rejection: {agent.rejectionReason}</p>
                      )}

                      {/* Performance failure notice */}
                      {agent.status === "rejected_performance" && (
                        <div className="mt-3 p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                          <p className="text-[11px] text-red-600 font-semibold mb-1">Performance test failed</p>
                          <p className="text-[10px] text-muted-foreground">
                            Avg must be &lt; 800ms, P95 &lt; 2000ms, Error rate &lt; 0.5%. Fix your server and re-submit, or host on our platform (₹500/mo).
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex sm:flex-col items-center justify-end gap-2 p-4 sm:p-5 sm:border-l border-t sm:border-t-0 border-border bg-muted/20">
                    <ActionButtons />
                    {agent.status === "approved" && (
                      <Button asChild size="sm" variant="ghost" className="h-8 rounded-lg text-xs">
                        <Link href={`/marketplace/${agent.id}`}>View Listing</Link>
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="rounded-3xl border-none bg-background shadow-sm overflow-hidden min-h-[400px] flex items-center justify-center">
          <div className="text-center p-8">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-muted mb-6 opacity-50">
              <Bot className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold font-display">No agents listed yet</h3>
            <p className="text-muted-foreground text-sm max-w-[300px] mx-auto mt-2">
              You haven&apos;t listed any AI agents. Start selling your creations to a global market.
            </p>
            <Button asChild className="mt-6 rounded-xl gap-2 shadow-lg shadow-primary/20">
              <Link href="/dashboard/list-agent">
                <Plus className="h-4 w-4" /> Create First Listing
              </Link>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
