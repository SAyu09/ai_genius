"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/**
 * Detects navigator.onLine status and shows a banner when offline.
 * Auto-dismisses when connection is restored.
 */
export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    // Check initial state
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsOffline(true);
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 flex items-center justify-center gap-2 bg-destructive px-4 py-2.5 text-destructive-foreground text-sm font-medium shadow-lg animate-in slide-in-from-bottom duration-300">
      <WifiOff className="h-4 w-4" />
      <span>You&apos;re offline. Some features may be unavailable.</span>
    </div>
  );
}
