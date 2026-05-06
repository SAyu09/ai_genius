import { NextResponse } from "next/server";
import { auth } from "@/backend/lib/auth";
import { db } from "@/backend/db";
import { agents, users } from "@/backend/db/schema";
import { eq, sql, or } from "drizzle-orm";

/**
 * GET /api/admin/agents/pending
 * Returns agents awaiting admin review (pending_review status).
 * Admin only.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Admin access required" } },
      { status: 403 }
    );
  }

  const pendingAgents = await db
    .select({
      agent: agents,
      seller: {
        name: users.name,
        email: users.email,
        image: users.image,
      },
    })
    .from(agents)
    .innerJoin(users, eq(agents.sellerId, users.id))
    .where(
      or(
        eq(agents.status, "pending_review"),
        eq(agents.status, "pending"),
        eq(agents.status, "rejected_performance")
      )
    )
    .orderBy(sql`${agents.createdAt} DESC`);

  return NextResponse.json({ agents: pendingAgents });
}
