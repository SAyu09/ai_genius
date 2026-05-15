import { auth } from "@/backend/lib/auth";
import { db } from "@/backend/db";
import { agents, users, purchases, subscriptions, sellerProfiles } from "@/backend/db/schema";
import { eq, inArray, sum, count, and } from "drizzle-orm";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/frontend/components/ui/tabs";
import { Bot, CreditCard, Users, TrendingUp, Plus, CheckCircle, XCircle, Clock, RotateCw } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

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

  // Handle Stripe connect redirect (legacy, can be removed eventually)
  if (searchParams.stripe === "connected") {
    redirect("/dashboard/seller"); // clear URL params
  }

  // Fetch seller profile to check settlementStatus
  const [profile] = await db.select({ settlementStatus: sellerProfiles.settlementStatus }).from(sellerProfiles).where(eq(sellerProfiles.userId, session.user.id)).limit(1);
  const settlementStatus = profile?.settlementStatus || "pending_details";

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
              {/* Inline agent list removed, now available at My Listings (/dashboard/seller/listings) */}
              <Card className="rounded-3xl border border-primary/10 bg-primary/5 shadow-sm p-6 lg:p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 mb-4 text-primary">
                  <Bot className="h-6 w-6" />
                </div>
                <h3 className="font-display text-xl font-bold">Manage Your Agents</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-2 mb-6">
                  View performance, edit details, and manage all your active and pending listings in the dedicated Listings page.
                </p>
                <Button asChild className="rounded-xl shadow-lg shadow-primary/20">
                  <Link href="/dashboard/seller/listings">
                    Go to My Listings
                  </Link>
                </Button>
              </Card>
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
