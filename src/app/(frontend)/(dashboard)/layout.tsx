import { auth } from "@/backend/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/frontend/components/ui/button";
import { Bot, ShoppingBag, Settings, LayoutDashboard, Search, Grid, CreditCard, Shield } from "lucide-react";
import { SignOutButton } from "./dashboard/components/SignOutButton";
import { OfflineBanner } from "@/frontend/components/shared/OfflineBanner";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/sign-in");
  }

  const role = session.user.role || "buyer";

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Mini Sidebar */}
      <aside className="fixed bottom-0 left-0 top-0 hidden w-64 border-r bg-background lg:block">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center border-b px-6">
            <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </span>
              AI Genius
            </Link>
          </div>
          
          <nav className="flex-1 space-y-1 p-4">
            {role === "admin" ? (
              <>
                <Button asChild variant="ghost" className="w-full justify-start gap-3 rounded-xl bg-muted/50">
                  <Link href="/admin">
                    <Shield className="h-4 w-4" /> Admin Dashboard
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="w-full justify-start gap-3 rounded-xl">
                  <Link href="/dashboard">
                    <Grid className="h-4 w-4" /> Buyer View
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="w-full justify-start gap-3 rounded-xl">
                  <Link href="/marketplace">
                    <Search className="h-4 w-4" /> Marketplace
                  </Link>
                </Button>
              </>
            ) : role === "seller" ? (
              <>
                <Button asChild variant="ghost" className="w-full justify-start gap-3 rounded-xl bg-muted/50">
                  <Link href="/dashboard/seller">
                    <LayoutDashboard className="h-4 w-4" /> Seller Dashboard
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="w-full justify-start gap-3 rounded-xl">
                  <Link href="/dashboard/list-agent">
                    <ShoppingBag className="h-4 w-4" /> My Listings
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="w-full justify-start gap-3 rounded-xl">
                  <Link href="/dashboard">
                    <Grid className="h-4 w-4" /> My Tools
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="w-full justify-start gap-3 rounded-xl">
                  <Link href="/settings">
                    <Settings className="h-4 w-4" /> Settings
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" className="w-full justify-start gap-3 rounded-xl bg-muted/50">
                  <Link href="/dashboard">
                    <Grid className="h-4 w-4" /> My Tools
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="w-full justify-start gap-3 rounded-xl">
                  <Link href="/marketplace">
                    <Search className="h-4 w-4" /> Explore Market
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="w-full justify-start gap-3 rounded-xl">
                  <Link href="/billing">
                    <CreditCard className="h-4 w-4" /> Billing & Subscriptions
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="w-full justify-start gap-3 rounded-xl">
                  <Link href="/settings">
                    <Settings className="h-4 w-4" /> Settings
                  </Link>
                </Button>
              </>
            )}
          </nav>
          
          <div className="border-t p-4">
            <SignOutButton />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-background/80 px-6 backdrop-blur">
          <h2 className="text-sm font-medium">Welcome back, {session.user.name || "User"}</h2>
          <div className="ml-auto flex items-center gap-4">
            {role === "buyer" && (
              <Button asChild variant="outline" size="sm" className="rounded-full hidden sm:flex">
                <Link href="/marketplace">Explore Tools</Link>
              </Button>
            )}
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary-glow shadow-sm overflow-hidden">
              {session.user.image && <img src={session.user.image} alt="Avatar" className="h-full w-full object-cover" />}
            </div>
          </div>
        </header>

        {children}
      </main>

      <OfflineBanner />
    </div>
  );
}
