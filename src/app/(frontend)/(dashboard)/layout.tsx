import { auth } from "@/backend/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/frontend/components/ui/button";
import { Bot, ShoppingBag, Settings, LayoutDashboard, Search, Grid, CreditCard, Shield, Wallet, Package, Code, DollarSign, Activity, Banknote } from "lucide-react";
import { SignOutButton } from "./dashboard/components/SignOutButton";
import { OfflineBanner } from "@/frontend/components/shared/OfflineBanner";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/auth");
  }

  const role = session.user.role || "buyer";

  // Buyer should never reach this layout — middleware redirects to /marketplace/my-agents
  // But as a safety net:
  if (role === "buyer") {
    redirect("/marketplace/my-agents");
  }

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar */}
      <aside className="fixed bottom-0 left-0 top-0 hidden w-56 border-r border-border bg-white lg:block transition-all duration-150">
        <div className="flex h-full flex-col">
          <div className="flex h-[60px] items-center px-4">
            <Link href="/" className="flex items-center gap-2 font-display text-base font-bold text-gray-900">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-white">
                <Bot className="h-4 w-4" />
              </span>
              AI Genius
            </Link>
          </div>
          
          <nav className="flex-1 space-y-0.5 py-4">
            {role === "admin" ? (
              <>
                <div className="mb-2 mt-4 first:mt-0">
                  <span className="px-4 text-xs font-medium uppercase tracking-wider text-gray-400">Admin</span>
                </div>
                <Link href="/admin" className="flex h-9 items-center gap-2.5 mx-2 px-3 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors">
                  <Shield className="h-4 w-4 text-gray-400" /> Dashboard
                </Link>
                <Link href="/admin/monitor" className="flex h-9 items-center gap-2.5 mx-2 px-3 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors">
                  <Activity className="h-4 w-4 text-gray-400" /> Live Monitor
                </Link>
                <Link href="/admin/revenue" className="flex h-9 items-center gap-2.5 mx-2 px-3 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors">
                  <DollarSign className="h-4 w-4 text-gray-400" /> Revenue
                </Link>
                <Link href="/admin/settlements" className="flex h-9 items-center gap-2.5 mx-2 px-3 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors">
                  <Banknote className="h-4 w-4 text-gray-400" /> Settlements
                </Link>

                <div className="mb-2 mt-5">
                  <span className="px-4 text-xs font-medium uppercase tracking-wider text-gray-400">Explore</span>
                </div>
                <Link href="/dashboard/seller" className="flex h-9 items-center gap-2.5 mx-2 px-3 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors">
                  <LayoutDashboard className="h-4 w-4 text-gray-400" /> Seller View
                </Link>
                <Link href="/marketplace" className="flex h-9 items-center gap-2.5 mx-2 px-3 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors">
                  <Search className="h-4 w-4 text-gray-400" /> Marketplace
                </Link>
              </>
            ) : (
              /* Seller sidebar */
              <>
                <div className="mb-2 mt-4 first:mt-0">
                  <span className="px-4 text-xs font-medium uppercase tracking-wider text-gray-400">Seller</span>
                </div>
                <Link href="/dashboard/seller" className="flex h-9 items-center gap-2.5 mx-2 px-3 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors [&.active]:bg-primary-subtle [&.active]:text-primary">
                  <LayoutDashboard className="h-4 w-4 text-gray-400" /> Overview
                </Link>
                <Link href="/dashboard/seller/listings" className="flex h-9 items-center gap-2.5 mx-2 px-3 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors">
                  <ShoppingBag className="h-4 w-4 text-gray-400" /> My Listings
                </Link>
                <Link href="/dashboard/seller/billing" className="flex h-9 items-center gap-2.5 mx-2 px-3 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors">
                  <Wallet className="h-4 w-4 text-gray-400" /> Billing & Payout
                </Link>
                <Link href="/dashboard/seller/developer" className="flex h-9 items-center gap-2.5 mx-2 px-3 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors">
                  <Code className="h-4 w-4 text-gray-400" /> Developer & API
                </Link>
                <Link href="/dashboard/seller/earnings" className="flex h-9 items-center gap-2.5 mx-2 px-3 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors">
                  <DollarSign className="h-4 w-4 text-gray-400" /> Earnings
                </Link>

                <div className="mb-2 mt-5">
                  <span className="px-4 text-xs font-medium uppercase tracking-wider text-gray-400">Explore</span>
                </div>
                <Link href="/marketplace" className="flex h-9 items-center gap-2.5 mx-2 px-3 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors">
                  <Search className="h-4 w-4 text-gray-400" /> Marketplace
                </Link>
                <Link href="/settings" className="flex h-9 items-center gap-2.5 mx-2 px-3 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors">
                  <Settings className="h-4 w-4 text-gray-400" /> Settings
                </Link>
              </>
            )}
          </nav>
          
          <div className="border-t border-border p-4">
            <SignOutButton />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-56 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-border bg-white/80 px-6 backdrop-blur">
          <h2 className="text-sm font-medium">Welcome back, {session.user.name || "User"}</h2>
          <div className="ml-auto flex items-center gap-4">
            <Button asChild variant="outline" size="sm" className="rounded-full hidden sm:flex h-8 px-3">
              <Link href="/marketplace">Explore Tools</Link>
            </Button>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary-glow shadow-sm overflow-hidden border border-border">
              {session.user.image && <img src={session.user.image} alt="Avatar" className="h-full w-full object-cover" />}
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8 flex-1">
          {children}
        </div>
      </main>

      <OfflineBanner />
    </div>
  );
}
