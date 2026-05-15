import { Button } from "@/frontend/components/ui/button";
import Link from "next/link";
import { BarChart3, Edit3 } from "lucide-react";

export function ActionButtons({ agentId }: { agentId: string }) {
  return (
    <>
      <Button 
        asChild
        size="sm" 
        variant="outline" 
        className="h-8 rounded-lg text-xs gap-2"
      >
        <Link href={`/dashboard/seller/listings/${agentId}/edit`}>
          <Edit3 className="h-3 w-3" />
          Edit
        </Link>
      </Button>
      <Button 
        asChild
        size="sm" 
        variant="ghost" 
        className="h-8 rounded-lg text-xs text-primary gap-2"
      >
        <Link href={`/dashboard/seller/listings/${agentId}/stats`}>
          <BarChart3 className="h-3 w-3" />
          View Stats
        </Link>
      </Button>
    </>
  );
}
