"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/frontend/components/ui/button";
import { Sparkles, Bot, MessageSquare, LineChart, Zap, Check } from "lucide-react";

import { signIn } from "next-auth/react";

export default function SignInPage() {
  const [loading, setLoading] = useState(false);

  const handleOAuth = async (provider: "google", role: "buyer" | "seller" | "admin") => {
    setLoading(true);
    try {
      // Set a cookie so we know the intent after callback
      document.cookie = `intended_role=${role}; path=/; max-age=3600`;
      
      const callbackUrl = role === "seller" ? "/api/auth/upgrade-role" : (role === "admin" ? "/admin" : "/dashboard");
      await signIn(provider, { callbackUrl });
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-12">
        <Link href="/" className="flex items-center gap-2 font-display text-xl">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="font-semibold tracking-tight">sellget<span className="text-gradient">ai</span></span>
        </Link>

        <div className="mx-auto w-full max-w-sm py-12">
          <h1 className="font-display text-3xl sm:text-4xl">Welcome back.</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to deploy and manage your agents.</p>

          <div className="space-y-3 mt-8">
            <Button 
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white" 
              size="lg" 
              disabled={loading}
              onClick={() => handleOAuth("google", "buyer")}
            >
              {loading ? "Redirecting..." : "Login as User"}
            </Button>
            <Button 
              className="w-full rounded-xl bg-green-600 hover:bg-green-700 text-white" 
              size="lg" 
              disabled={loading}
              onClick={() => handleOAuth("google", "seller")}
            >
              {loading ? "Redirecting..." : "Login as Seller"}
            </Button>
            <Button 
              variant="outline"
              className="w-full rounded-xl" 
              size="lg" 
              disabled={loading}
              onClick={() => handleOAuth("google", "admin")}
            >
              {loading ? "Redirecting..." : "Admin Login"}
            </Button>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            New to SellGetAI? <Link href="/sign-up" className="text-foreground underline-offset-4 hover:underline">Create an account</Link>
          </p>
        </div>

        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} SellGetAI</p>
      </div>

      {/* Designed showcase panel */}
      <div className="relative hidden overflow-hidden lg:block" style={{ background: "var(--gradient-primary)" }}>
        {/* glow */}
        <div aria-hidden className="absolute -left-32 -top-32 h-[480px] w-[480px] rounded-full bg-white/15 blur-3xl" />
        <div aria-hidden className="absolute -right-32 bottom-0 h-[420px] w-[420px] rounded-full bg-black/20 blur-3xl" />
        {/* grid */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 40%, transparent 75%)",
          }}
        />

        <div className="relative flex h-full flex-col justify-between p-12 text-primary-foreground">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            Live in 140+ countries
          </div>

          {/* Floating agent cards */}
          <div className="relative my-8 grid grid-cols-2 gap-4">
            {[
              { name: "Atlas SDR", role: "Sales · live", icon: Bot },
              { name: "Helio Support", role: "Support · live", icon: MessageSquare },
              { name: "Pulse", role: "Analytics · live", icon: LineChart },
              { name: "Quill", role: "Content · live", icon: Sparkles },
            ].map((c, i) => (
              <div
                key={c.name}
                className={`flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur ${i % 2 ? "translate-y-3" : "-translate-y-2"}`}
              >
                <div className="grid h-10 w-10 place-items-center rounded-full bg-white/20">
                  <c.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{c.name}</div>
                  <div className="truncate text-[11px] opacity-80">{c.role}</div>
                </div>
                <Zap className="ml-auto h-3.5 w-3.5" />
              </div>
            ))}
          </div>

          <div>
            <blockquote className="font-display text-2xl leading-tight sm:text-3xl">
              &quot;SellGetAI replaced three SaaS tools and an outsourced SDR team in a single quarter.&quot;
            </blockquote>
            <div className="mt-4 text-sm opacity-80">Priya R., Head of GTM at Northwind</div>

            <ul className="mt-8 grid grid-cols-2 gap-2 text-sm">
              {["2,400+ agents", "60+ currencies", "Deploy in 60s", "Cancel anytime"].map((t) => (
                <li key={t} className="flex items-center gap-2 opacity-90"><Check className="h-4 w-4" /> {t}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
