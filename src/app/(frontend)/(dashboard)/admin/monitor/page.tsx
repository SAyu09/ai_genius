import { auth } from "@/backend/lib/auth";
import { db } from "@/backend/db";
import { agents, users } from "@/backend/db/schema";
import { eq, and, or, isNotNull, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Activity, CheckCircle, XCircle, AlertTriangle, Clock } from "lucide-react";
import { AdminAgentMonitorActions } from "./MonitorActions";

export default async function AdminMonitorPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") redirect("/dashboard");

  // Fetch all agents with SDK endpoints (v4 agents only)
  const sdkAgents = await db
    .select({
      agent: {
        id: agents.id,
        name: agents.name,
        agentType: agents.agentType,
        status: agents.status,
        performanceAvgMs: agents.performanceAvgMs,
        performanceP95Ms: agents.performanceP95Ms,
        performanceErrorRate: agents.performanceErrorRate,
        performanceTestedAt: agents.performanceTestedAt,
        performancePass: agents.performancePass,
        endpointUrl: agents.endpointUrl,
        suspendedAt: agents.suspendedAt,
        suspensionReason: agents.suspensionReason,
      },
      seller: { name: users.name, email: users.email },
    })
    .from(agents)
    .innerJoin(users, eq(agents.sellerId, users.id))
    .where(isNotNull(agents.endpointUrl))
    .orderBy(desc(agents.performanceTestedAt));

  const liveCount = sdkAgents.filter((a) => a.agent.status === "approved").length;
  const suspendedCount = sdkAgents.filter((a) => a.agent.status === "suspended").length;
  const failingCount = sdkAgents.filter((a) => a.agent.performancePass === false).length;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Activity className="h-5 w-5 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Admin</span>
        </div>
        <h1 className="font-display text-3xl font-bold">Live Performance Monitor</h1>
        <p className="text-muted-foreground text-sm mt-1">Track agent health, response times, and manage suspensions.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">SDK Agents</div>
            <div className="text-2xl font-bold mt-1">{sdkAgents.length}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-green-600">Live</div>
            <div className="text-2xl font-bold mt-1 text-green-600">{liveCount}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-red-500">Suspended</div>
            <div className="text-2xl font-bold mt-1 text-red-500">{suspendedCount}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-yellow-600">Failing</div>
            <div className="text-2xl font-bold mt-1 text-yellow-600">{failingCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Agent table */}
      <Card className="rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Agent</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Avg (ms)</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">P95 (ms)</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Error %</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Last Test</th>
                <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sdkAgents.map(({ agent, seller }) => (
                <tr key={agent.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{agent.name}</div>
                    <div className="text-xs text-muted-foreground">{seller.name}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary">{agent.agentType}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    <span className={(agent.performanceAvgMs || 0) > 3000 ? "text-red-500 font-bold" : ""}>
                      {agent.performanceAvgMs?.toFixed(0) || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{agent.performanceP95Ms?.toFixed(0) || "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    <span className={(agent.performanceErrorRate || 0) > 5 ? "text-red-500 font-bold" : ""}>
                      {agent.performanceErrorRate != null ? `${(agent.performanceErrorRate * 100).toFixed(1)}%` : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                      agent.status === "approved" ? "bg-green-500/10 text-green-600" :
                      agent.status === "suspended" ? "bg-red-500/10 text-red-500" :
                      "bg-yellow-500/10 text-yellow-600"
                    }`}>{agent.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {agent.performanceTestedAt ? new Date(agent.performanceTestedAt).toLocaleDateString() : "Never"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <AdminAgentMonitorActions agentId={agent.id} agentName={agent.name} status={agent.status} />
                  </td>
                </tr>
              ))}
              {sdkAgents.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">No SDK agents found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
