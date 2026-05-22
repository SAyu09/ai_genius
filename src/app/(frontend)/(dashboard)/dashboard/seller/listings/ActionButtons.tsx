"use client";

import { Button } from "@/frontend/components/ui/button";
import Link from "next/link";
import { BarChart2, Edit2, Rocket, AlertCircle, RotateCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ActionButtons({ agentId, status, isKycVerified }: { agentId: string, status: string, isKycVerified: boolean }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePublish = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/agents/${agentId}/publish`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to publish");
      
      toast.success("Agent sent to pre-flight moderation.");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {status === "draft" && isKycVerified && (
        <Button size="sm" onClick={handlePublish} disabled={loading} className="w-full justify-start h-8 rounded-md text-sm gap-2">
          <Rocket className="h-4 w-4" /> {loading ? "Scanning..." : "Publish to Market"}
        </Button>
      )}
      {status === "draft" && !isKycVerified && (
        <Button asChild size="sm" variant="destructive" className="w-full justify-start h-8 rounded-md text-xs gap-1.5">
          <Link href="/dashboard/seller/billing">
            <AlertCircle className="h-4 w-4" /> Setup KYC to Publish
          </Link>
        </Button>
      )}
      {(status === "rejected_performance" || status === "rejected_admin") && (
        <Button size="sm" variant="outline" onClick={handlePublish} disabled={loading} className="w-full justify-start h-8 rounded-md text-xs gap-1.5 border-orange-500/30 text-orange-600 hover:bg-orange-50">
          <RotateCw className="h-4 w-4" /> {loading ? "Scanning..." : "Re-submit"}
        </Button>
      )}
      <Button 
        asChild
        size="sm" 
        variant="ghost" 
        className="w-full justify-start h-8 rounded-md text-sm gap-2 text-gray-700"
      >
        <Link href={`/dashboard/seller/listings/${agentId}/edit`}>
          <Edit2 className="h-4 w-4 text-gray-500" />
          Edit
        </Link>
      </Button>
      <Button 
        asChild
        size="sm" 
        variant="ghost" 
        className="w-full justify-start h-8 rounded-md text-sm gap-2 text-gray-700"
      >
        <Link href={`/dashboard/seller/listings/${agentId}/stats`}>
          <BarChart2 className="h-4 w-4 text-gray-500" />
          View Stats
        </Link>
      </Button>
    </>
  );
}
