"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/frontend/components/ui/button";
import {
  ArrowLeft,
  Loader2,
  Users,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart2,
} from "lucide-react";
import { toast } from "sonner";

interface AgentData {
  id: string;
  name: string;
  status: string;
  subscriberCount: number;
  salesCount: number;
  performanceAvgMs: number | null;
  performanceErrorRate: number | null;
  performancePass: boolean | null;
}

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: typeof CheckCircle }> = {
  approved: { label: "Live", className: "bg-green-500/10 text-green-600 border-green-500/20", icon: CheckCircle },
  pending: { label: "Pending", className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", icon: Clock },
  testing: { label: "Testing", className: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: Clock },
  pending_review: { label: "In Review", className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", icon: Clock },
  rejected_performance: { label: "Perf. Failed", className: "bg-red-500/10 text-red-500 border-red-500/20", icon: XCircle },
  rejected_admin: { label: "Rejected", className: "bg-red-500/10 text-red-500 border-red-500/20", icon: XCircle },
  suspended: { label: "Suspended", className: "bg-orange-500/10 text-orange-600 border-orange-500/20", icon: XCircle },
  draft: { label: "Draft", className: "bg-gray-500/10 text-gray-600 border-gray-500/20", icon: Clock },
};

export default function AgentStatsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const agentId = params.id;

  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState<AgentData | null>(null);

  useEffect(() => {
    async function fetchAgent() {
      try {
        const res = await fetch(`/api/agents/${agentId}`);
        if (!res.ok) {
          toast.error("Failed to load agent data");
          return;
        }
        const data = await res.json();
        setAgent(data.agent as AgentData);
      } catch {
        toast.error("Failed to connect to server");
      } finally {
        setLoading(false);
      }
    }
    fetchAgent();
  }, [agentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-gray-500">Agent not found.</p>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => router.push("/dashboard/seller/listings")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Listings
        </Button>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[agent.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusCfg.icon;

  const avgMs = agent.performanceAvgMs;
  const errorRate = agent.performanceErrorRate;
  const perfPass = agent.performancePass;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-gray-600"
          onClick={() => router.push("/dashboard/seller/listings")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Listings
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-900">{agent.name}</h1>
        <span
          className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium border ${statusCfg.className}`}
        >
          <StatusIcon className="h-3 w-3" />
          {statusCfg.label}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Subscribers */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Subscribers
            </span>
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {agent.subscriberCount || 0}
          </div>
          <p className="text-xs text-gray-400 mt-1">Active subscribers</p>
        </div>

        {/* Sales Count */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Total Sales
            </span>
            <div className="rounded-lg bg-green-500/10 p-2 text-green-600">
              <BarChart2 className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {agent.salesCount || 0}
          </div>
          <p className="text-xs text-gray-400 mt-1">All-time sales</p>
        </div>

        {/* Avg Response Time */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Avg Response
            </span>
            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {avgMs != null ? `${avgMs.toFixed(0)}ms` : "—"}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {avgMs != null ? "Average latency" : "No data yet"}
          </p>
        </div>

        {/* Error Rate */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Error Rate
            </span>
            <div className="rounded-lg bg-red-500/10 p-2 text-red-500">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {errorRate != null ? `${(errorRate * 100).toFixed(1)}%` : "—"}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {errorRate != null ? "Of total requests" : "No data yet"}
          </p>
        </div>
      </div>

      {/* Performance Status */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-4 w-4 text-gray-500" />
          <h2 className="text-base font-semibold text-gray-900">
            Performance Health
          </h2>
        </div>

        {perfPass != null ? (
          <div className="flex items-center gap-3">
            {perfPass ? (
              <>
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-700">
                    Performance check passed
                  </p>
                  <p className="text-xs text-gray-400">
                    Your agent meets all performance thresholds.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-600">
                    Performance check failed
                  </p>
                  <p className="text-xs text-gray-400">
                    Your agent did not meet required performance thresholds.
                    Review response times and error rates.
                  </p>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Activity className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">
                No performance data yet
              </p>
              <p className="text-xs text-gray-400">
                Performance metrics will appear here after your agent has been
                tested.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
