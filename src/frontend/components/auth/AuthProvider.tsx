"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useAuthStore } from "@/store/authStore";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { setUser, clearAuth, setLoading } = useAuthStore();

  useEffect(() => {
    if (status === "loading") {
      setLoading(true);
    } else if (status === "authenticated" && session?.user) {
      setUser({
        id: session.user.id || "",
        name: session.user.name || "",
        email: session.user.email || "",
        image: session.user.image || null,
        role: (session.user.role as any) || "buyer",
      });
      setLoading(false);
    } else {
      clearAuth();
      setLoading(false);
    }
  }, [session, status, setUser, clearAuth, setLoading]);

  return <>{children}</>;
}
