"use client";

import { Button } from "@/frontend/components/ui/button";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <Button 
      variant="ghost" 
      onClick={() => signOut({ callbackUrl: "/" })} 
      className="w-full justify-start gap-3 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
    >
      <LogOut className="h-4 w-4" /> Sign Out
    </Button>
  );
}
