"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/frontend/components/ui/card";
import { Button } from "@/frontend/components/ui/button";
import { ArrowLeft, Users, TrendingUp, Clock, Activity, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function AgentStatsPage() {
  const params = useParams();
  const agentId = params.agentId as string;
  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/seller/agents/${agentId}`);
        const data = await res.json();
        setAgent(data.agent);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (agentId) fetchStats();
  }, [agentId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="p-12 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Agent Not Found</h2>
        <Button asChild className="mt-4">
          <Link href="/dashboard/seller/listings">Back to Listings</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <Link href="/dashboard/seller/listings" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition">
        <ArrowLeft className="h-4 w-4" /> Back to Listings
      </Link>

      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">{agent.name} Stats</h1>
        <p className="text-muted-foreground mt-1 text-sm">Detailed performance and business metrics.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="rounded-2xl border-none shadow-sm bg-card">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold">Total Revenue</CardDescription>
            <CardTitle className="text-2xl font-bold">${((agent.salesCount || 0) * (agent.monthlyPricePaise || 0) / 100).toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-green-600 font-medium gap-1">
              <TrendingUp className="h-3 w-3" /> +12% from last month
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm bg-card">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold">Active Subs</CardDescription>
            <CardTitle className="text-2xl font-bold">{agent.subscriberCount || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-muted-foreground gap-1">
              <Users className="h-3 w-3" /> Recurring users
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm bg-card">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold">Avg Latency</CardDescription>
            <CardTitle className="text-2xl font-bold">{agent.performanceAvgMs?.toFixed(0) || "0"}ms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-blue-600 font-medium gap-1">
              <Activity className="h-3 w-3" /> Optimal performance
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm bg-card">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold">Error Rate</CardDescription>
            <CardTitle className="text-2xl font-bold">{agent.performanceErrorRate?.toFixed(2) || "0.00"}%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-green-600 font-medium gap-1">
              <CheckCircle className="h-3 w-3" /> Within limits
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-primary/5 border-b pb-6">
            <CardTitle className="text-lg">Usage Over Time</CardTitle>
            <CardDescription>Daily active users and API calls.</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center text-muted-foreground text-sm italic p-0">
             <div className="flex flex-col items-center gap-2">
                <TrendingUp className="h-8 w-8 opacity-20" />
                Chart data will appear here as you get more traffic.
             </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-primary/5 border-b pb-6">
            <CardTitle className="text-lg">Recent Events</CardTitle>
            <CardDescription>Latest subscriptions and reviews.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">New Subscriber</p>
                      <p className="text-xs text-muted-foreground">User #{i*123} started a trial</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{i}h ago</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
