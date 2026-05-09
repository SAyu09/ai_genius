import { auth } from "@/backend/lib/auth";
import { NextResponse } from "next/server";
import type { UserRole } from "@/types/auth.types";

const PROTECTED_PATHS = [
  "/dashboard",
  "/tools",
  "/billing",
  "/settings",
  "/admin",
  "/marketplace/my-agents",
  "/marketplace/billing",
  "/api/checkout",
  "/api/upload",
  "/api/sellers",
  "/api/purchases",
  "/api/subscriptions",
  "/api/tools",
];

const AUTH_ROUTES = ["/auth", "/sign-in", "/sign-up"];

const SELLER_ROUTES = ["/dashboard/seller", "/dashboard/list-agent"];

const ADMIN_ROUTES = ["/admin"];

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_ROUTES.includes(pathname);
  const role = (req.auth?.user?.role as UserRole) || null;

  // 1. Redirect old auth routes to unified /auth page
  if (pathname === "/sign-in") {
    return NextResponse.redirect(new URL("/auth", req.url));
  }
  if (pathname === "/sign-up") {
    return NextResponse.redirect(new URL("/auth?tab=register", req.url));
  }

  // 2. Protected routes — redirect unauthenticated to /auth
  if (isProtected && !isLoggedIn) {
    const authUrl = new URL("/auth", req.url);
    authUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(authUrl);
  }

  // 3. Auth routes — redirect authenticated users to their respective destination
  if (isAuthRoute && isLoggedIn) {
    if (role === "admin") return NextResponse.redirect(new URL("/admin", req.url));
    if (role === "seller") return NextResponse.redirect(new URL("/dashboard/seller", req.url));
    return NextResponse.redirect(new URL("/marketplace", req.url));
  }

  // 4. Role-based dashboard redirects
  if (isLoggedIn) {
    // Buyer visiting /dashboard → redirect to /marketplace/my-agents
    if (pathname === "/dashboard" && role === "buyer") {
      return NextResponse.redirect(new URL("/marketplace/my-agents", req.url));
    }

    // Anyone visiting /billing → redirect to /marketplace/billing
    if (pathname === "/billing") {
      return NextResponse.redirect(new URL("/marketplace/billing", req.url));
    }

    // Seller visiting /dashboard (exact, not /dashboard/seller) → redirect to seller dashboard
    if (pathname === "/dashboard" && role === "seller") {
      return NextResponse.redirect(new URL("/dashboard/seller", req.url));
    }
  }

  // 5. Seller routes — redirect non-sellers to marketplace
  if (SELLER_ROUTES.some((r) => pathname.startsWith(r)) && role !== "seller" && role !== "admin") {
    return NextResponse.redirect(new URL("/marketplace", req.url));
  }

  // 6. Admin routes — strict role check
  if (ADMIN_ROUTES.some((r) => pathname.startsWith(r)) && role !== "admin") {
    return NextResponse.redirect(new URL("/marketplace", req.url));
  }

  // 7. Subscription check for /tools/[agentId] happens at page level, not middleware

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api/auth|api/webhooks|api/agents|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
