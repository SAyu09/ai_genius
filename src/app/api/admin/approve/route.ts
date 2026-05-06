import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/backend/lib/auth";
import { db } from "@/backend/db";
import { agents } from "@/backend/db/schema";
import { eq } from "drizzle-orm";

/**
 * POST /api/admin/approve
 * Approves or rejects an agent.
 * Body: { agentId, approved: boolean, reason?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Admin access required" } },
        { status: 403 }
      );
    }

    const { agentId, approved, reason } = await req.json();
    if (!agentId || typeof approved !== "boolean") {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "agentId and approved (boolean) are required" } },
        { status: 400 }
      );
    }

    // Check agent exists and is in a reviewable state
    const [agent] = await db
      .select()
      .from(agents)
      .where(eq(agents.id, agentId))
      .limit(1);

    if (!agent) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Agent not found" } },
        { status: 404 }
      );
    }

    // Block approval of suspended agents
    if (agent.status === "suspended") {
      return NextResponse.json(
        { error: { code: "AGENT_SUSPENDED", message: "Cannot approve a suspended agent" } },
        { status: 409 }
      );
    }

    if (approved) {
      await db
        .update(agents)
        .set({
          status: "approved",
          isApproved: true,
          approvedAt: new Date(),
          approvedBy: session.user.id,
          rejectionReason: null,
          updatedAt: new Date(),
        })
        .where(eq(agents.id, agentId));
    } else {
      await db
        .update(agents)
        .set({
          status: "rejected_admin",
          isApproved: false,
          rejectionReason: reason || "Rejected by admin",
          updatedAt: new Date(),
        })
        .where(eq(agents.id, agentId));
    }

    return NextResponse.json({ success: true, status: approved ? "approved" : "rejected_admin" });
  } catch (error) {
    console.error("Admin approval error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to process approval" } },
      { status: 500 }
    );
  }
}
