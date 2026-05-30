import { auth } from "@/backend/lib/auth";
import { db } from "@/backend/db";
import { agents, users, subscriptions, purchases } from "@/backend/db/schema";
import { eq, sql, or, count, sum, and, gte } from "drizzle-orm";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Bot, Shield, Users, Activity, CheckCircle, XCircle, Clock, DollarSign, TrendingUp } from "lucide-react";
import { redirect } from "next/navigation";
import { AdminAgentActions } from "./AdminActions";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") redirect("/dashboard");

  // Fetch pending agents
  const pendingAgents = await db
    .select({
      agent: agents,
      seller: {
        name: users.name,
        email: users.email,
      },
    })
    .from(agents)
    .innerJoin(users, eq(agents.sellerId, users.id))
    .where(
      or(
        eq(agents.status, "pending_review"),
        eq(agents.status, "pending"),
        eq(agents.status, "rejected_performance")
      )
    )
    .orderBy(sql`${agents.createdAt} DESC`);

  // Platform stats
  const [totalAgents] = await db.select({ count: count() }).from(agents).where(eq(agents.status, "approved"));
  const [totalUsers] = await db.select({ count: count() }).from(users);
  const [totalSubs] = await db.select({ count: count() }).from(subscriptions).where(eq(subscriptions.status, "active"));

  // Revenue stats for today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [revenueStats] = await db
    .select({ 
      totalRevenue: sum(purchases.amountPaid),
      platformFee: sum(purchases.platformFee)
    })
    .from(purchases)
    .where(gte(purchases.purchasedAt, todayStart));

  const totalRevenue = Number(revenueStats?.totalRevenue || 0) / 100;
  const platformFee = Number(revenueStats?.platformFee || 0) / 100;

  const statusColor = (status: string) => {
    switch (status) {
      case "pending": case "pending_review": return "bg-yellow-500/10 text-yellow-600";
      case "rejected_performance": return "bg-red-500/10 text-red-500";
      case "approved": return "bg-green-500/10 text-green-600";
      case "suspended": return "bg-orange-500/10 text-orange-600";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="h-5 w-5 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Admin</span>
        </div>
        <h1 className="font-display text-3xl font-bold">Platform Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage agents, review submissions, and monitor platform health.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5 mb-8">
        <Card className="rounded-2xl border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Live Agents</CardTitle>
            <div className="rounded-lg bg-green-500/10 p-2 text-green-600"><Bot className="h-4 w-4" /></div>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalAgents.count}</div></CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Users</CardTitle>
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600"><Users className="h-4 w-4" /></div>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalUsers.count}</div></CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Subs</CardTitle>
            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-600"><Activity className="h-4 w-4" /></div>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalSubs.count}</div></CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-primary">Revenue Today</CardTitle>
            <div className="rounded-lg bg-primary/20 p-2 text-primary"><DollarSign className="h-4 w-4" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Platform Fee: ${platformFee.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pending</CardTitle>
            <div className="rounded-lg bg-yellow-500/10 p-2 text-yellow-600"><Clock className="h-4 w-4" /></div>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{pendingAgents.length}</div></CardContent>
        </Card>
      </div>

      {/* Pending Agents */}
      <section>
        <h2 className="font-display text-xl font-semibold mb-4">Agents Pending Review</h2>
        {pendingAgents.length > 0 ? (
          <div className="space-y-4">
            {pendingAgents.map(({ agent, seller }) => (
              <Card key={agent.id} className="rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                        <Bot className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{agent.name}</h3>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${statusColor(agent.status)}`}>
                            {agent.status.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">by {seller.name} ({seller.email})</p>
                        <p className="text-sm text-foreground/80 mt-2 line-clamp-2">{agent.description}</p>
                        
                        {/* Performance metrics */}
                        {agent.performanceTestedAt && (
                          <div className="mt-3 flex items-center gap-4 text-xs">
                            <span className="text-muted-foreground">
                              Avg: <span className="font-mono font-semibold text-foreground">{agent.performanceAvgMs?.toFixed(0)}ms</span>
                            </span>
                            <span className="text-muted-foreground">
                              P95: <span className="font-mono font-semibold text-foreground">{agent.performanceP95Ms?.toFixed(0)}ms</span>
                            </span>
                            <span className="text-muted-foreground">
                              Errors: <span className={`font-mono font-semibold ${(agent.performanceErrorRate || 0) > 5 ? "text-red-500" : "text-green-600"}`}>
                                {agent.performanceErrorRate?.toFixed(1)}%
                              </span>
                            </span>
                            {agent.performancePass ? (
                              <span className="flex items-center gap-1 text-green-600"><CheckCircle className="h-3 w-3" /> Pass</span>
                            ) : (
                              <span className="flex items-center gap-1 text-red-500"><XCircle className="h-3 w-3" /> Fail</span>
                            )}
                          </div>
                        )}

                        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                          <span>${(agent.monthlyPriceCents || 0) / 100}/mo</span>
                          <span>·</span>
                          {agent.embedUrl ? (
                            <a href={agent.embedUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                              Preview embed URL ↗
                            </a>
                          ) : (
                            <span>No embed URL</span>
                          )}
                          <span>·</span>
                          <span>Created {new Date(agent.createdAt).toLocaleDateString()}</span>
                        </div>

                        {/* Admin Checklist */}
                        <div className="mt-4 p-3 bg-muted/50 rounded-lg border border-border/50">
                          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Admin Checklist</h4>
                          <div className="space-y-1">
                            <label className="flex items-center gap-2 text-xs">
                              <input type="checkbox" className="rounded border-input" /> No seller branding visible
                            </label>
                            <label className="flex items-center gap-2 text-xs">
                              <input type="checkbox" className="rounded border-input" /> No external links to seller site
                            </label>
                            <label className="flex items-center gap-2 text-xs">
                              <input type="checkbox" className="rounded border-input" /> No hidden contact details
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <AdminAgentActions agentId={agent.id} agentName={agent.name} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="rounded-2xl border-dashed bg-transparent">
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">All clear! No agents pending review.</p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
