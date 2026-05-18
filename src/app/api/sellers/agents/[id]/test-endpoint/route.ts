import { NextRequest, NextResponse } from "next/server";
import { withSeller } from "@/backend/lib/api";
import { db } from "@/backend/db";
import { agents } from "@/backend/db/schema";
import { eq, and } from "drizzle-orm";
import { decryptData } from "@/backend/lib/crypto";
import { createHmac } from "crypto";

/**
 * POST: Run connection test against seller's endpoint
 * PUT: Save endpoint URL after successful test
 */
export const POST = withSeller(async ({ userId, req }) => {
  const url = new URL(req.url);
  const parts = url.pathname.split("/");
  const agentId = parts[parts.indexOf("agents") + 1];
  const { endpointUrl } = await req.json();

  if (!endpointUrl?.startsWith("https://")) {
    return NextResponse.json({ error: { message: "Endpoint must use HTTPS" } }, { status: 400 });
  }

  // Verify ownership and get SDK secret
  const agent = await db.query.agents.findFirst({
    where: and(eq(agents.id, agentId), eq(agents.sellerId, userId)),
    columns: { id: true, sdkSecretEncrypted: true },
  });
  if (!agent) return NextResponse.json({ error: { message: "Agent not found" } }, { status: 404 });

  if (!agent.sdkSecretEncrypted) {
    return NextResponse.json({ error: { message: "Generate SDK credentials first" } }, { status: 400 });
  }

  const sdkSecret = decryptData(agent.sdkSecretEncrypted);

  // Run 5 pings
  const results = [];
  for (let i = 0; i < 5; i++) {
    const timestamp = String(Date.now());
    const ctx = { userId: "test_user", agentId, plan: "monthly", metadata: {} };
    const payload = Buffer.from(JSON.stringify(ctx)).toString("base64");
    const signature = createHmac("sha256", sdkSecret)
      .update(`${timestamp}.${agentId}.${payload}`)
      .digest("hex");

    const start = Date.now();
    try {
      const res = await fetch(endpointUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-AIGenius-Signature": signature,
          "X-AIGenius-Timestamp": timestamp,
          "X-AIGenius-Payload": payload,
        },
        body: JSON.stringify({ type: "chat", messages: [{ role: "user", content: "ping" }] }),
        signal: AbortSignal.timeout(10_000),
      });

      const isStream = res.headers.get("content-type")?.includes("text/event-stream");
      const isJson = res.headers.get("content-type")?.includes("application/json");
      const valid = res.ok && (isStream || isJson);
      results.push({ ms: Date.now() - start, status: res.status, valid });
    } catch {
      results.push({ ms: 10_000, status: 0, valid: false });
    }

    if (i < 4) await new Promise((r) => setTimeout(r, 1000));
  }

  const avgMs = results.reduce((s, r) => s + r.ms, 0) / results.length;
  const errorRate = results.filter((r) => !r.valid).length / results.length;
  const passed = avgMs < 5000 && errorRate < 0.2;

  // Update agent perf metrics
  await db.update(agents).set({
    performanceAvgMs: Math.round(avgMs),
    performanceErrorRate: errorRate,
    performanceTestedAt: new Date(),
    performancePass: passed,
    status: passed ? "pending_review" : "rejected_performance",
    updatedAt: new Date(),
  }).where(eq(agents.id, agentId));

  return NextResponse.json({ passed, avgMs, errorRate, details: results });
});

export const PUT = withSeller(async ({ userId, req }) => {
  const url = new URL(req.url);
  const parts = url.pathname.split("/");
  const agentId = parts[parts.indexOf("agents") + 1];
  const { endpointUrl } = await req.json();

  const agent = await db.query.agents.findFirst({
    where: and(eq(agents.id, agentId), eq(agents.sellerId, userId)),
    columns: { id: true },
  });
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  await db.update(agents).set({ endpointUrl, updatedAt: new Date() }).where(eq(agents.id, agentId));
  return NextResponse.json({ ok: true });
});
