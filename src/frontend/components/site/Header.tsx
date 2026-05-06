"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/frontend/components/ui/button";
import { Sparkles, Menu, X } from "lucide-react";
import { useState } from "react";

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const links = [
    { href: "/marketplace", label: "Marketplace" },
    { href: "/sell", label: "Sell" },
    { href: "/pricing", label: "Pricing" },
    { href: "/about", label: "About" },
  ] as const;

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
              className={`hover:text-foreground transition ${pathname === l.href ? "text-foreground" : ""}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/sign-in" className="hidden sm:inline-flex">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link href="/sign-up" className="hidden sm:inline-flex">
            <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90">Get started</Button>
          </Link>
          <button
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border md:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

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
              <Link href="/sign-in" onClick={() => setOpen(false)}>
                <Button variant="outline" size="sm" className="w-full">Sign in</Button>
              </Link>
              <Link href="/sign-up" onClick={() => setOpen(false)}>
                <Button size="sm" className="w-full bg-foreground text-background hover:bg-foreground/90">Get started</Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
