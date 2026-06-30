"use client";

import { useState } from "react";
import { Button } from "@/frontend/components/ui/button";

export function CheckoutButton({ 
  agentId, 
  isLoggedIn,
  isFree = false,
  isUsageBased = false
}: { 
  agentId: string; 
  isLoggedIn: boolean;
  isFree?: boolean;
  isUsageBased?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    try {
      setLoading(true);
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentId,
          planType: "monthly",
          checkoutMode: "hosted"
        }),
      });

      const data = await res.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        alert(data.error.message || "Checkout failed");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button 
      onClick={handleCheckout}
      disabled={loading}
      size="lg" 
      className="w-full rounded-2xl h-14 text-lg font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
    >
      {loading ? "Processing..." : (isUsageBased ? (isLoggedIn ? "Setup Usage Billing" : "Sign in to Setup") : isFree ? (isLoggedIn ? "Get for Free" : "Sign in to Get Access") : (isLoggedIn ? "Subscribe Now" : "Sign in to Subscribe"))}
    </Button>
  );
}
