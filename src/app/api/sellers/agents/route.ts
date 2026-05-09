import { NextResponse } from "next/server";
import { auth } from "@/backend/lib/auth";
import { db } from "@/backend/db";
import { agents } from "@/backend/db/schema";
import { runPerformanceTest } from "@/features/sellers/services/performanceService";

export async function POST(request: Request) {
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
      { error: { code: "FORBIDDEN", message: "Must be a seller to list an agent" } },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { name, tag, category, description, longDesc, monthlyPrice, annualPrice, pricingModel, type, embedUrl, features, useCases } = body;

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

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
        monthlyPricePaise: monthlyPrice ? Number(monthlyPrice) * 100 : null,
        annualPricePaise: annualPrice ? Number(annualPrice) * 100 : null,
        pricingModel: pricingModel || "subscription",
        type: type || "hosted",
        embedUrl,
        assetKey: `agents/${slug}.zip`,
        features: typeof features === "string" ? features.split(",").map((f: string) => f.trim()) : features || [],
        useCases: typeof useCases === "string" ? useCases.split(",").map((u: string) => u.trim()) : useCases || [],
        status: process.env.NODE_ENV === "development" && !embedUrl ? "approved" : "pending",
      })
      .returning();

    // Trigger performance test if embedUrl is provided (non-blocking)
    if (embedUrl) {
      runPerformanceTest(agent.id, embedUrl).catch((err) =>
        console.error("Background performance test failed:", err)
      );
    }

    return NextResponse.json({ success: true, agent });
  } catch (error: any) {
    console.error("Listing error:", error);
    return NextResponse.json(
      { error: { code: "LISTING_ERROR", message: error.message || "Failed to list agent" } },
      { status: 500 }
    );
  }
}
