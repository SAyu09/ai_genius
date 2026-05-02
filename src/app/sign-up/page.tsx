"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Sparkles, Bot, MessageSquare, LineChart, Zap } from "lucide-react";

import { createSupabaseBrowserClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "buyer" as "buyer" | "seller" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.push("/dashboard");
    });
  }, [supabase, router]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            name: form.name,
            role: form.role,
          },
          emailRedirectTo: `${location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      alert("Check your email to confirm your account!");
      router.push("/sign-in");
    } catch (err: any) {
      setError(err.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "github") => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Designed showcase panel */}
      <div className="relative hidden overflow-hidden lg:block" style={{ background: "var(--gradient-primary)" }}>
        <div aria-hidden className="absolute -right-32 -top-32 h-[480px] w-[480px] rounded-full bg-white/15 blur-3xl" />
        <div aria-hidden className="absolute -left-32 bottom-0 h-[420px] w-[420px] rounded-full bg-black/20 blur-3xl" />
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
          <Link href="/" className="flex items-center gap-2 font-display text-xl">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/20 backdrop-blur">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="font-semibold tracking-tight">sellgetai</span>
          </Link>

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
            <h2 className="font-display text-3xl leading-tight sm:text-4xl">Join 80,000+ teams deploying AI agents.</h2>
            <ul className="mt-6 grid gap-2 text-sm">
              {["2,400+ vetted agents", "Deploy in under a minute", "Sellers keep 85% of every sale", "Global payouts in 60+ currencies"].map((t) => (
                <li key={t} className="flex items-center gap-2 opacity-95"><Check className="h-4 w-4" /> {t}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-12">
        <Link href="/" className="flex items-center gap-2 font-display text-xl lg:hidden">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="font-semibold tracking-tight">sellget<span className="text-gradient">ai</span></span>
        </Link>

        <div className="mx-auto w-full max-w-sm py-12">
          <h1 className="font-display text-3xl sm:text-4xl">Create your account.</h1>
          <p className="mt-2 text-sm text-muted-foreground">Free forever. No credit card required.</p>

          <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl border border-border bg-card p-1">
            {(["buyer", "seller"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setForm({ ...form, role: r })}
                className={`rounded-lg px-3 py-2 text-sm capitalize transition ${
                  form.role === r ? "bg-foreground text-background" : "text-muted-foreground"
                }`}
              >
                I&apos;m a {r}
              </button>
            ))}
          </div>

          <form
            className="mt-6 space-y-4"
            onSubmit={handleSignUp}
          >
            {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
            <div className="grid gap-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-11 rounded-xl" placeholder="Jane Doe" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Work email</Label>
              <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-11 rounded-xl" placeholder="you@company.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="h-11 rounded-xl" placeholder="At least 8 characters" />
            </div>
            <Button type="submit" size="lg" className="w-full rounded-xl" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-2">
            <Button variant="outline" className="w-full rounded-xl" size="lg" onClick={() => handleOAuth("google")}>Continue with Google</Button>
            <Button variant="outline" className="w-full rounded-xl" size="lg" onClick={() => handleOAuth("github")}>Continue with GitHub</Button>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account? <Link href="/sign-in" className="text-foreground underline-offset-4 hover:underline">Sign in</Link>
          </p>
        </div>

        <p className="text-xs text-muted-foreground">By signing up you agree to our Terms and Privacy Policy.</p>
      </div>
    </div>
  );
}
