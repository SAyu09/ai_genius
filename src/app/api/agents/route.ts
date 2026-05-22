import { NextRequest, NextResponse } from "next/server";
import { db } from "@/backend/db";
import { agents } from "@/backend/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@/backend/lib/auth";

/**
 * GET /api/agents
 * Public listing — supports ?q=search&tag=Sales&sort=top&page=1
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const tag = searchParams.get("tag") || "All";
  const sort = searchParams.get("sort") || "top";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = 12;
  const offset = (page - 1) * limit;

  // Build WHERE conditions
  const conditions = [eq(agents.status, "approved")];

  if (tag && tag !== "All") {
    conditions.push(eq(agents.tag, tag));
  }
  if (q) {
    conditions.push(
      sql`(${agents.name} ILIKE ${"%" + q + "%"} OR ${agents.description} ILIKE ${"%" + q + "%"})`
    );
  }

  // Build ORDER BY
  let orderBy;
  switch (sort) {
    case "price-asc":
      orderBy = agents.monthlyPricePaise;
      break;
    case "price-desc":
      orderBy = sql`${agents.monthlyPricePaise} DESC`;
      break;
    case "new":
      orderBy = sql`${agents.createdAt} DESC`;
      break;
    case "top":
    default:
      orderBy = sql`${agents.salesCount} DESC`;
      break;
  }

  const results = await db
    .select()
    .from(agents)
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ agents: results, page, limit });
}

/**
 * POST /api/agents
 * Sellers create a new agent listing (pending admin approval).
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role;
  if (role !== "seller" && role !== "admin") {
    return NextResponse.json(
      { error: "Only sellers can create agents" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { name, tag, category, description, longDesc, monthlyPrice, annualPrice, pricingModel, type, agentType, assetKey, endpointUrl, features, integrations, useCases } = body;

  if (!name || !tag || !description || !longDesc) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // Validate longDesc word count
  const wordCount = longDesc.trim().split(/\s+/).filter((w: string) => w.length > 0).length;
  if (wordCount < 150) {
    return NextResponse.json(
      { error: `Your detailed description must be at least 150 words. You currently have ${wordCount} words.` },
      { status: 400 }
    );
  }

  // Generate slug from name
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const [agent] = await db
    .insert(agents)
    .values({
      sellerId: session.user.id,
      slug,
      name,
      tag,
      category,
      description,
      longDesc,
      monthlyPricePaise: monthlyPrice ? Math.round(monthlyPrice * 100) : null,
      annualPricePaise: annualPrice ? Math.round(annualPrice * 100) : null,
      pricingModel: pricingModel || "subscription",
      type: type || "hosted",
      agentType: agentType || "chat", // Default to chat
      assetKey: assetKey || "",
      endpointUrl,
      status: "draft", // Changed from approved to draft for Staging/Safe zone
      features: features || [],
      integrations: integrations || [],
      useCases: useCases || [],
    })
    .returning();

  return NextResponse.json({ agent }, { status: 201 });
}
