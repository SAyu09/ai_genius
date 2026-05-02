"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Download, CreditCard, ShoppingBag, Plus, Search, LogOut, Settings, LayoutDashboard, Database, TrendingUp, Users, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string>("buyer");
  const [loading, setLoading] = useState(true);
  const [purchasedAgents, setPurchasedAgents] = useState<any[]>([]);
  const [featuredAgents, setFeaturedAgents] = useState<any[]>([]);

  useEffect(() => {
    const checkUserAndData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/sign-in");
        return;
      }

      setUser(user);
      // Force Seller Mode for this demo
      setRole("seller");

      // Fetch Data
      try {
        // Fetch featured agents (treat as the seller's active listings for UI purposes)
        const agentsRes = await fetch("/api/agents?limit=4&sort=top");
        if (agentsRes.ok) {
          const agentsData = await agentsRes.json();
          setFeaturedAgents(agentsData.agents || []);
        }
      } catch (err) {
        console.error("Data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    checkUserAndData();
  }, [supabase, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Mini Sidebar */}
      <aside className="fixed bottom-0 left-0 top-0 hidden w-64 border-r bg-background lg:block">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center border-b px-6">
            <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </span>
              sellgetai
            </Link>
          </div>
          <nav className="flex-1 space-y-1 p-4">
            <Button variant="ghost" className="w-full justify-start gap-3 rounded-xl bg-muted/50">
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 rounded-xl">
              <ShoppingBag className="h-4 w-4" /> My Listings
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 rounded-xl">
              <Database className="h-4 w-4" /> API & Webhooks
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 rounded-xl">
              <Settings className="h-4 w-4" /> Seller Settings
            </Button>
          </nav>
          <div className="border-t p-4">
            <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-3 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive">
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-background/80 px-6 backdrop-blur">
          <h2 className="text-sm font-medium">Welcome back, {user.user_metadata?.name || "User"}</h2>
          <div className="ml-auto flex items-center gap-4">
            <Button variant="outline" size="sm" className="rounded-full">Docs</Button>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary-glow shadow-sm" />
          </div>
        </header>

        <div className="p-6 lg:p-8">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground text-sm">Manage your AI agents and subscriptions.</p>
            </div>
            {role === "seller" && (
              <Button asChild className="rounded-xl gap-2 shadow-lg shadow-primary/20">
                <Link href="/dashboard/list-agent">
                  <Plus className="h-4 w-4" /> List New Agent
                </Link>
              </Button>
            )}
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-transparent h-auto p-0 gap-6">
              <TabsTrigger value="overview" className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-0 pb-2">Overview</TabsTrigger>
              <TabsTrigger value="activity" className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-0 pb-2">Activity</TabsTrigger>
              <TabsTrigger value="billing" className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-0 pb-2">Billing</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Stats Grid */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="rounded-2xl border-none bg-background shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Revenue</CardTitle>
                    <div className="rounded-lg bg-green-500/10 p-2 text-green-600">
                      <CreditCard className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$12,450.00</div>
                    <p className="text-xs text-green-600 font-medium mt-1">+14% from last month</p>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl border-none bg-background shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Subscriptions</CardTitle>
                    <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600">
                      <Users className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">342</div>
                    <p className="text-xs text-blue-600 font-medium mt-1">+22 new this week</p>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl border-none bg-background shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total API Calls</CardTitle>
                    <div className="rounded-lg bg-purple-500/10 p-2 text-purple-600">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">1.2M</div>
                    <p className="text-xs text-muted-foreground mt-1">Across 3 active agents</p>
                  </CardContent>
                </Card>
              </div>

              {/* Main Display Area */}
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                  <h3 className="font-display text-xl font-bold">My Active Agents</h3>
                  {featuredAgents.length > 0 ? (
                    <div className="grid gap-4">
                      {featuredAgents.map((agent) => (
                        <Card key={agent.id} className="rounded-2xl border-none shadow-sm flex items-center p-4 gap-4">
                          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <Bot className="h-6 w-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold truncate text-foreground">{agent.name}</h4>
                            <p className="text-xs text-muted-foreground">{agent.sales_count} active installs · ${agent.price / 100}/mo</p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="h-8 rounded-lg">Edit</Button>
                            <Button size="sm" variant="ghost" className="h-8 rounded-lg text-primary">View Stats</Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="rounded-3xl border-none bg-background shadow-sm overflow-hidden min-h-[300px] flex items-center justify-center">
                      <div className="text-center p-8">
                        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-muted mb-4 opacity-50">
                          <Bot className="h-6 w-6" />
                        </div>
                        <h3 className="text-base font-bold">No agents listed yet</h3>
                        <p className="text-muted-foreground text-xs max-w-[240px] mx-auto mt-2">
                          You haven't listed any AI agents. Start selling your creations to a global market.
                        </p>
                        <Button asChild variant="outline" size="sm" className="mt-4 rounded-xl">
                          <Link href="/dashboard/list-agent">Create First Listing</Link>
                        </Button>
                      </div>
                    </Card>
                  )}
                </div>

                {/* Seller Resources & Quick Links */}
                <div className="space-y-6">
                  <h3 className="font-display text-xl font-bold">Recent Activity</h3>
                  <div className="space-y-4">
                    {[
                      { title: "New subscription", desc: "Atlas SDR - 2 mins ago", price: "+$49.00" },
                      { title: "Payout Processed", desc: "Bank Transfer - 1 day ago", price: "$4,200.00" },
                      { title: "New 5-star review", desc: "Pulse Analytics - 2 days ago", price: "" },
                    ].map((activity, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-background shadow-sm border border-transparent">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">{activity.title}</div>
                          <div className="text-[11px] text-muted-foreground">{activity.desc}</div>
                        </div>
                        {activity.price && <div className="text-sm font-semibold text-green-600">{activity.price}</div>}
                      </div>
                    ))}
                  </div>

                  <Card className="rounded-2xl border border-primary/20 bg-primary/5 shadow-sm overflow-hidden relative">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm font-bold text-primary">Seller Success Tips</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-xs text-muted-foreground leading-relaxed">Agents with demo videos convert 40% better. Add a YouTube link to your listings to increase sales.</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
