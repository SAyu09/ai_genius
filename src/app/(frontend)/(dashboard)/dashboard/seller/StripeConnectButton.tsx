"use client";

import { useState } from "react";
import { Button } from "@/frontend/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";

export function StripeConnectButton() {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sellers/onboard", { method: "POST" });
      const data = await res.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to generate connect link");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to connect to Stripe. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleConnect} 
      disabled={loading}
      className="rounded-xl h-12 px-6 gap-2 bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/25 transition-all"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          Connect Stripe Account <ArrowRight className="h-4 w-4" />
        </>
      )}
    </Button>
  );
}
