"use client";

import { useState } from "react";
import { Button } from "@/frontend/components/ui/button";
import { Check, Loader2 } from "lucide-react";

export function SettlementActions({ settlementId }: { settlementId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  const markPaid = async () => {
    const bankRef = prompt("Enter bank reference number (NEFT/IMPS UTR):");
    if (!bankRef) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/settlements/${settlementId}/mark-paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankReferenceNumber: bankRef }),
      });
      if (res.ok) setDone(true);
    } catch {
      alert("Failed to mark settlement as paid");
    } finally {
      setIsLoading(false);
    }
  };

  if (done) return <span className="text-xs text-green-600 flex items-center gap-1"><Check className="h-3 w-3" /> Marked Paid</span>;

  return (
    <Button variant="outline" size="sm" onClick={markPaid} disabled={isLoading} className="rounded-lg gap-1.5 text-xs">
      {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
      Mark Paid
    </Button>
  );
}
