import { auth } from "@/backend/lib/auth";
import { NextResponse } from "next/server";
import type { UserRole } from "@/types/auth.types";

const PROTECTED_PATHS = [
  "/dashboard",
  "/tools",
  "/billing",
  "/settings",
  "/admin",
  "/api/checkout",
  "/api/upload",
  "/api/sellers",
  "/api/purchases",
  "/api/subscriptions",
  "/api/tools",
];

const AUTH_ROUTES = ["/sign-in", "/sign-up"];

const SELLER_ROUTES = ["/dashboard/seller", "/dashboard/list-agent"];

const ADMIN_ROUTES = ["/admin"];

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_ROUTES.includes(pathname);
  const role = (req.auth?.user?.role as UserRole) || null;

  // 1. Protected routes — redirect unauthenticated to sign-in
  if (isProtected && !isLoggedIn) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // 2. Auth routes — redirect authenticated users to dashboard
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 3. Seller routes — redirect non-sellers to buyer dashboard
  if (SELLER_ROUTES.some((r) => pathname.startsWith(r)) && role !== "seller" && role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 4. Admin routes — strict role check
  if (ADMIN_ROUTES.some((r) => pathname.startsWith(r)) && role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 5. Subscription check for /tools/[agentId] happens at page level, not middleware

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api/auth|api/webhooks|api/agents|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
