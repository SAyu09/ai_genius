"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { 
 BrainCircuit, PackageOpen, SlidersHorizontal, LayoutGrid, ScanSearch, Grid2X2, 
 Wallet2, ShieldCheck, BadgeDollarSign, Code2, CircleDollarSign, Gauge, 
 Landmark, LogOut, Command, ChevronDown, Menu, X, Loader2, CirclePlus
} from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { cn } from "@/frontend/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

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
 const { update: updateSession } = useSession();
 const [mobileOpen, setMobileOpen] = React.useState(false);
 const [userDropdownOpen, setUserDropdownOpen] = React.useState(false);
 const [upgrading, setUpgrading] = React.useState(false);
 const dropdownRef = React.useRef<HTMLDivElement>(null);

 const { activeRoleContext, setRoleContext } = useAuthStore();

 const role = session?.user?.role || "buyer";
 const email = session?.user?.email || "";
 const name = session?.user?.name || "User";
 const image = session?.user?.image;

 // Derive the visual active mode: admin is special, otherwise use the store context
 const activeMode: Mode = React.useMemo(() => {
 if (pathname.startsWith("/admin")) return "admin";
 return activeRoleContext;
 }, [pathname, activeRoleContext]);

 // Sync store context from pathname — single source of truth for role context
 React.useEffect(() => {
 if (pathname.startsWith("/admin")) return; // admin is independent
 if (pathname.startsWith("/dashboard/seller") || pathname.startsWith("/dashboard/list-agent")) {
 setRoleContext("seller");
 } else if (pathname.startsWith("/marketplace")) {
 setRoleContext("buyer");
 }
 }, [pathname, setRoleContext]);

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

 const handleModeSwitch = async (mode: Mode) => {
 // Only used for the upgrade flow. Navigation is handled by <Link> prefetching.
 // Role context is updated by the pathname-watching useEffect — NOT here.
 if (mode === "seller" && role !== "seller" && role !== "admin") {
 setMobileOpen(false);
 setUpgrading(true);
 try {
 const res = await fetch("/api/sellers/register", { method: "POST" });
 const data = await res.json();

 if (!res.ok && data.error?.code !== "ALREADY_SELLER") {
 throw new Error(data.error?.message || "Failed to upgrade account");
 }

 // Refresh the NextAuth session so the JWT gets the new role
 const csrfRes = await fetch("/api/auth/csrf");
 const { csrfToken } = await csrfRes.json();
 await fetch("/api/auth/session", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ csrfToken, data: { role: "seller" } })
 });

 toast.success("Creator mode activated! 🎉");
 
 // Add a tiny delay to ensure browser persists the new session cookie
 await new Promise(resolve => setTimeout(resolve, 300));
 
 // Force a hard navigation to avoid Next.js router cache and ensure the new cookie is sent
 window.location.href = "/dashboard/seller";
 } catch (err: any) {
 console.error("Role upgrade error:", err);
 toast.error(err.message || "Could not switch to Creator mode.");
 } finally {
 setUpgrading(false);
 }
 }
 };

 // Define navigation lists for each mode
 const buyerLinks: NavLink[] = [
  { href: "/marketplace", label: "Explore Marketplace", icon: ScanSearch },
  { href: "/marketplace/my-agents", label: "My Purchases", icon: Grid2X2 },
  { href: "/marketplace/billing", label: "Billing & Subscriptions", icon: Wallet2 },
  { href: "/settings", label: "Account Settings", icon: SlidersHorizontal }
  ];

  const sellerLinks: NavLink[] = [
  { href: "/dashboard/seller", label: "Overview", icon: LayoutGrid },
  { href: "/dashboard/seller/listings", label: "My Listings", icon: PackageOpen },
  { href: "/dashboard/list-agent", label: "Add Agent", icon: CirclePlus },
  { href: "/dashboard/seller/earnings", label: "Earnings & Telemetry", icon: CircleDollarSign },
  { href: "/dashboard/seller/developer", label: "Developer & API Keys", icon: Code2 },
  { href: "/dashboard/seller/billing", label: "Billing & Payouts", icon: BadgeDollarSign },
  ];

  const adminLinks: NavLink[] = [
  { href: "/admin", label: "Platform Console", icon: ShieldCheck },
  { href: "/admin/monitor", label: "Live Telemetry Monitor", icon: Gauge },
  { href: "/admin/revenue", label: "Revenue Ledger", icon: CircleDollarSign },
  { href: "/admin/settlements", label: "Weekly Settlements", icon: Landmark }
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
 <div className="flex h-12 items-center px-2 mb-4">
 <Link href="/marketplace" className="flex items-center font-display text-base font-bold text-gray-900">
 <img
 src="/logo.png"
 alt="AI Genius Logo"
 className="h-14 w-14 object-cover -ml-2 -mr-3"
 />
 AI Genius
 </Link>
 </div>

 {/* Cmd+K Omnibar Trigger button */}
 <button
 onClick={handleTriggerOmnibar}
 className="flex items-center justify-between w-full h-10 rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-2 text-[11px] text-gray-500 font-medium hover:bg-gray-100 transition-colors mb-4 shadow-sm"
 >
 <span className="flex items-center gap-2 truncate">
  <ScanSearch className="h-3.5 w-3.5 text-gray-400 shrink-0" />
 <span className="truncate">Search or command...</span>
 </span>
 <span className="flex items-center gap-0.5 border border-gray-200 bg-white px-1.5 py-0.5 rounded font-mono text-[9px] shadow-sm shrink-0">
 <Command className="h-2.5 w-2.5 text-gray-400" />
 <span>K</span>
 </span>
 </button>

 {/* Contextual Mode Switcher */}
 <div className="bg-gray-100/80 p-1 rounded-xl grid grid-cols-2 gap-1 mb-3 text-[11px] font-semibold tracking-tight border border-gray-200/60 shadow-sm">
 <Link
 href="/marketplace"
 className={cn(
 "py-1.5 rounded-lg text-center transition-all duration-200 cursor-pointer block",
 activeMode === "buyer" 
 ? "bg-white text-gray-900 shadow-sm ring-1 ring-black/5" 
 : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
 )}
 >
 Buyer
 </Link>
 {role === "seller" || role === "admin" ? (
 <Link
 href="/dashboard/seller"
 className={cn(
 "py-1.5 rounded-lg text-center transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5",
 activeMode === "seller" 
 ? "bg-white text-gray-900 shadow-sm ring-1 ring-black/5" 
 : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
 )}
 >
 Seller
 </Link>
 ) : (
 <button
 onClick={() => handleModeSwitch("seller")}
 disabled={upgrading}
 className={cn(
 "py-1.5 rounded-lg text-center transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5",
 activeMode === "seller" 
 ? "bg-white text-gray-900 shadow-sm ring-1 ring-black/5" 
 : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
 )}
 >
 {upgrading ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
 Seller
 </button>
 )}
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
 isActive ? "text-teal-600" : "text-gray-400"
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
 <div className="h-8 w-8 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 overflow-hidden border border-gray-200">
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
 <SlidersHorizontal className="h-3.5 w-3.5 text-gray-400" />
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
 <Link href="/marketplace" className="flex items-center font-display text-sm font-bold text-gray-900">
 <img
 src="/logo.png"
 alt="AI Genius Logo"
 className="h-14 w-14 object-cover -ml-3 -mr-4"
 />
 AI Genius
 </Link>

 <div className="flex items-center gap-2">
 <button
 onClick={handleTriggerOmnibar}
 className="grid h-8 w-8 place-items-center rounded-lg border border-gray-200 bg-gray-50 text-gray-400"
 >
  <ScanSearch className="h-4 w-4" />
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
