/**
 * AI Genius Agent Proxy Worker — v4 SDK Architecture
 *
 * Role: Authenticate platform requests, rate-limit per user, check agent
 * suspension, and forward signed requests to seller SDK endpoints.
 *
 * This worker NEVER serves HTML. It is a pure request proxy.
 * Buyer browsers never call this worker directly — only the platform API route does.
 */

interface Env {
  PLATFORM_WORKER_SECRET: string;
  AGENT_STATUS: KVNamespace;
  RATE_LIMIT: KVNamespace;
  PERF_ANALYTICS: AnalyticsEngineDataset;
}

interface AgentContext {
  userId: string;
  agentId: string;
  plan: string;
  metadata: Record<string, string>;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Only POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const url = new URL(request.url);
    const agentId = url.pathname.split('/').pop() ?? '';
    const forwardTo = request.headers.get('X-Forward-To');

    if (!forwardTo) {
      return Response.json(
        { type: 'error', error: { code: 'BAD_REQUEST', message: 'Missing forward target' } },
        { status: 400 }
      );
    }

    // ── 1. Verify request came from OUR platform ──────────────────────
    const platformSig = request.headers.get('X-Platform-Worker-Secret');
    if (platformSig !== env.PLATFORM_WORKER_SECRET) {
      return new Response('Unauthorized', { status: 401 });
    }

    // ── 2. Agent suspension check (KV — O(1)) ────────────────────────
    const isSuspended = await env.AGENT_STATUS.get(`agent:${agentId}:suspended`);
    if (isSuspended) {
      return Response.json(
        { type: 'error', error: { code: 'SUSPENDED', message: 'This agent is temporarily unavailable.' } },
        { status: 503 }
      );
    }

    // ── 3. Rate limit per userId per agentId (60 req/min) ────────────
    let userId = 'unknown';
    try {
      const payload = request.headers.get('X-AIGenius-Payload') ?? '';
      const decoded = JSON.parse(atob(payload)) as AgentContext;
      userId = decoded.userId;
    } catch {
      // If we can't decode, proceed without rate limiting
    }

    const rateLimitKey = `ratelimit:${userId}:${agentId}`;
    const currentRequests = parseInt(await env.RATE_LIMIT.get(rateLimitKey) ?? '0');

    if (currentRequests >= 60) {
      return Response.json(
        { type: 'error', error: { code: 'RATE_LIMITED', message: 'Too many requests. Slow down.' } },
        { status: 429 }
      );
    }

    // Increment rate limit counter (fire and forget)
    ctx.waitUntil(
      env.RATE_LIMIT.put(rateLimitKey, String(currentRequests + 1), { expirationTtl: 60 })
    );

    // ── 4. Build clean forwarded request ─────────────────────────────
    const forwardHeaders = new Headers(request.headers);
    forwardHeaders.delete('X-Forward-To');
    forwardHeaders.delete('X-Platform-Worker-Secret');

    // ── 5. Forward to seller's SDK endpoint ──────────────────────────
    const startTime = Date.now();
    let sellerResponse: Response;

    try {
      sellerResponse = await fetch(forwardTo, {
        method: 'POST',
        headers: forwardHeaders,
        body: request.body,
        signal: AbortSignal.timeout(30_000),
      });
    } catch {
      const elapsed = Date.now() - startTime;
      // Log timeout
      ctx.waitUntil(
        env.PERF_ANALYTICS.writeDataPoint({
          indexes: [agentId],
          doubles: [elapsed],
          blobs: ['timeout', userId],
        })
      );
      return Response.json(
        { type: 'error', error: { code: 'TIMEOUT', message: 'Agent took too long to respond.' } },
        { status: 504 }
      );
    }

    // ── 6. Log performance ───────────────────────────────────────────
    const elapsed = Date.now() - startTime;
    ctx.waitUntil(
      env.PERF_ANALYTICS.writeDataPoint({
        indexes: [agentId],
        doubles: [elapsed],
        blobs: [String(sellerResponse.status), userId],
      })
    );

    // ── 7. Return seller response ────────────────────────────────────
    // Pass through SSE streams and JSON responses directly
    return new Response(sellerResponse.body, {
      status: sellerResponse.status,
      headers: sellerResponse.headers,
    });
  },
};
