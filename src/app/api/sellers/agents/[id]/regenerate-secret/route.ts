import { NextRequest, NextResponse } from "next/server";
import { withSeller } from "@/backend/lib/api";
import { db } from "@/backend/db";
import { agents } from "@/backend/db/schema";
import { eq, and } from "drizzle-orm";
import { encryptData, decryptData } from "@/backend/lib/crypto";
import { createHmac, randomBytes } from "crypto";

// POST: Regenerate SDK secret  |  GET: Reveal existing secret
export const POST = withSeller(async ({ userId, req }) => {
  const url = new URL(req.url);
  const parts = url.pathname.split("/");
  const agentId = parts[parts.indexOf("agents") + 1];

  // Verify ownership
  const agent = await db.query.agents.findFirst({
    where: and(eq(agents.id, agentId), eq(agents.sellerId, userId)),
    columns: { id: true },
  });
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  // Generate new secret
  const rawSecret = `sk_live_${randomBytes(32).toString("hex")}`;
  const encrypted = encryptData(rawSecret);

  await db.update(agents)
    .set({ sdkSecretEncrypted: encrypted, sdkVersion: "1.0.0", updatedAt: new Date() })
    .where(eq(agents.id, agentId));

  return NextResponse.json({ secret: rawSecret });
});

export const GET = withSeller(async ({ userId, req }) => {
  const url = new URL(req.url);
  const parts = url.pathname.split("/");
  const agentId = parts[parts.indexOf("agents") + 1];

  const agent = await db.query.agents.findFirst({
    where: and(eq(agents.id, agentId), eq(agents.sellerId, userId)),
    columns: { sdkSecretEncrypted: true },
  });
  if (!agent || !agent.sdkSecretEncrypted) {
    return NextResponse.json({ error: "No secret found" }, { status: 404 });
  }

  const secret = decryptData(agent.sdkSecretEncrypted);
  return NextResponse.json({ secret });
});
