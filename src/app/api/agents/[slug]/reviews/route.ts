import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/db";
import { reviews, agents, purchases } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

type Props = { params: Promise<{ slug: string }> };

/**
 * POST /api/agents/[slug]/reviews
 * Submit a review. Only buyers who purchased the agent can review.
 */
export async function POST(req: NextRequest, { params }: Props) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const { stars, comment } = await req.json();

  if (!stars || stars < 1 || stars > 5) {
    return NextResponse.json(
      { error: "Stars must be between 1 and 5" },
      { status: 400 }
    );
  }

  // Fetch agent
  const [agent] = await db
    .select()
    .from(agents)
    .where(eq(agents.slug, slug))
    .limit(1);

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  // Verify purchase
  const [purchase] = await db
    .select()
    .from(purchases)
    .where(
      and(
        eq(purchases.buyerId, user.id),
        eq(purchases.agentId, agent.id)
      )
    )
    .limit(1);

  if (!purchase) {
    return NextResponse.json(
      { error: "You must purchase this agent before reviewing" },
      { status: 403 }
    );
  }

  // Check if already reviewed
  const [existing] = await db
    .select()
    .from(reviews)
    .where(
      and(
        eq(reviews.buyerId, user.id),
        eq(reviews.agentId, agent.id)
      )
    )
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { error: "You have already reviewed this agent" },
      { status: 409 }
    );
  }

  // Insert review
  const [review] = await db
    .insert(reviews)
    .values({
      buyerId: user.id,
      agentId: agent.id,
      stars,
      comment: comment || null,
    })
    .returning();

  // Update agent aggregate stats
  await db
    .update(agents)
    .set({
      rating: sql`${agents.rating} + ${stars}`,
      reviewCount: sql`${agents.reviewCount} + 1`,
    })
    .where(eq(agents.id, agent.id));

  return NextResponse.json({ review }, { status: 201 });
}
