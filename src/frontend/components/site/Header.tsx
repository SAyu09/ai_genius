"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/frontend/components/ui/button";
import {
  Menu, X, Bot, CreditCard, LogOut,
  ChevronDown, LayoutDashboard, ShoppingBag, User, Loader2
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { motion, AnimatePresence } from "framer-motion";

/* ─── helpers ─────────────────────────────────────────── */
function Avatar({ image, name }: { image?: string | null; name?: string | null }) {
  return (
    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 overflow-hidden flex-shrink-0 ring-2 ring-white shadow-sm">
      {image ? (
        <img src={image} alt="Avatar" className="h-full w-full object-cover" />
      ) : (
        <span className="grid h-full w-full place-items-center text-[11px] font-bold text-white">
          {(name || "U")[0].toUpperCase()}
        </span>
      )}
    </div>
  );
}

/* ─── main component ───────────────────────────────────── */
export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status, update: updateSession } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const { activeRoleContext, setRoleContext } = useAuthStore();

  const isLoggedIn = status === "authenticated" && !!session?.user;
  const role = session?.user?.role || "buyer";
  const firstName = session?.user?.name?.split(" ")[0] || "User";

  /* scroll + outside-click */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    const onOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("mousedown", onOutside);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mousedown", onOutside);
    };
  }, []);

  /* close mobile menu on route change */
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  /* sync role context based on route when navigating via back button */
  useEffect(() => {
    if (pathname.startsWith("/marketplace")) {
      setRoleContext("buyer");
    } else if (pathname.startsWith("/dashboard/seller") || pathname.startsWith("/dashboard/list-agent")) {
      setRoleContext("seller");
    }
  }, [pathname, setRoleContext]);


  const handleModeSwitch = async (mode: "buyer" | "seller") => {
    // Only used for the upgrade flow. Navigation is handled by <Link> prefetching.
    // Role context is updated by the pathname-watching useEffect — NOT here.
    if (mode === "seller" && role !== "seller" && role !== "admin") {
      setMobileOpen(false);
      setUpgrading(true);
      try {
        const res = await fetch("/api/sellers/register", { method: "POST" });
        const data = await res.json();
        if (!res.ok && data.error?.code !== "ALREADY_SELLER") {
          throw new Error(data.error?.message || "Failed to upgrade");
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
        toast.error(err.message || "Could not switch to Creator mode.");
      } finally {
        setUpgrading(false);
      }
    }
  };

  /* nav links — driven by activeRoleContext for dual-role support */
  const links = (() => {
    if (!isLoggedIn)
      return [
        { href: "/marketplace", label: "Marketplace" },
        { href: "/sell", label: "Sell" },
        { href: "/pricing", label: "Pricing" },
        { href: "/about", label: "About" },
      ];
    if (activeRoleContext === "seller")
      return [
        { href: "/marketplace", label: "Marketplace" },
        { href: "/dashboard/seller", label: "Dashboard" },
        { href: "/dashboard/seller/listings", label: "Listings" },
      ];
    return [
      { href: "/marketplace", label: "Marketplace" },
      { href: "/marketplace/my-agents", label: "My Agents" },
      { href: "/marketplace/billing", label: "Billing" },
      { href: "/sell", label: "Sell" },
    ];
  })();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  /* dropdown items — driven by activeRoleContext for dual-role support */
  const dropdownItems =
    activeRoleContext === "seller"
      ? [
          { href: "/dashboard/seller", icon: LayoutDashboard, label: "Dashboard" },
          { href: "/dashboard/seller/listings", icon: ShoppingBag, label: "My Listings" },
          { href: "/marketplace/my-agents", icon: Bot, label: "My Agents" },
        ]
      : [
          { href: "/marketplace/my-agents", icon: Bot, label: "My Agents" },
          { href: "/marketplace/billing", icon: CreditCard, label: "Billing" },
        ];

  /* ── render ─────────────────────────────────────────── */
  return (
    <>
      <header
        className={[
          "sticky top-0 z-50 w-full transition-all duration-500",
          scrolled
            ? "bg-white/80 backdrop-blur-xl border-b shadow-[0_1px_20px_-4px_rgba(0,0,0,0.04)] py-2.5"
            : "bg-transparent py-5",
        ].join(" ")}
        style={{
          borderColor: scrolled ? "var(--landing-border-light)" : "transparent",
        }}
      >
        <div className="mx-auto flex w-[min(1200px,95%)] items-center justify-between px-4 sm:px-6">

          {/* ── Logo ──────────────────────────────────────── */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group select-none"
          >
            <img
              src="/logo.png"
              alt="AI Genius Logo"
              className="h-9 w-9 object-contain transition-transform duration-200 group-hover:scale-105"
            />
            <span
              className="font-[family-name:var(--font-space-grotesk)] font-semibold text-[17px] tracking-tight"
              style={{ color: "var(--landing-text-primary)" }}
            >
              AI Genius
            </span>
          </Link>

          {/* ── Desktop nav ───────────────────────────────── */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={[
                  "relative px-3.5 py-2 rounded-lg text-[14px] font-medium transition-all duration-200",
                  isActive(l.href)
                    ? "text-[var(--landing-text-primary)] bg-black/[0.04]"
                    : "text-[var(--landing-text-secondary)] hover:text-[var(--landing-text-primary)] hover:bg-black/[0.03]",
                ].join(" ")}
              >
                {l.label}
                {isActive(l.href) && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute bottom-1.5 left-1/2 -translate-x-1/2 h-0.5 w-3.5 rounded-full"
                    style={{ backgroundColor: "var(--landing-text-primary)" }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* ── Right side actions ────────────────────────── */}
          <div className="flex items-center gap-2">

            {/* Mode Switcher Toggle for Desktop */}
            {isLoggedIn && (
              <div className="hidden sm:flex p-0.5 rounded-[10px] mr-2 border shadow-inner" style={{ backgroundColor: "hsl(210, 20%, 96%)", borderColor: "var(--landing-border-light)" }}>
                <Link
                  href="/marketplace"
                  className={["px-3 py-1.5 text-[13px] font-semibold tracking-tight rounded-md transition-all duration-200", activeRoleContext === "buyer" ? "bg-white text-[var(--landing-text-primary)] shadow-sm ring-1 ring-black/5" : "text-[var(--landing-text-secondary)] hover:text-[var(--landing-text-primary)]"].join(" ")}
                >
                  Buyer
                </Link>
                {role === "seller" || role === "admin" ? (
                  <Link
                    href="/dashboard/seller"
                    className={["flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold tracking-tight rounded-md transition-all duration-200", activeRoleContext === "seller" ? "bg-white text-[var(--landing-text-primary)] shadow-sm ring-1 ring-black/5" : "text-[var(--landing-text-secondary)] hover:text-[var(--landing-text-primary)]"].join(" ")}
                  >
                    Seller
                  </Link>
                ) : (
                  <button
                    onClick={() => handleModeSwitch("seller")}
                    disabled={upgrading}
                    className={["flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold tracking-tight rounded-md transition-all duration-200", activeRoleContext === "seller" ? "bg-white text-[var(--landing-text-primary)] shadow-sm ring-1 ring-black/5" : "text-[var(--landing-text-secondary)] hover:text-[var(--landing-text-primary)]"].join(" ")}
                  >
                    {upgrading && <Loader2 className="h-3 w-3 animate-spin" />}
                    Seller
                  </button>
                )}
              </div>
            )}

            {/* Guest buttons */}
            {!isLoggedIn && (
              <>
                <Link href="/auth" className="hidden sm:block">
                  <button className="h-9 px-4 text-[14px] font-medium rounded-lg transition-all duration-200" style={{ color: "var(--landing-text-secondary)" }}>
                    Sign in
                  </button>
                </Link>
                <Link href="/auth?tab=register" className="hidden sm:block">
                  <button className="cta-primary cta-mono h-9 !py-0 !px-5 !text-[12px] !rounded-lg !gap-2">
                    Get started
                    <span className="inline-block w-1 h-1 rounded-full bg-white/50" />
                  </button>
                </Link>
              </>
            )}

            {/* Logged-in user dropdown */}
            {isLoggedIn && (
              <div className="relative hidden sm:block" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                  className={[
                    "flex items-center gap-2.5 h-9 rounded-lg border px-2 pr-3 transition-all duration-150",
                    dropdownOpen
                      ? "border-teal-300 bg-teal-50/60 shadow-[0_0_0_3px_hsla(174,60%,46%,0.1)]"
                      : "border-[var(--landing-border-light)] bg-white hover:border-[var(--landing-border-hover)] hover:bg-gray-50 shadow-sm",
                  ].join(" ")}
                >
                  <Avatar image={session.user.image} name={session.user.name} />
                  <span className="text-[13.5px] font-semibold max-w-[90px] truncate leading-none" style={{ color: "var(--landing-text-primary)" }}>
                    {firstName}
                  </span>
                  <ChevronDown
                    className={[
                      "h-3.5 w-3.5 transition-transform duration-200",
                      dropdownOpen ? "rotate-180" : "",
                    ].join(" ")}
                    style={{ color: "var(--landing-text-muted)" }}
                  />
                </button>

                {/* Dropdown panel */}
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.98 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute right-0 top-[calc(100%+8px)] w-60 rounded-xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.1),0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden z-50"
                      style={{ border: "1px solid var(--landing-border-light)" }}
                    >

                      {/* User identity */}
                      <div className="flex items-center gap-3 px-4 py-3.5 border-b bg-gray-50/60" style={{ borderColor: "var(--landing-border-light)" }}>
                        <Avatar image={session.user.image} name={session.user.name} />
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold truncate leading-tight" style={{ color: "var(--landing-text-primary)" }}>
                            {session.user.name || "User"}
                          </p>
                          <p className="text-[11px] truncate mt-0.5" style={{ color: "var(--landing-text-muted)" }}>
                            {session.user.email}
                          </p>
                        </div>
                        <span className="ml-auto flex-shrink-0 rounded-full text-[10px] font-bold px-2 py-0.5 capitalize" style={{ backgroundColor: "var(--landing-accent-teal-light)", color: "var(--landing-accent-teal)" }}>
                          {role}
                        </span>
                      </div>

                      {/* Menu items */}
                      <div className="py-1.5 px-1.5">
                        {dropdownItems.map(({ href, icon: Icon, label }) => (
                          <Link
                            key={href}
                            href={href}
                            onClick={() => setDropdownOpen(false)}
                            className={[
                              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-colors",
                              isActive(href)
                                ? "bg-[var(--landing-accent-teal-light)] text-[var(--landing-accent-teal)]"
                                : "text-[var(--landing-text-secondary)] hover:bg-gray-100 hover:text-[var(--landing-text-primary)]",
                            ].join(" ")}
                          >
                            <Icon className={`h-4 w-4 flex-shrink-0 ${isActive(href) ? "text-[var(--landing-accent-teal)]" : "text-[var(--landing-text-muted)]"}`} />
                            {label}
                          </Link>
                        ))}
                      </div>

                      {/* Sign out */}
                      <div className="px-1.5 py-1.5" style={{ borderTop: "1px solid var(--landing-border-light)" }}>
                        <button
                          onClick={() => { setDropdownOpen(false); signOut({ callbackUrl: "/" }); }}
                          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <LogOut className="h-4 w-4 flex-shrink-0" />
                          Sign out
                        </button>
                      </div>

                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileOpen((v) => !v)}
              className={[
                "grid h-9 w-9 place-items-center rounded-lg border transition-colors md:hidden",
                mobileOpen
                  ? "border-teal-200 bg-teal-50 text-teal-600"
                  : "border-[var(--landing-border-light)] bg-white text-[var(--landing-text-secondary)] hover:border-[var(--landing-border-hover)] hover:bg-gray-50",
              ].join(" ")}
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* ── Mobile menu ─────────────────────────────────── */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="mx-auto mt-2 mb-1 w-[min(1200px,95%)] rounded-xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)] overflow-hidden md:hidden"
              style={{ border: "1px solid var(--landing-border-light)" }}
            >

              {/* User identity strip (logged-in only) */}
              {isLoggedIn && (
                <div className="flex items-center gap-3 px-4 py-3 border-b bg-gray-50/70" style={{ borderColor: "var(--landing-border-light)" }}>
                  <Avatar image={session.user.image} name={session.user.name} />
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold truncate" style={{ color: "var(--landing-text-primary)" }}>{session.user.name || "User"}</p>
                    <p className="text-[11px] truncate" style={{ color: "var(--landing-text-muted)" }}>{session.user.email}</p>
                  </div>
                  <span className="ml-auto flex-shrink-0 rounded-full text-[10px] font-bold px-2 py-0.5 capitalize" style={{ backgroundColor: "var(--landing-accent-teal-light)", color: "var(--landing-accent-teal)" }}>
                    {role}
                  </span>
                </div>
              )}

              {/* Nav links */}
              <nav className="flex flex-col gap-0.5 px-2 py-2">
                {/* Mobile Mode Switcher */}
                {isLoggedIn && (
                  <div className="mb-2 p-1 rounded-lg flex border shadow-inner" style={{ backgroundColor: "hsl(210, 20%, 96%)", borderColor: "var(--landing-border-light)" }}>
                    <Link
                      href="/marketplace"
                      onClick={() => setMobileOpen(false)}
                      className={["flex-1 flex items-center justify-center px-3 py-1.5 text-[13px] font-semibold tracking-tight rounded-md transition-all", activeRoleContext === "buyer" ? "bg-white text-[var(--landing-text-primary)] shadow-sm" : "text-[var(--landing-text-secondary)] hover:text-[var(--landing-text-primary)]"].join(" ")}
                    >
                      Buyer
                    </Link>
                    {role === "seller" || role === "admin" ? (
                      <Link
                        href="/dashboard/seller"
                        onClick={() => setMobileOpen(false)}
                        className={["flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold tracking-tight rounded-md transition-all", activeRoleContext === "seller" ? "bg-white text-[var(--landing-text-primary)] shadow-sm" : "text-[var(--landing-text-secondary)] hover:text-[var(--landing-text-primary)]"].join(" ")}
                      >
                        Seller
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleModeSwitch("seller")}
                        disabled={upgrading}
                        className={["flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold tracking-tight rounded-md transition-all", activeRoleContext === "seller" ? "bg-white text-[var(--landing-text-primary)] shadow-sm" : "text-[var(--landing-text-secondary)] hover:text-[var(--landing-text-primary)]"].join(" ")}
                      >
                        {upgrading && <Loader2 className="h-3 w-3 animate-spin" />}
                        Seller
                      </button>
                    )}
                  </div>
                )}
                {links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setMobileOpen(false)}
                    className={[
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-colors",
                      isActive(l.href)
                        ? "bg-[var(--landing-accent-teal-light)] text-[var(--landing-accent-teal)]"
                        : "text-[var(--landing-text-secondary)] hover:bg-gray-100 hover:text-[var(--landing-text-primary)]",
                    ].join(" ")}
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>

              {/* Auth / action buttons */}
              <div className="px-3 py-3 flex flex-col gap-2" style={{ borderTop: "1px solid var(--landing-border-light)" }}>
                {!isLoggedIn ? (
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/auth" onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full h-9 rounded-lg text-[13px]">
                        Sign in
                      </Button>
                    </Link>
                    <Link href="/auth?tab=register" onClick={() => setMobileOpen(false)}>
                      <button className="cta-primary cta-mono w-full !py-2 !text-[12px] !rounded-lg">
                        Get started
                      </button>
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      {dropdownItems.map(({ href, icon: Icon, label }) => (
                        <Link key={href} href={href} onClick={() => setMobileOpen(false)}>
                          <Button
                            variant="outline"
                            size="sm"
                            className={[
                              "w-full h-9 gap-1.5 rounded-lg text-[13px]",
                              isActive(href) ? "border-teal-200 bg-teal-50 text-teal-700" : "",
                            ].join(" ")}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {label}
                          </Button>
                        </Link>
                      ))}
                    </div>
                    <button
                      onClick={() => { setMobileOpen(false); signOut({ callbackUrl: "/" }); }}
                      className="flex items-center justify-center gap-2 w-full rounded-lg border border-red-200 bg-red-50/70 px-3 py-2.5 text-[13px] font-medium text-red-500 hover:bg-red-100 hover:text-red-600 transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign out
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}