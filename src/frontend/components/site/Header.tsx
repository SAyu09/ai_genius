"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/frontend/components/ui/button";
import { Sparkles, Menu, X, Bot, CreditCard, LogOut, ChevronDown, LayoutDashboard, ShoppingBag } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function Header() {
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const isLoggedIn = status === "authenticated" && !!session?.user;
  const role = session?.user?.role || "buyer";

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Nav links based on auth state and role
  const getLinks = () => {
    if (!isLoggedIn) {
      return [
        { href: "/marketplace", label: "Marketplace" },
        { href: "/sell", label: "Sell" },
        { href: "/pricing", label: "Pricing" },
        { href: "/about", label: "About" },
      ];
    }
    if (role === "seller" || role === "admin") {
      return [
        { href: "/marketplace", label: "Marketplace" },
        { href: "/dashboard/seller", label: "Dashboard" },
        { href: "/dashboard/seller/listings", label: "My Listings" },
      ];
    }
    // Buyer
    return [
      { href: "/marketplace", label: "Marketplace" },
      { href: "/marketplace/my-agents", label: "My Agents" },
      { href: "/marketplace/billing", label: "Billing" },
    ];
  };

  const links = getLinks();

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="glass mx-auto mt-4 flex w-[min(1200px,95%)] items-center justify-between rounded-2xl px-4 py-3 sm:px-5">
        <Link href="/" className="flex items-center gap-2 font-display text-lg sm:text-xl">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="font-semibold tracking-tight">sellget<span className="text-gradient">ai</span></span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`hover:text-foreground transition ${pathname === l.href || pathname.startsWith(l.href + "/") ? "text-foreground" : ""}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {!isLoggedIn ? (
            <>
              <Link href="/auth" className="hidden sm:inline-flex">
                <Button variant="ghost" size="sm">Sign in</Button>
              </Link>
              <Link href="/auth?tab=register" className="hidden sm:inline-flex">
                <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90">Get started</Button>
              </Link>
            </>
          ) : (
            /* Logged-in user avatar dropdown */
            <div className="relative hidden sm:block" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-border bg-card/80 py-1.5 pl-1.5 pr-3 transition hover:bg-muted"
              >
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-primary-glow shadow-sm overflow-hidden flex-shrink-0">
                  {session.user.image ? (
                    <img src={session.user.image} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-[10px] font-bold text-primary-foreground">
                      {(session.user.name || "U")[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium text-foreground max-w-[100px] truncate">
                  {session.user.name?.split(" ")[0] || "User"}
                </span>
                <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                  {/* User info */}
                  <div className="border-b border-border px-4 py-3">
                    <p className="text-sm font-semibold text-foreground truncate">{session.user.name || "User"}</p>
                    <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
                    <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary capitalize">
                      {role}
                    </span>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    {role === "buyer" && (
                      <>
                        <Link
                          href="/marketplace/my-agents"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/80 hover:bg-muted hover:text-foreground transition"
                        >
                          <Bot className="h-4 w-4" /> My Agents
                        </Link>
                        <Link
                          href="/marketplace/billing"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/80 hover:bg-muted hover:text-foreground transition"
                        >
                          <CreditCard className="h-4 w-4" /> Billing
                        </Link>
                      </>
                    )}
                    {(role === "seller" || role === "admin") && (
                      <>
                        <Link
                          href="/dashboard/seller"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/80 hover:bg-muted hover:text-foreground transition"
                        >
                          <LayoutDashboard className="h-4 w-4" /> Dashboard
                        </Link>
                        <Link
                          href="/dashboard/seller/listings"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/80 hover:bg-muted hover:text-foreground transition"
                        >
                          <ShoppingBag className="h-4 w-4" /> My Listings
                        </Link>
                        <Link
                          href="/marketplace/my-agents"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/80 hover:bg-muted hover:text-foreground transition"
                        >
                          <Bot className="h-4 w-4" /> My Agents
                        </Link>
                      </>
                    )}
                  </div>

                  {/* Sign out */}
                  <div className="border-t border-border py-1">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        signOut({ callbackUrl: "/" });
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          <button
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border md:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="mx-auto mt-2 w-[min(1200px,95%)] rounded-2xl border border-border bg-card/95 p-4 shadow-[var(--shadow-card)] backdrop-blur md:hidden">
          <nav className="flex flex-col gap-1 text-sm">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-foreground/80 hover:bg-muted hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2">
              {!isLoggedIn ? (
                <>
                  <Link href="/auth" onClick={() => setOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full">Sign in</Button>
                  </Link>
                  <Link href="/auth?tab=register" onClick={() => setOpen(false)}>
                    <Button size="sm" className="w-full bg-foreground text-background hover:bg-foreground/90">Get started</Button>
                  </Link>
                </>
              ) : (
                <>
                  {role === "buyer" && (
                    <>
                      <Link href="/marketplace/my-agents" onClick={() => setOpen(false)}>
                        <Button variant="outline" size="sm" className="w-full gap-1.5">
                          <Bot className="h-3.5 w-3.5" /> My Agents
                        </Button>
                      </Link>
                      <Link href="/marketplace/billing" onClick={() => setOpen(false)}>
                        <Button variant="outline" size="sm" className="w-full gap-1.5">
                          <CreditCard className="h-3.5 w-3.5" /> Billing
                        </Button>
                      </Link>
                    </>
                  )}
                  {(role === "seller" || role === "admin") && (
                    <>
                      <Link href="/dashboard/seller" onClick={() => setOpen(false)}>
                        <Button variant="outline" size="sm" className="w-full gap-1.5">
                          <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
                        </Button>
                      </Link>
                      <Link href="/dashboard/seller/listings" onClick={() => setOpen(false)}>
                        <Button variant="outline" size="sm" className="w-full gap-1.5">
                          <ShoppingBag className="h-3.5 w-3.5" /> Listings
                        </Button>
                      </Link>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                    className="col-span-2 flex items-center justify-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Sign out
                  </button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
