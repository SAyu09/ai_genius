import { auth } from "@/backend/lib/auth";
import { db } from "@/backend/db";
import { agents, users, purchases, subscriptions } from "@/backend/db/schema";
import { eq, inArray, sum, count, and } from "drizzle-orm";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/frontend/components/ui/tabs";
import { Bot, CreditCard, Users, TrendingUp, Plus, CheckCircle, XCircle, Clock, RotateCw } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RequestReviewButton } from "./RequestReviewButton";
import { StripeConnectButton } from "./StripeConnectButton";

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: typeof CheckCircle }> = {
  approved: { label: "Approved", className: "bg-green-500/10 text-green-600", icon: CheckCircle },
  pending: { label: "Pending", className: "bg-yellow-500/10 text-yellow-600", icon: Clock },
  testing: { label: "Testing", className: "bg-blue-500/10 text-blue-600", icon: RotateCw },
  pending_review: { label: "In Review", className: "bg-yellow-500/10 text-yellow-600", icon: Clock },
  rejected_performance: { label: "Failed Performance", className: "bg-red-500/10 text-red-500", icon: XCircle },
  rejected_admin: { label: "Rejected", className: "bg-red-500/10 text-red-500", icon: XCircle },
  suspended: { label: "Suspended", className: "bg-orange-500/10 text-orange-600", icon: XCircle },
};

export default async function SellerDashboardPage(props: { searchParams: Promise<{ stripe?: string }> }) {
  const searchParams = await props.searchParams;
  const session = await auth();
  if (!session?.user || (session.user.role !== "seller" && session.user.role !== "admin")) redirect("/dashboard");

  // Handle Stripe connect redirect
  if (searchParams.stripe === "connected") {
    await db.update(users).set({ stripeOnboarded: true }).where(eq(users.id, session.user.id));
    redirect("/dashboard/seller"); // clear URL params
  }

  // Fetch user to check stripeOnboarded
  const [dbUser] = await db.select({ stripeOnboarded: users.stripeOnboarded }).from(users).where(eq(users.id, session.user.id)).limit(1);

  // Fetch seller's agents
  const myAgents = await db.query.agents.findMany({
    where: eq(agents.sellerId, session.user.id),
  });

  const agentIds = myAgents.map((a) => a.id);

  // Fetch stats
  let totalRevenueCents = 0;
  let activeSubsCount = 0;

  if (agentIds.length > 0) {
    const [revenueRes] = await db
      .select({ total: sum(purchases.sellerPayout) })
      .from(purchases)
      .where(inArray(purchases.agentId, agentIds));
    totalRevenueCents = Number(revenueRes?.total || 0);

    const [subsRes] = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(and(inArray(subscriptions.agentId, agentIds), eq(subscriptions.status, "active")));
    activeSubsCount = Number(subsRes?.count || 0);
  }

  const totalRevenueFormatted = (totalRevenueCents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
  const totalApiCalls = myAgents.reduce((sum, agent) => sum + (agent.salesCount || 0) * 125, 0); // Mocking API calls based on sales


  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Seller Dashboard</h1>
          <p className="text-muted-foreground text-sm">Manage your agents, view metrics, and track revenue.</p>
        </div>
        <Button asChild className="rounded-xl gap-2 shadow-lg shadow-primary/20 hidden sm:flex">
          <Link href="/dashboard/list-agent">
            <Plus className="h-4 w-4" /> List New Agent
          </Link>
        </Button>
      </div>

      {!dbUser?.stripeOnboarded ? (
        <Card className="mb-8 rounded-3xl border-orange-500/20 bg-orange-500/5 shadow-sm p-6 lg:p-8">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold mb-2">Setup Payouts</h2>
              <p className="text-muted-foreground text-sm max-w-xl">
                Connect your Stripe account to receive payments. You'll receive 85% of every transaction directly to your bank account.
              </p>
            </div>
            <div className="shrink-0">
              <StripeConnectButton />
            </div>
          </div>
        </Card>
      ) : null}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-transparent h-auto p-0 gap-6">
          <TabsTrigger value="overview" className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-0 pb-2">Overview</TabsTrigger>
          <TabsTrigger value="activity" className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-0 pb-2">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="rounded-2xl border-none bg-background shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Revenue</CardTitle>
                <div className="rounded-lg bg-green-500/10 p-2 text-green-600"><CreditCard className="h-4 w-4" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalRevenueFormatted}</div>
                <p className="text-xs text-green-600 font-medium mt-1">Total earned</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-none bg-background shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Subscriptions</CardTitle>
                <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600"><Users className="h-4 w-4" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeSubsCount}</div>
                <p className="text-xs text-blue-600 font-medium mt-1">Paying customers</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-none bg-background shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total API Calls</CardTitle>
                <div className="rounded-lg bg-purple-500/10 p-2 text-purple-600"><TrendingUp className="h-4 w-4" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalApiCalls.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">Across all your agents</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <h3 className="font-display text-xl font-bold">My Active Agents</h3>
              {myAgents.length > 0 ? (
                <div className="grid gap-4">
                  {myAgents.map((agent) => {
                    const statusCfg = STATUS_CONFIG[agent.status] || STATUS_CONFIG.pending;
                    const StatusIcon = statusCfg.icon;
                    return (
                      <Card key={agent.id} className="rounded-2xl border-none shadow-sm p-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <Bot className="h-6 w-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold truncate text-foreground flex items-center gap-2">
                              {agent.name}
                              <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusCfg.className}`}>
                                <StatusIcon className="h-2.5 w-2.5" />
                                {statusCfg.label}
                              </span>
                            </h4>
                            <p className="text-xs text-muted-foreground">{agent.salesCount} active installs · ${agent.price / 100}/mo</p>
                            
                            {/* Performance metrics inline */}
                            {agent.performanceTestedAt && (
                              <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                                <span>Avg: <span className="font-mono">{agent.performanceAvgMs?.toFixed(0)}ms</span></span>
                                <span>P95: <span className="font-mono">{agent.performanceP95Ms?.toFixed(0)}ms</span></span>
                                <span>Errors: <span className={`font-mono ${(agent.performanceErrorRate || 0) > 5 ? "text-red-500" : "text-green-600"}`}>{agent.performanceErrorRate?.toFixed(1)}%</span></span>
                              </div>
                            )}

                            {/* Performance Rejection Options */}
                            {agent.status === "rejected_performance" && (
                              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                                <h5 className="text-xs font-bold text-red-500 mb-2">Performance Test Failed</h5>
                                <div className="space-y-3">
                                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                    <div className="text-[10px] text-foreground/80">
                                      <strong>Option 1: Fix your server.</strong><br/>
                                      Ensure response time is under 2s and reapply.
                                    </div>
                                    <RequestReviewButton agentId={agent.id} />
                                  </div>
                                  <div className="h-[1px] bg-red-500/10 w-full"></div>
                                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                    <div className="text-[10px] text-foreground/80">
                                      <strong>Option 2: Managed hosting.</strong><br/>
                                      Rs 500/month. We guarantee {'< 2s'} load time.
                                    </div>
                                    <Button size="sm" className="h-7 text-[10px] bg-red-500 hover:bg-red-600 text-white shadow-none">
                                      Upgrade Hosting
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Admin Rejection reason */}
                            {agent.rejectionReason && agent.status === "rejected_admin" && (
                              <p className="text-[10px] text-red-500 mt-1">Reason: {agent.rejectionReason}</p>
                            )}
                          </div>
                          <div className="flex gap-2 shrink-0">
                            {agent.status === "rejected_admin" && (
                              <RequestReviewButton agentId={agent.id} />
                            )}
                            <Button size="sm" variant="outline" className="h-8 rounded-lg">Edit</Button>
                            <Button size="sm" variant="ghost" className="h-8 rounded-lg text-primary">View Stats</Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="rounded-3xl border-none bg-background shadow-sm overflow-hidden min-h-[300px] flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-muted mb-4 opacity-50">
                      <Bot className="h-6 w-6" />
                    </div>
                    <h3 className="text-base font-bold">No agents listed yet</h3>
                    <p className="text-muted-foreground text-xs max-w-[240px] mx-auto mt-2">
                      You haven&apos;t listed any AI agents. Start selling your creations to a global market.
                    </p>
                    <Button asChild variant="outline" size="sm" className="mt-4 rounded-xl">
                      <Link href="/dashboard/list-agent">Create First Listing</Link>
                    </Button>
                  </div>
                </Card>
              )}
            </div>

            {/* Seller Resources */}
            <div className="space-y-6">
              <h3 className="font-display text-xl font-bold">Recent Activity</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-background shadow-sm border border-transparent opacity-50">
                  <div className="text-xs text-center w-full">No activity yet.</div>
                </div>
              </div>

              <Card className="rounded-2xl border border-primary/20 bg-primary/5 shadow-sm overflow-hidden relative">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-bold text-primary">Seller Success Tips</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-xs text-muted-foreground leading-relaxed">Agents with clear, concise descriptions and an embedded demo UI convert 40% better.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
