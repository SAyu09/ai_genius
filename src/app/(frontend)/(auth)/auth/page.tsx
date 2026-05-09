"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import {
  Sparkles,
  Bot,
  MessageSquare,
  LineChart,
  Zap,
  Check,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Store,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

type AuthTab = "signin" | "register";
type SelectedRole = "buyer" | "seller";

// Separate the content that uses useSearchParams into its own component
function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<AuthTab>(
    searchParams.get("tab") === "register" ? "register" : "signin"
  );
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Sign In form
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Register form
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState<SelectedRole>("buyer");

  // Sync tab from URL
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "register") setActiveTab("register");
  }, [searchParams]);

  // Clear errors on tab switch
  useEffect(() => {
    setError(null);
  }, [activeTab]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email: signInEmail,
        password: signInPassword,
        redirect: false,
      });

      if (result?.error) {
        let errorMessage = "Invalid email or password. Please try again.";
        
        // NextAuth v5 passes the custom error code via URL query param when subclassing CredentialsSignin
        if (result.url) {
          try {
            const urlObj = new URL(result.url, window.location.origin);
            const codeParam = urlObj.searchParams.get("code");
            if (codeParam && codeParam !== "credentials") {
              errorMessage = codeParam; // This is the message we passed in CustomAuthError
            }
          } catch (e) {}
        }
        
        setError(errorMessage);
        setLoading(false);
        return;
      }

      // Successful login — fetch session to check role
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      const role = session?.user?.role;

      if (role === "admin") {
        router.push("/admin");
      } else if (role === "seller") {
        router.push("/dashboard/seller");
      } else {
        router.push("/marketplace");
      }
      
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Client-side validation
    if (regName.trim().length < 2) {
      setError("Name must be at least 2 characters");
      setLoading(false);
      return;
    }
    if (regPassword.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    try {
      // Step 1: Register via API
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          password: regPassword,
          role: regRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      // Step 2: Auto sign-in after registration
      const signInResult = await signIn("credentials", {
        email: regEmail.trim(),
        password: regPassword,
        redirect: false,
      });

      if (signInResult?.error) {
        // Registration succeeded but sign-in failed — tell them to sign in manually
        setActiveTab("signin");
        setSignInEmail(regEmail);
        setError("Account created! Please sign in with your credentials.");
        setLoading(false);
        return;
      }

      // Redirect based on role
      const redirectTo = regRole === "seller" ? "/dashboard/seller" : "/marketplace";
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    setError(null);

    try {
      if (activeTab === "register" && regRole === "seller") {
        // Set cookie for seller intent before Google OAuth
        document.cookie = `intended_role=seller; path=/; max-age=3600; SameSite=Lax`;
        await signIn("google", { callbackUrl: "/api/auth/upgrade-role" });
      } else {
        // Redirect to /auth so the middleware intercepts and routes based on actual role
        await signIn("google", { callbackUrl: "/auth" });
      }
    } catch {
      setError("Google sign-in failed. Please try again.");
      setGoogleLoading(false);
    }
  };

  const GoogleIcon = () => (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
      <path d="M1 1h22v22H1z" fill="none" />
    </svg>
  );

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* ── LEFT: Showcase Panel ── */}
      <div
        className="relative hidden overflow-hidden lg:block"
        style={{ background: "var(--gradient-primary)" }}
      >
        {/* Glow effects */}
        <div
          aria-hidden
          className="absolute -right-32 -top-32 h-[480px] w-[480px] rounded-full bg-white/15 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -left-32 bottom-0 h-[420px] w-[420px] rounded-full bg-black/20 blur-3xl"
        />
        {/* Grid pattern */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse 70% 60% at 50% 40%, black 40%, transparent 75%)",
          }}
        />

        <div className="relative flex h-full flex-col justify-between p-12 text-primary-foreground">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-display text-xl">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/20 backdrop-blur">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="font-semibold tracking-tight">sellgetai</span>
          </Link>

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
                className={`flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur transition-transform duration-500 hover:scale-105 ${
                  i % 2 ? "translate-y-3" : "-translate-y-2"
                }`}
                style={{ animationDelay: `${i * 150}ms` }}
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

          {/* Social proof */}
          <div>
            <h2 className="font-display text-3xl leading-tight sm:text-4xl">
              Join 80,000+ teams deploying AI agents.
            </h2>
            <ul className="mt-6 grid grid-cols-2 gap-2 text-sm">
              {[
                "2,400+ vetted agents",
                "60+ currencies",
                "Deploy in 60s",
                "Cancel anytime",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2 opacity-90">
                  <Check className="h-4 w-4" /> {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Auth Form ── */}
      <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-12">
        {/* Mobile logo */}
        <Link href="/" className="flex items-center gap-2 font-display text-xl lg:hidden">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
            <span className="font-semibold tracking-tight">
            sellget<span className="text-gradient">ai</span>
          </span>
        </Link>

        {/* Desktop: invisible spacer to match mobile logo height */}
        <div className="hidden lg:block" />

        <div className="mx-auto w-full max-w-sm py-8 lg:py-12">
          {/* Tab Toggle */}
          <div className="flex rounded-xl bg-muted/60 p-1">
            <button
              id="auth-tab-signin"
              onClick={() => setActiveTab("signin")}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
                activeTab === "signin"
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              id="auth-tab-register"
              onClick={() => setActiveTab("register")}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
                activeTab === "register"
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ── SIGN IN TAB ── */}
          {activeTab === "signin" && (
            <div className="mt-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h1 className="font-display text-3xl sm:text-4xl">Welcome back.</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Sign in to explore and manage your AI agents.
              </p>

              <form onSubmit={handleSignIn} className="mt-6 space-y-4">
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="Email address"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    required
                    className="h-12 rounded-xl pl-10"
                  />
                </div>

                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="signin-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    required
                    minLength={8}
                    className="h-12 rounded-xl pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <Button
                  id="signin-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-medium transition-all duration-200"
                  size="lg"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      Signing in...
                    </div>
                  ) : (
                    <span className="flex items-center gap-2">
                      Sign In <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-background px-3 text-muted-foreground">or</span>
                </div>
              </div>

              {/* Google OAuth */}
              <Button
                id="signin-google"
                type="button"
                className="w-full rounded-xl bg-white hover:bg-neutral-50 text-neutral-900 border border-neutral-200 shadow-sm h-12 gap-3 font-medium transition-all duration-200"
                size="lg"
                disabled={googleLoading}
                onClick={handleGoogleAuth}
              >
                {googleLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-900 border-t-transparent" />
                ) : (
                  <GoogleIcon />
                )}
                {googleLoading ? "Redirecting..." : "Continue with Google"}
              </Button>
            </div>
          )}

          {/* ── REGISTER TAB ── */}
          {activeTab === "register" && (
            <div className="mt-6 animate-in fade-in slide-in-from-left-4 duration-300">
              <h1 className="font-display text-3xl sm:text-4xl">Create your account.</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Free forever. No credit card required.
              </p>

              {/* Role Selector */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  id="role-buyer"
                  type="button"
                  onClick={() => setRegRole("buyer")}
                  className={`group relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all duration-300 ${
                    regRole === "buyer"
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/30 hover:bg-muted/30"
                  }`}
                >
                  <div
                    className={`grid h-10 w-10 place-items-center rounded-xl transition-all duration-300 ${
                      regRole === "buyer"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                    }`}
                  >
                    <User className="h-5 w-5" />
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-semibold">I want to buy</div>
                    <div className="text-[11px] text-muted-foreground">Explore AI agents</div>
                  </div>
                  {regRole === "buyer" && (
                    <div className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </button>

                <button
                  id="role-seller"
                  type="button"
                  onClick={() => setRegRole("seller")}
                  className={`group relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all duration-300 ${
                    regRole === "seller"
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/30 hover:bg-muted/30"
                  }`}
                >
                  <div
                    className={`grid h-10 w-10 place-items-center rounded-xl transition-all duration-300 ${
                      regRole === "seller"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                    }`}
                  >
                    <Store className="h-5 w-5" />
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-semibold">I want to sell</div>
                    <div className="text-[11px] text-muted-foreground">List your AI agents</div>
                  </div>
                  {regRole === "seller" && (
                    <div className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </button>
              </div>

              <form onSubmit={handleRegister} className="mt-5 space-y-3">
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="register-name"
                    type="text"
                    placeholder="Full name"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                    minLength={2}
                    className="h-12 rounded-xl pl-10"
                  />
                </div>

                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="Email address"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    className="h-12 rounded-xl pl-10"
                  />
                </div>

                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password (min. 8 characters)"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    minLength={8}
                    className="h-12 rounded-xl pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <Button
                  id="register-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-medium transition-all duration-200"
                  size="lg"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      Creating account...
                    </div>
                  ) : (
                    <span className="flex items-center gap-2">
                      Create Account <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-background px-3 text-muted-foreground">or</span>
                </div>
              </div>

              {/* Google OAuth */}
              <Button
                id="register-google"
                type="button"
                className="w-full rounded-xl bg-white hover:bg-neutral-50 text-neutral-900 border border-neutral-200 shadow-sm h-12 gap-3 font-medium transition-all duration-200"
                size="lg"
                disabled={googleLoading}
                onClick={handleGoogleAuth}
              >
                {googleLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-900 border-t-transparent" />
                ) : (
                  <GoogleIcon />
                )}
                {googleLoading ? "Redirecting..." : "Sign up with Google"}
              </Button>

              {regRole === "seller" && (
                <p className="mt-3 text-center text-[11px] text-muted-foreground">
                  Google sign-up will automatically set up your seller account
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} SellGetAI</p>
          <p>
            By continuing you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-2 hover:text-foreground">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function UnifiedAuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AuthContent />
    </Suspense>
  );
}
