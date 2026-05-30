import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/backend/lib/auth";
import { db } from "@/backend/db";
import { users } from "@/backend/db/schema";
import { eq } from "drizzle-orm";
import { checkRateLimit, RATE_LIMIT_API } from "./rateLimit";
import { isValidOrigin } from "./validation";

type AuthContext = { userId: string; role: string; req: NextRequest };
type Handler<T = AuthContext> = (ctx: T) => Promise<NextResponse> | NextResponse;

// Wraps any route — validates session, injects userId + role
export function withAuth(handler: Handler) {
  return async (req: NextRequest) => {
    // CSRF Protection for state-mutating requests
    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      if (!isValidOrigin(req)) {
        return NextResponse.json({ error: "Invalid Origin / CSRF Check Failed" }, { status: 403 });
      }
    }

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting
    const rl = await checkRateLimit(`api_user:${session.user.id}`, RATE_LIMIT_API);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests" }, 
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetAt - Date.now() / 1000)) } }
      );
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 }); 
    }

    return handler({ userId: user.id, role: user.role, req });
  };
}

// Adds seller check on top of withAuth
export function withSeller(handler: Handler) {
  return withAuth(async (ctx) => {
    if (ctx.role !== "seller" && ctx.role !== "admin") {
      return NextResponse.json({ error: "Seller access required" }, { status: 403 });
    }
    return handler(ctx);
  });
}

// Adds admin check on top of withAuth
export function withAdmin(handler: Handler) {
  return withAuth(async (ctx) => {
    if (ctx.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    return handler(ctx);
  });
}
