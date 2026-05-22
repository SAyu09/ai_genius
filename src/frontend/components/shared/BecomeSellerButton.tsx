"use client";

import { Button } from "@/frontend/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useSession } from "next-auth/react";

interface BecomeSellerButtonProps {
  isLoggedIn: boolean;
  text?: string;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
}

export function BecomeSellerButton({ isLoggedIn, text = "Become a seller", className, variant = "default" }: BecomeSellerButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setRoleContext } = useAuthStore();
  const { update } = useSession();

  const handleBecomeSeller = async () => {
    if (!isLoggedIn) {
      router.push("/auth?tab=register");
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch("/api/sellers/register", { method: "POST" });
      const data = await res.json();
      
      if (!res.ok && data.error?.code !== "ALREADY_SELLER") {
        throw new Error(data.error?.message || "Failed to upgrade account");
      }
      
      await update();
      setRoleContext("seller");
      toast.success("Welcome to Creator Studio! 🎉");
      router.push("/dashboard/seller");
    } catch (err: any) {
      toast.error(err.message || "Could not switch to Creator mode.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      size="lg" 
      variant={variant}
      className={className || "rounded-full"} 
      onClick={handleBecomeSeller} 
      disabled={loading}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {text}
    </Button>
  );
}
