"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { 
  Bot, ShoppingBag, Settings, LayoutDashboard, Search, Grid, 
  CreditCard, Shield, Wallet, Code, DollarSign, Activity, 
  Banknote, LogOut, Command, ChevronDown, Menu, X 
} from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { cn } from "@/frontend/lib/utils";

interface SidebarProps {
  session: {
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string | null;
    };
  };
}

type Mode = "buyer" | "seller" | "admin";

interface NavLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function Sidebar({ session }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const role = session?.user?.role || "buyer";
  const email = session?.user?.email || "";
  const name = session?.user?.name || "User";
  const image = session?.user?.image;

  // Determine active mode from current pathname
  const getActiveModeFromPath = React.useCallback((): Mode => {
    if (pathname.startsWith("/admin")) return "admin";
    if (pathname.startsWith("/dashboard/seller")) return "seller";
    return "buyer";
  }, [pathname]);

  const [activeMode, setActiveMode] = React.useState<Mode>(getActiveModeFromPath);

  React.useEffect(() => {
    setActiveMode(getActiveModeFromPath());
  }, [pathname, getActiveModeFromPath]);

  // Handle outside click for user profile dropdown
  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleModeSwitch = (mode: Mode) => {
    setActiveMode(mode);
    setMobileOpen(false);
    if (mode === "admin") {
      router.push("/admin");
    } else if (mode === "seller") {
      router.push("/dashboard/seller");
    } else {
      router.push("/marketplace/my-agents");
    }
  };

  // Define navigation lists for each mode
  const buyerLinks: NavLink[] = [
    { href: "/marketplace/my-agents", label: "My Active Agents", icon: Grid },
    { href: "/marketplace", label: "Discover Agents", icon: Search },
    { href: "/marketplace/billing", label: "Billing & Subscriptions", icon: CreditCard },
    { href: "/settings", label: "Account Settings", icon: Settings }
  ];

  const sellerLinks: NavLink[] = [
    { href: "/dashboard/seller", label: "Studio Overview", icon: LayoutDashboard },
    { href: "/dashboard/seller/listings", label: "My Listings", icon: ShoppingBag },
    { href: "/dashboard/seller/billing", label: "Billing & Payouts", icon: Wallet },
    { href: "/dashboard/seller/developer", label: "Developer & API Keys", icon: Code },
    { href: "/dashboard/seller/earnings", label: "Earnings & Telemetry", icon: DollarSign }
  ];

  const adminLinks: NavLink[] = [
    { href: "/admin", label: "Platform Console", icon: Shield },
    { href: "/admin/monitor", label: "Live Telemetry Monitor", icon: Activity },
    { href: "/admin/revenue", label: "Revenue Ledger", icon: DollarSign },
    { href: "/admin/settlements", label: "Weekly Settlements", icon: Banknote }
  ];

  const getLinksForMode = () => {
    if (activeMode === "admin") return adminLinks;
    if (activeMode === "seller") return sellerLinks;
    return buyerLinks;
  };

  const currentLinks = getLinksForMode();

  const handleTriggerOmnibar = () => {
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      bubbles: true,
      cancelable: true
    });
    document.dispatchEvent(event);
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-white border-r border-gray-150 p-4 select-none">
      {/* Brand Header */}
      <div className="flex h-12 items-center px-2 mb-6">
        <Link href="/" className="flex items-center gap-2.5 font-display text-base font-bold text-gray-900">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-indigo-600 text-white">
            <Bot className="h-4 w-4" />
          </span>
          AI Genius
        </Link>
      </div>

      {/* Cmd+K Omnibar Trigger button */}
      <button
        onClick={handleTriggerOmnibar}
        className="flex items-center justify-between w-full h-9 rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-1.5 text-xs text-gray-400 font-medium hover:bg-gray-50 transition-colors mb-6"
      >
        <span className="flex items-center gap-2">
          <Search className="h-3.5 w-3.5 text-gray-400" />
          Search or run command...
        </span>
        <span className="flex items-center gap-0.5 border border-gray-200 bg-white px-1.5 py-0.5 rounded font-mono text-[9px]">
          <Command className="h-2 w-2" />
          <span>K</span>
        </span>
      </button>

      {/* Grayscale Contextual Mode Switcher */}
      <div className="bg-gray-100 p-1 rounded-lg grid grid-cols-3 gap-1 mb-6 text-[11px] font-semibold tracking-tight">
        <button
          onClick={() => handleModeSwitch("buyer")}
          className={cn(
            "py-1.5 rounded-md text-center transition-all duration-150 cursor-pointer",
            activeMode === "buyer" 
              ? "bg-white text-gray-900 shadow-sm" 
              : "text-gray-500 hover:text-gray-900"
          )}
        >
          Buyer
        </button>
        <button
          onClick={() => {
            if (role === "seller" || role === "admin") {
              handleModeSwitch("seller");
            } else {
              router.push("/sell");
            }
          }}
          className={cn(
            "py-1.5 rounded-md text-center transition-all duration-150 cursor-pointer",
            activeMode === "seller" 
              ? "bg-white text-gray-900 shadow-sm" 
              : "text-gray-500 hover:text-gray-900"
          )}
        >
          Creator
        </button>
        <button
          onClick={() => {
            if (role === "admin") {
              handleModeSwitch("admin");
            } else {
              // Not admin
            }
          }}
          disabled={role !== "admin"}
          className={cn(
            "py-1.5 rounded-md text-center transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
            activeMode === "admin" 
              ? "bg-white text-gray-900 shadow-sm" 
              : "text-gray-500 hover:text-gray-900"
          )}
        >
          Admin
        </button>
      </div>

      {/* Secondary Mode / Workspace Title */}
      <div className="px-2 mb-3">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          {activeMode === "admin" && "Operations Desk"}
          {activeMode === "seller" && "Creator Studio"}
          {activeMode === "buyer" && "Client Space"}
        </span>
      </div>

      {/* Navigation List - 8-point spatial grid styling */}
      <nav className="flex-1 space-y-1">
        {currentLinks.map((link) => {
          const isActive = pathname === link.href || (link.href !== "/dashboard/seller" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex h-9 items-center gap-3 px-3 rounded-lg text-sm font-medium transition-all duration-100",
                isActive 
                  ? "bg-gray-100 text-gray-950 font-semibold" 
                  : "text-gray-500 hover:text-gray-950 hover:bg-gray-50"
              )}
            >
              <link.icon className={cn(
                "h-4 w-4",
                isActive ? "text-indigo-600" : "text-gray-400"
              )} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* User profile dropdown drawer */}
      <div className="border-t border-gray-150 pt-4 relative" ref={dropdownRef}>
        <button
          onClick={() => setUserDropdownOpen(!userDropdownOpen)}
          className="flex items-center gap-3 w-full p-2 rounded-xl border border-gray-150 bg-gray-50/50 hover:bg-gray-50 transition-all select-none text-left"
        >
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 overflow-hidden border border-gray-200">
            {image ? (
              <img src={image} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <span className="grid h-full w-full place-items-center text-xs font-bold text-white uppercase">
                {name[0]}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800 truncate leading-none">{name}</p>
            <p className="text-[10px] text-gray-400 truncate mt-1 leading-none">{email}</p>
          </div>
          <ChevronDown className={cn("h-3.5 w-3.5 text-gray-400 transition-transform", userDropdownOpen && "rotate-180")} />
        </button>

        {userDropdownOpen && (
          <div className="absolute bottom-[calc(100%+8px)] left-0 w-full rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden z-30 animate-in fade-in slide-in-from-bottom-1 duration-150">
            <div className="py-1 px-1">
              <Link
                href="/settings"
                onClick={() => setUserDropdownOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <Settings className="h-3.5 w-3.5 text-gray-400" />
                Account Settings
              </Link>
              <button
                onClick={() => {
                  setUserDropdownOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
                className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors text-left"
              >
                <LogOut className="h-3.5 w-3.5 text-red-500" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed bottom-0 left-0 top-0 hidden w-60 lg:block z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Top Header */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-gray-150 bg-white/80 px-4 backdrop-blur lg:hidden select-none">
        <Link href="/" className="flex items-center gap-2 font-display text-sm font-bold text-gray-900">
          <span className="grid h-6 w-6 place-items-center rounded bg-indigo-600 text-white">
            <Bot className="h-3.5 w-3.5" />
          </span>
          AI Genius
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTriggerOmnibar}
            className="grid h-8 w-8 place-items-center rounded-lg border border-gray-200 bg-gray-50 text-gray-400"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="grid h-8 w-8 place-items-center rounded-lg border border-gray-200 bg-gray-50 text-gray-500"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden animate-in fade-in duration-200">
          <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-xs" onClick={() => setMobileOpen(false)} />
          <div className="fixed bottom-0 left-0 top-0 w-64 bg-white animate-in slide-in-from-left duration-250">
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
}
