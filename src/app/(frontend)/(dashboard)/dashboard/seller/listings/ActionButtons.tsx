"use client";

import { Button } from "@/frontend/components/ui/button";
import { toast } from "sonner";

export function ActionButtons() {
  return (
    <>
      <Button 
        size="sm" 
        variant="outline" 
        className="h-8 rounded-lg text-xs"
        onClick={() => toast.info("Edit feature is coming soon!")}
      >
        Edit
      </Button>
      <Button 
        size="sm" 
        variant="ghost" 
        className="h-8 rounded-lg text-xs text-primary"
        onClick={() => toast.info("Detailed stats are coming soon!")}
      >
        View Stats
      </Button>
    </>
  );
}
