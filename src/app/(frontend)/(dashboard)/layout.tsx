import { auth } from "@/backend/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "./dashboard/components/Sidebar";
import { OfflineBanner } from "@/frontend/components/shared/OfflineBanner";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/auth");
  }

  const role = session.user.role || "buyer";

  return (
    <div className="flex min-h-screen bg-gray-50/30">
      {/* Premium Grayscale Contextual Sidebar */}
      <Sidebar session={session} />

      {/* Main Panel */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Sleek Enterprise Top Bar (Linear/Stripe style) */}
        <header className="sticky top-0 z-10 hidden lg:flex h-14 items-center border-b border-gray-150 bg-white/80 px-8 backdrop-blur select-none">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400">
            <span>Workspace</span>
            <span>/</span>
            <span className="text-gray-900 font-medium capitalize">
              {role === "admin" ? "Operations & Integrity Console" : "Creator Studio"}
            </span>
          </div>
          
          <div className="ml-auto flex items-center gap-4">
            <span className="text-[11px] text-gray-400 font-semibold border border-gray-150 rounded px-2 py-0.5 bg-gray-50 flex items-center gap-1.5">
              <span>Omnibar Shortcut:</span>
              <kbd className="font-mono text-[9px] text-gray-500 bg-white border border-gray-200 px-1 rounded shadow-xs">⌘K</kbd>
            </span>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="p-6 sm:p-8 lg:p-10 flex-1">
          {children}
        </main>
      </div>

      <OfflineBanner />
    </div>
  );
}
