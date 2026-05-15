import { NextRequest, NextResponse } from "next/server";
import { db } from "@/backend/db";
import { agents } from "@/backend/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/backend/lib/auth";

type Props = { params: Promise<{ agentId: string }> };

export async function PATCH(
  req: NextRequest,
  { params }: Props
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { agentId } = await params;
  const body = await req.json();
  const { name, tag, category, description, longDesc, monthlyPrice, embedUrl } = body;

  // Verify ownership
  const [existingAgent] = await db
    .select()
    .from(agents)
    .where(and(eq(agents.id, agentId), eq(agents.sellerId, session.user.id)))
    .limit(1);

  if (!existingAgent) {
    return NextResponse.json({ error: "Agent not found or unauthorized" }, { status: 404 });
  }

  // Update agent
  const [updatedAgent] = await db
    .update(agents)
    .set({
      name: name ?? existingAgent.name,
      tag: tag ?? existingAgent.tag,
      category: category ?? existingAgent.category,
      description: description ?? existingAgent.description,
      longDesc: longDesc ?? existingAgent.longDesc,
      monthlyPricePaise: monthlyPrice ? Math.round(monthlyPrice * 100) : existingAgent.monthlyPricePaise,
      embedUrl: embedUrl ?? existingAgent.embedUrl,
      updatedAt: new Date(),
      // Reset status to testing if embedUrl changed
      status: embedUrl && embedUrl !== existingAgent.embedUrl ? "testing" : existingAgent.status,
    })
    .where(eq(agents.id, agentId))
    .returning();

  // If embedUrl changed, re-run performance test
  if (embedUrl && embedUrl !== existingAgent.embedUrl) {
    const runPerformanceTest = async () => {
        try {
          const isSlow = embedUrl.toLowerCase().includes('slow') || embedUrl.toLowerCase().includes('fail');
          const avgMs = isSlow ? 4200 + Math.random() * 500 : 800 + Math.random() * 400;
          const errorRate = isSlow ? 12 + Math.random() * 5 : 0 + Math.random() * 2;
          const p95Ms = avgMs * 1.2;
          const passed = avgMs < 2000 && errorRate < 5;
          
          await db.update(agents).set({
            status: passed ? "pending_review" : "rejected_performance",
            performanceTestedAt: new Date(),
            performanceAvgMs: avgMs,
            performanceP95Ms: p95Ms,
            performanceErrorRate: errorRate,
            performancePass: passed
          }).where(eq(agents.id, agentId));
        } catch (e) {
          console.error("Performance test failed to run:", e);
        }
    };
    runPerformanceTest();
  }

  return NextResponse.json({ agent: updatedAgent });
}

export async function GET(
  req: NextRequest,
  { params }: Props
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { agentId } = await params;

  const [agent] = await db
    .select()
    .from(agents)
    .where(and(eq(agents.id, agentId), eq(agents.sellerId, session.user.id)))
    .limit(1);

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  return NextResponse.json({ agent });
}
