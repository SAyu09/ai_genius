import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { agents } from "@/db/schema";
import { eq, ilike, and, sql } from "drizzle-orm";
import { getUser } from "@/lib/auth";

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
  const conditions = [eq(agents.isApproved, true)];

  if (tag && tag !== "All") {
    conditions.push(eq(agents.tag, tag));
  }
  if (q) {
    conditions.push(
      sql`(${agents.name} ILIKE ${"%" + q + "%"} OR ${agents.desc} ILIKE ${"%" + q + "%"})`
    );
  }

  // Build ORDER BY
  let orderBy;
  switch (sort) {
    case "price-asc":
      orderBy = agents.price;
      break;
    case "price-desc":
      orderBy = sql`${agents.price} DESC`;
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
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = user.user_metadata?.role;
  if (role !== "seller" && role !== "admin") {
    return NextResponse.json(
      { error: "Only sellers can create agents" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { name, tag, desc, long, price, assetKey, features, integrations, useCases } = body;

  if (!name || !tag || !desc || !long || !price || !assetKey) {
    return NextResponse.json(
      { error: "Missing required fields" },
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
      sellerId: user.id,
      slug,
      name,
      tag,
      desc,
      long,
      price: Math.round(price * 100), // Convert dollars to cents
      assetKey,
      features: features || [],
      integrations: integrations || [],
      useCases: useCases || [],
    })
    .returning();

  return NextResponse.json({ agent }, { status: 201 });
}
