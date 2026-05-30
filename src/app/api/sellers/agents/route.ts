import { NextResponse } from "next/server";
import { withSeller } from "@/backend/lib/api";
import { db } from "@/backend/db";
import { agents } from "@/backend/db/schema";
import { runPerformanceTest } from "@/features/sellers/services/performanceService";
import { agentCreateSchema, isValidPublicUrl } from "@/backend/lib/validation";

export const POST = withSeller(async ({ userId, req }) => {
  try {
    const body = await req.json();

    // Map embedUrl to endpointUrl to match the schema
    if (body.embedUrl && !body.endpointUrl) {
      body.endpointUrl = body.embedUrl;
    }

    const parsed = agentCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid input", details: parsed.error.issues } },
        { status: 400 }
      );
    }

    const {
      name, tag, category, description, longDesc, monthlyPrice, annualPrice,
      pricingModel, type, endpointUrl, features, useCases
    } = parsed.data;

    // Strict URL Validation for SSRF protection
    if (endpointUrl) {
      const urlCheck = isValidPublicUrl(endpointUrl);
      if (!urlCheck.valid) {
        return NextResponse.json(
          { error: { code: "INVALID_URL", message: urlCheck.reason } },
          { status: 400 }
        );
      }
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const [agent] = await db
      .insert(agents)
      .values({
        sellerId: userId,
        slug,
        name,
        tag,
        category,
        description,
        longDesc,
        monthlyPriceCents: monthlyPrice ? Number(monthlyPrice) * 100 : 0,
        annualPriceCents: annualPrice ? Number(annualPrice) * 100 : 0,
        pricingModel,
        type,
        embedUrl: endpointUrl,
        assetKey: `agents/${slug}.zip`,
        features,
        useCases,
        status: process.env.NODE_ENV === "development" && !endpointUrl ? "approved" : "pending",
      })
      .returning();

    // Trigger performance test if embedUrl is provided (non-blocking)
    if (endpointUrl) {
      runPerformanceTest(agent.id, endpointUrl).catch((err) =>
        console.error("Background performance test failed:", err)
      );
    }

    return NextResponse.json({ success: true, agent });
  } catch (error: any) {
    console.error("Listing error:", error);
    return NextResponse.json(
      { error: { code: "LISTING_ERROR", message: "Failed to list agent" } },
      { status: 500 }
    );
  }
});
