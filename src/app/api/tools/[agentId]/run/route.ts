import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/backend/lib/api";
import { getActiveSubscription } from "@/backend/lib/subscriptions";
import { db } from "@/backend/db";
import { agents } from "@/backend/db/schema";
import { eq, and } from "drizzle-orm";
import { decryptData } from "@/backend/lib/crypto";
import { createHmac } from "crypto";
import { isValidPublicUrl } from "@/backend/lib/validation";

/**
 * POST /api/tools/[agentId]/run
 *
 * The ONLY communication channel to seller's backend.
 * Buyer's browser calls this route → platform signs request → forwards to seller SDK.
 * Buyer NEVER contacts seller directly.
 */
export const POST = withAuth(async ({ userId, req }) => {
  // Extract agentId from URL path
  const url = new URL(req.url);
  const pathParts = url.pathname.split("/");
  const agentIdIndex = pathParts.indexOf("tools") + 1;
  const agentId = pathParts[agentIdIndex];

  if (!agentId) {
    return NextResponse.json(
      { type: "error", error: { code: "BAD_REQUEST", message: "Missing agentId" } },
      { status: 400 }
    );
  }

  // 1. Get seller's endpoint + SDK secret (Single Query)
  const agent = await db.query.agents.findFirst({
    where: and(eq(agents.id, agentId), eq(agents.status, "approved")),
    columns: {
      endpointUrl: true,
      sdkSecretEncrypted: true,
      sellerId: true,
      agentType: true,
    },
  });

  if (!agent?.endpointUrl || !agent?.sdkSecretEncrypted) {
    return NextResponse.json(
      { type: "error", error: { code: "AGENT_UNAVAILABLE", message: "Agent endpoint not configured" } },
      { status: 503 }
    );
  }

  // SSRF check on the resolved endpoint
  if (!isValidPublicUrl(agent.endpointUrl).valid) {
    return NextResponse.json(
      { type: "error", error: { code: "INVALID_ENDPOINT", message: "Agent endpoint is not a valid public URL" } },
      { status: 400 }
    );
  }

  // 2. Verify subscription (cached — no DB hit if warm)
  const { active, planType } = await getActiveSubscription(userId, agentId);

  // Allow access if active subscription OR if user is the seller
  if (!active && agent.sellerId !== userId) {
    return NextResponse.json(
      { type: "error", error: { code: "NO_SUBSCRIPTION", message: "No active subscription" } },
      { status: 403 }
    );
  }

  // Decrypt SDK secret
  let sdkSecret: string;
  try {
    sdkSecret = decryptData(agent.sdkSecretEncrypted);
  } catch {
    return NextResponse.json(
      { type: "error", error: { code: "INTERNAL", message: "Failed to load agent credentials" } },
      { status: 500 }
    );
  }

  const body = await req.json();

  // 3. Build signed payload — seller SDK will verify this
  const timestamp = String(Date.now());
  const context = {
    userId,
    agentId,
    plan: planType || "monthly",
    metadata: {},
  };
  const payload = Buffer.from(JSON.stringify(context)).toString("base64");
  const signature = createHmac("sha256", sdkSecret)
    .update(`${timestamp}.${agentId}.${payload}`)
    .digest("hex");

  // 4. Forward to seller's SDK endpoint via Cloudflare Worker (if configured)
  //    or directly to seller endpoint (for development / when worker is not deployed)
  const workerUrl = process.env.AGENT_PROXY_WORKER_URL;
  const targetUrl = workerUrl
    ? `${workerUrl}/${agentId}`
    : agent.endpointUrl;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-AIGenius-Signature": signature,
    "X-AIGenius-Timestamp": timestamp,
    "X-AIGenius-Payload": payload,
  };

  // Add platform-to-worker auth header when proxying through worker
  if (workerUrl) {
    headers["X-Forward-To"] = agent.endpointUrl;
    headers["X-Platform-Worker-Secret"] = process.env.PLATFORM_WORKER_SECRET || "";
  }

  let sellerResponse: Response;
  try {
    sellerResponse = await fetch(targetUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    return NextResponse.json(
      { type: "error", error: { code: "TIMEOUT", message: "Agent took too long to respond." } },
      { status: 504 }
    );
  }

  // 5. Handle streaming (chat) vs JSON (form/workflow)
  const contentType = sellerResponse.headers.get("content-type") || "";

  if (contentType.includes("text/event-stream")) {
    // Pass SSE stream directly back to browser
    return new NextResponse(sellerResponse.body, {
      status: sellerResponse.status,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  // Non-streaming: parse and return JSON
  try {
    const result = await sellerResponse.json();
    return NextResponse.json(result, { status: sellerResponse.status });
  } catch {
    return NextResponse.json(
      { type: "error", error: { code: "INVALID_RESPONSE", message: "Agent returned invalid response" } },
      { status: 502 }
    );
  }
});
