"use client";

import { useState } from "react";
import { Button } from "@/frontend/components/ui/button";
import { Pause, Play, Loader2 } from "lucide-react";

interface Props {
  agentId: string;
  agentName: string;
  status: string;
}

export function AdminAgentMonitorActions({ agentId, agentName, status }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(status);

  const handleAction = async (action: "suspend" | "restore") => {
    const reason = action === "suspend" ? prompt(`Reason for suspending "${agentName}":`) : null;
    if (action === "suspend" && !reason) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/agents/${agentId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        setCurrentStatus(action === "suspend" ? "suspended" : "approved");
      }
    } catch {
      alert(`Failed to ${action} agent`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-auto" />;

  return currentStatus === "suspended" ? (
    <Button variant="outline" size="sm" onClick={() => handleAction("restore")} className="rounded-lg gap-1.5 text-xs">
      <Play className="h-3 w-3" /> Restore
    </Button>
  ) : currentStatus === "approved" ? (
    <Button variant="outline" size="sm" onClick={() => handleAction("suspend")} className="rounded-lg gap-1.5 text-xs text-red-500 border-red-200 hover:bg-red-50">
      <Pause className="h-3 w-3" /> Suspend
    </Button>
  ) : null;
}
