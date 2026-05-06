import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/backend/lib/auth";
import { db } from "@/backend/db";
import { agents } from "@/backend/db/schema";
import { eq, and } from "drizzle-orm";
import { runPerformanceTest } from "@/features/sellers/services/performanceService";

type Props = { params: Promise<{ id: string }> };

/**
 * POST /api/sellers/agents/[id]/request-review
 * Seller requests re-review after fixing performance issues.
 * Triggers a new performance test.
 */
export async function POST(req: NextRequest, { params }: Props) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    );
  }

  const role = session.user.role;
  if (role !== "seller" && role !== "admin") {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Seller access required" } },
      { status: 403 }
    );
  }

  const { id } = await params;

  // Verify agent belongs to this seller
  const [agent] = await db
    .select()
    .from(agents)
    .where(
      and(
        eq(agents.id, id),
        eq(agents.sellerId, session.user.id)
      )
    )
    .limit(1);

  if (!agent) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Agent not found or not yours" } },
      { status: 404 }
    );
  }

  // Only allow re-review for rejected agents
  if (agent.status !== "rejected_performance" && agent.status !== "rejected_admin") {
    return NextResponse.json(
      { error: { code: "INVALID_STATUS", message: "Agent is not in a rejected state" } },
      { status: 400 }
    );
  }

  if (!agent.embedUrl) {
    return NextResponse.json(
      { error: { code: "NO_EMBED_URL", message: "Agent must have an embed URL" } },
      { status: 400 }
    );
  }

  // Run performance test (async but we await it for the response)
  const result = await runPerformanceTest(agent.id, agent.embedUrl);

  return NextResponse.json({
    success: true,
    performance: {
      avgMs: Math.round(result.avgMs),
      p95Ms: Math.round(result.p95Ms),
      errorRate: result.errorRate.toFixed(1),
      pass: result.pass,
      newStatus: result.pass ? "pending_review" : "rejected_performance",
    },
  });
}
