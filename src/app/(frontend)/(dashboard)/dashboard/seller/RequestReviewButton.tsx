"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/frontend/components/ui/button";
import { RotateCw } from "lucide-react";

export function RequestReviewButton({ agentId }: { agentId: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ pass: boolean; avgMs: number } | null>(null);
  const router = useRouter();

  const handleRequestReview = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/sellers/agents/${agentId}/request-review`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.performance) {
        setResult({ pass: data.performance.pass, avgMs: data.performance.avgMs });
      }
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        size="sm"
        variant="outline"
        className="h-8 rounded-lg gap-1.5 text-xs"
        onClick={handleRequestReview}
        disabled={loading}
      >
        <RotateCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
        {loading ? "Testing..." : "Request Re-Review"}
      </Button>
      {result && (
        <span className={`text-[10px] font-medium ${result.pass ? "text-green-600" : "text-red-500"}`}>
          {result.pass ? "✓ Passed" : "✗ Failed"} ({result.avgMs}ms avg)
        </span>
      )}
    </div>
  );
}
