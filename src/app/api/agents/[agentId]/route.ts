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

/**
 * PATCH /api/agents/[agentId]
 * Update an existing agent listing.
 */
export async function PATCH(req: NextRequest, { params }: Props) {
  const { auth } = await import("@/backend/lib/auth");
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { agentId } = await params;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(agentId);

  // Check ownership
  const [existingAgent] = await db
    .select({ id: agents.id, sellerId: agents.sellerId })
    .from(agents)
    .where(isUuid ? eq(agents.id, agentId) : eq(agents.slug, agentId))
    .limit(1);

  if (!existingAgent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  if (existingAgent.sellerId !== session.user.id && session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: You don't own this agent" }, { status: 403 });
  }

  const body = await req.json();
  const { name, tag, category, description, longDesc, monthlyPrice, annualPrice, pricingModel, type, agentType, assetKey, endpointUrl, features, integrations, useCases } = body;

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (tag !== undefined) updateData.tag = tag;
  if (category !== undefined) updateData.category = category;
  if (description !== undefined) updateData.description = description;
  if (longDesc !== undefined) updateData.longDesc = longDesc;
  if (monthlyPrice !== undefined) updateData.monthlyPricePaise = Math.round(monthlyPrice * 100);
  if (annualPrice !== undefined) updateData.annualPricePaise = Math.round(annualPrice * 100);
  if (pricingModel !== undefined) updateData.pricingModel = pricingModel;
  if (type !== undefined) updateData.type = type;
  if (agentType !== undefined) updateData.agentType = agentType;
  if (assetKey !== undefined) updateData.assetKey = assetKey;
  if (endpointUrl !== undefined) updateData.endpointUrl = endpointUrl;
  if (features !== undefined) updateData.features = features;
  if (integrations !== undefined) updateData.integrations = integrations;
  if (useCases !== undefined) updateData.useCases = useCases;

  // Validate longDesc word count if it's being updated
  if (updateData.longDesc) {
    const wordCount = updateData.longDesc.trim().split(/\s+/).filter((w: string) => w.length > 0).length;
    if (wordCount < 150) {
      return NextResponse.json(
        { error: `Your detailed description must be at least 150 words. You currently have ${wordCount} words.` },
        { status: 400 }
      );
    }
  }

  const [updatedAgent] = await db
    .update(agents)
    .set({ ...updateData, updatedAt: new Date() })
    .where(eq(agents.id, existingAgent.id))
    .returning();

  return NextResponse.json({ agent: updatedAgent }, { status: 200 });
}
