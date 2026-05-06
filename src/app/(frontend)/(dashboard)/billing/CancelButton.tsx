"use client";

import { useState } from "react";
import { Button } from "@/frontend/components/ui/button";
import { useRouter } from "next/navigation";

export function CancelSubscriptionButton({
  subscriptionId,
  agentName,
}: {
  subscriptionId: string;
  agentName: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCancel = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/subscriptions/${subscriptionId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to cancel");
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-destructive">Cancel {agentName}?</span>
        <Button
          size="sm"
          variant="destructive"
          className="h-7 rounded-lg text-xs"
          onClick={handleCancel}
          disabled={loading}
        >
          {loading ? "Cancelling..." : "Confirm"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 rounded-lg text-xs"
          onClick={() => setConfirming(false)}
        >
          Keep
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-7 rounded-lg text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
      onClick={() => setConfirming(true)}
    >
      Cancel Subscription
    </Button>
  );
}
