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
  const { name, tag, category, description, longDesc, monthlyPrice, annualPrice, pricingModel, type, assetKey, embedUrl, features, integrations, useCases } = body;

  if (!name || !tag || !description || !longDesc || (!assetKey && !embedUrl)) {
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
      assetKey: assetKey || "",
      embedUrl,
      status: "testing", // Set to testing while we simulate performance
      features: features || [],
      integrations: integrations || [],
      useCases: useCases || [],
    })
    .returning();

  // Simulate Performance Test (Background Job)
  // We'll do a simple synchronous simulation for the demo
  const runPerformanceTest = async () => {
    try {
      // Simulate checking the URL
      // If the embed URL contains 'fail' or 'slow', we'll simulate a failure.
      // Otherwise, we simulate a pass with random ms under 2s.
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
      }).where(eq(agents.id, agent.id));
      
      // In a real system, we'd email the seller here
    } catch (e) {
      console.error("Performance test failed to run:", e);
    }
  };

  // Run the test in background (not blocking the response)
  runPerformanceTest();

  return NextResponse.json({ agent }, { status: 201 });
}
