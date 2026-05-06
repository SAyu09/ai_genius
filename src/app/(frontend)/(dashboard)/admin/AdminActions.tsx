"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { CheckCircle, XCircle } from "lucide-react";

export function AdminAgentActions({
  agentId,
  agentName,
}: {
  agentId: string;
  agentName: string;
}) {
  const [loading, setLoading] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");
  const router = useRouter();

  const handleAction = async (approved: boolean) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, approved, reason: approved ? undefined : reason }),
      });
      if (!res.ok) throw new Error("Failed");
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setShowReject(false);
    }
  };

  if (showReject) {
    return (
      <div className="flex flex-col gap-2 min-w-[200px]">
        <Input
          placeholder="Rejection reason..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="h-8 text-xs rounded-lg"
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="destructive"
            className="h-7 rounded-lg text-xs flex-1"
            onClick={() => handleAction(false)}
            disabled={loading}
          >
            {loading ? "..." : "Reject"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 rounded-lg text-xs"
            onClick={() => setShowReject(false)}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <Button
        size="sm"
        className="h-8 rounded-lg gap-1.5 text-xs bg-green-600 hover:bg-green-700"
        onClick={() => handleAction(true)}
        disabled={loading}
      >
        <CheckCircle className="h-3.5 w-3.5" />
        Approve
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="h-8 rounded-lg gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
        onClick={() => setShowReject(true)}
      >
        <XCircle className="h-3.5 w-3.5" />
        Reject
      </Button>
    </div>
  );
}
