import { NextRequest, NextResponse } from "next/server";
import { withSeller } from "@/backend/lib/api";
import { db } from "@/backend/db";
import { agents } from "@/backend/db/schema";
import { eq, and } from "drizzle-orm";

export const POST = withSeller(async ({ userId, req }) => {
  const url = new URL(req.url);
  const parts = url.pathname.split("/");
  const agentId = parts[parts.indexOf("agents") + 1];

  // Verify ownership
  const agent = await db.query.agents.findFirst({
    where: and(eq(agents.id, agentId), eq(agents.sellerId, userId)),
    columns: { id: true, type: true, endpointUrl: true, assetKey: true },
  });

  if (!agent) {
    return NextResponse.json({ error: { message: "Agent not found" } }, { status: 404 });
  }

  // Validate that the agent has the necessary components to be published
  if (agent.type === "hosted" && !agent.endpointUrl) {
    return NextResponse.json({ error: { message: "API agents must have an endpoint URL configured." } }, { status: 400 });
  }

  if (agent.type === "workflow" && !agent.assetKey) {
    return NextResponse.json({ error: { message: "n8n agents must have a workflow file uploaded." } }, { status: 400 });
  }

  // Auto-approve and publish directly to marketplace
  await db.update(agents).set({
    status: "approved",
    isApproved: true,
    updatedAt: new Date(),
  }).where(eq(agents.id, agentId));

  return NextResponse.json({ success: true, status: "approved" });
});
