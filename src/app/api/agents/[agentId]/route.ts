import { NextRequest, NextResponse } from "next/server";
import { db } from "@/backend/db";
import { agents, users, reviews } from "@/backend/db/schema";
import { eq } from "drizzle-orm";

type Props = { params: Promise<{ agentId: string }> };

/**
 * GET /api/agents/[agentId]
 * Fetch a single agent by ID or slug, including seller info and reviews.
 */
export async function GET(req: NextRequest, { params }: Props) {
  const { agentId } = await params;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(agentId);

  const [agent] = await db
    .select()
    .from(agents)
    .where(isUuid ? eq(agents.id, agentId) : eq(agents.slug, agentId))
    .limit(1);

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  // Fetch seller
  const [seller] = await db
    .select({ name: users.name, image: users.image })
    .from(users)
    .where(eq(users.id, agent.sellerId))
    .limit(1);

  // Fetch reviews
  const agentReviews = await db
    .select({
      stars: reviews.stars,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      buyerName: users.name,
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.buyerId, users.id))
    .where(eq(reviews.agentId, agent.id))
    .orderBy(reviews.createdAt);

  return NextResponse.json({
    agent: {
      ...agent,
      monthlyPrice: (agent.monthlyPricePaise || 0) / 100, // paise → rupees for display
      annualPrice: (agent.annualPricePaise || 0) / 100,
      seller,
      reviews: agentReviews,
    },
  });
}
