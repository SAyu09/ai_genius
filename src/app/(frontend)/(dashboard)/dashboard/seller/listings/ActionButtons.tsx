import { Button } from "@/frontend/components/ui/button";
import Link from "next/link";
import { BarChart2, Edit2 } from "lucide-react";

export function ActionButtons({ agentId }: { agentId: string }) {
  return (
    <>
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
