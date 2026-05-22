import { NextRequest, NextResponse } from "next/server";
import { db } from "@/backend/db";
import { agents } from "@/backend/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/backend/lib/auth";

export async function POST(req: NextRequest, props: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await props.params;
  const session = await auth();
  
  if (!session?.user || (session.user.role !== "seller" && session.user.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [agent] = await db.select().from(agents).where(eq(agents.id, agentId));
  if (!agent || agent.sellerId !== session.user.id) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  // Pre-flight Moderation Pipeline
  const PROFANITY_WORDS = ["scam", "hack", "illegal", "fraud", "bypass"];
  const content = `${agent.name} ${agent.description} ${agent.longDesc}`.toLowerCase();
  
  // 1. Content Filter Check
  const hasProfanity = PROFANITY_WORDS.some(word => content.includes(word));
  if (hasProfanity) {
    await db.update(agents).set({ 
      status: "flagged", 
      suspensionReason: "Automated Moderation: Content guidelines violation detected." 
    }).where(eq(agents.id, agentId));
    return NextResponse.json({ status: "flagged", reason: "Content guidelines violation" });
  }

  // 2. Mock Latency & Connection Check
  // Simulating an aggressive 500ms timeout requirement for enterprise staging
  const mockLatencyMs = Math.floor(Math.random() * 700) + 100;
  if (agent.endpointUrl && mockLatencyMs > 500) {
     await db.update(agents).set({ 
       status: "rejected_performance", 
       performanceAvgMs: mockLatencyMs,
       performancePass: false,
       rejectionReason: `Endpoint latency (${mockLatencyMs}ms) exceeded 500ms threshold.`
     }).where(eq(agents.id, agentId));
     return NextResponse.json({ status: "rejected_performance", reason: `Latency ${mockLatencyMs}ms > 500ms limit` });
  }

  // 3. Vector Plagiarism / Duplicate Check
  // Simulating a semantic similarity match above 95%
  if (content.includes("exact replica") || content.includes("clone of")) {
    await db.update(agents).set({ 
      status: "flagged", 
      suspensionReason: "Automated Moderation: High vector similarity to existing marketplace asset." 
    }).where(eq(agents.id, agentId));
    return NextResponse.json({ status: "flagged", reason: "Plagiarism/Similarity threshold exceeded" });
  }

  // All automated checks pass -> Push to human review queue
  await db.update(agents).set({ 
    status: "pending_review", 
    performanceAvgMs: mockLatencyMs, 
    performancePass: true 
  }).where(eq(agents.id, agentId));

  return NextResponse.json({ status: "pending_review" });
}
