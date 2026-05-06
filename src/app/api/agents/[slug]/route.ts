import { NextRequest, NextResponse } from "next/server";
import { db } from "@/backend/db";
import { agents, users, reviews } from "@/backend/db/schema";
import { eq } from "drizzle-orm";

type Props = { params: Promise<{ slug: string }> };

/**
 * GET /api/agents/[slug]
 * Fetch a single agent by slug, including seller info and reviews.
 */
export async function GET(req: NextRequest, { params }: Props) {
  const { slug } = await params;

  const [agent] = await db
    .select()
    .from(agents)
    .where(eq(agents.slug, slug))
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
      price: agent.price / 100, // cents → dollars for display
      seller,
      reviews: agentReviews,
    },
  });
}
