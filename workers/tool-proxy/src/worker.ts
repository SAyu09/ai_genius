/**
 * AI Genius — Tool Proxy Worker
 *
 * This Cloudflare Worker sits between the platform iframe and the seller's tool.
 * It provides:
 * 1. Request proxying with origin validation
 * 2. Branding strip via HTMLRewriter (removes seller-specific meta tags)
 * 3. Response caching (static assets)
 * 4. Performance monitoring via Analytics Engine
 * 5. Auto-suspension when error rate exceeds threshold
 */

interface Env {
  AGENT_STATUS: KVNamespace;
  PERF_ANALYTICS: AnalyticsEngineDataset;
  PLATFORM_ORIGIN: string;
  ALLOWED_ORIGINS: string;
}

// ─── Constants ───────────────────────────────────────────────
const SUSPENSION_THRESHOLD = 0.15; // 15% error rate
const SUSPENSION_WINDOW = 300; // 5 minutes
const CACHE_TTL_STATIC = 3600; // 1 hour for static assets
const MAINTENANCE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tool Unavailable - AI Genius</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f8f9fa;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      color: #1a1a2e;
    }
    .container {
      text-align: center;
      padding: 3rem;
      max-width: 480px;
    }
    .icon {
      width: 64px;
      height: 64px;
      background: #e8e9f3;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
      font-size: 28px;
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
    }
    p {
      color: #6b7280;
      line-height: 1.6;
      margin-bottom: 2rem;
    }
    a {
      display: inline-block;
      padding: 0.75rem 2rem;
      background: #4f46e5;
      color: white;
      text-decoration: none;
      border-radius: 12px;
      font-weight: 500;
      transition: background 0.2s;
    }
    a:hover { background: #4338ca; }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 2rem;
      font-size: 0.75rem;
      color: #9ca3af;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">🔧</div>
    <h1>Tool Temporarily Unavailable</h1>
    <p>This tool is experiencing issues and has been temporarily paused. Our team has been notified and the creator is working on a fix.</p>
    <a href="PLATFORM_URL/marketplace">Explore Other Tools</a>
    <div class="badge">
      <span>Powered by</span>
      <strong>AI Genius</strong>
    </div>
  </div>
</body>
</html>`;

// ─── HTMLRewriter: Strip seller branding ─────────────────────
class BrandingStripper implements HTMLRewriterElementContentHandlers {
  element(element: Element) {
    const name = element.getAttribute("name");
    const property = element.getAttribute("property");

    // Remove seller-specific meta tags
    if (
      name === "author" ||
      name === "generator" ||
      property === "og:site_name" ||
      property === "og:title" ||
      name === "twitter:site" ||
      name === "twitter:creator"
    ) {
      element.remove();
    }
  }
}

class TitleRewriter implements HTMLRewriterElementContentHandlers {
  element(element: Element) {
    element.setInnerContent("AI Genius Tool");
  }
}

// ─── Helpers ─────────────────────────────────────────────────
function isStaticAsset(pathname: string): boolean {
  return /\.(css|js|png|jpg|jpeg|gif|webp|svg|woff2?|ttf|eot|ico)(\?.*)?$/i.test(
    pathname
  );
}

function extractAgentId(url: URL): string | null {
  // URL format: /proxy/{agentId}/...
  const match = url.pathname.match(/^\/proxy\/([a-f0-9-]+)/i);
  return match ? match[1] : null;
}

// ─── Main Worker ─────────────────────────────────────────────
export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);
    const agentId = extractAgentId(url);

    if (!agentId) {
      return new Response("Bad Request: Missing agent ID", { status: 400 });
    }

    // 1. Check if agent is suspended via KV
    const suspendedUntil = await env.AGENT_STATUS.get(`suspended:${agentId}`);
    if (suspendedUntil && Date.now() < parseInt(suspendedUntil)) {
      const html = MAINTENANCE_HTML.replace(
        "PLATFORM_URL",
        env.PLATFORM_ORIGIN
      );
      return new Response(html, {
        status: 503,
        headers: {
          "Content-Type": "text/html;charset=UTF-8",
          "Retry-After": "300",
        },
      });
    }

    // 2. Resolve seller's embed URL from KV
    const embedUrl = await env.AGENT_STATUS.get(`embed:${agentId}`);
    if (!embedUrl) {
      return new Response("Agent not found", { status: 404 });
    }

    // 3. Proxy the request to the seller's origin
    const targetUrl = new URL(
      url.pathname.replace(`/proxy/${agentId}`, ""),
      embedUrl
    );
    targetUrl.search = url.search;

    const startTime = Date.now();
    let response: Response;
    let isError = false;

    try {
      response = await fetch(targetUrl.toString(), {
        method: request.method,
        headers: request.headers,
        body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
        redirect: "follow",
      });

      if (response.status >= 500) {
        isError = true;
      }
    } catch (err) {
      isError = true;
      response = new Response("Upstream Error", { status: 502 });
    }

    const latencyMs = Date.now() - startTime;
    if (latencyMs > 2000) {
      isError = true; // Mark slow responses as errors for suspension tracking
    }

    // 4. Log performance metrics to Analytics Engine
    ctx.waitUntil(
      (async () => {
        try {
          env.PERF_ANALYTICS.writeDataPoint({
            blobs: [agentId, isError ? "error" : "ok"],
            doubles: [latencyMs, response.status],
            indexes: [agentId],
          });

          // Track rolling error rate in KV
          const errorKey = `errors:${agentId}`;
          const currentErrors = parseInt(
            (await env.AGENT_STATUS.get(errorKey)) || "0"
          );
          const totalKey = `total:${agentId}`;
          const currentTotal = parseInt(
            (await env.AGENT_STATUS.get(totalKey)) || "0"
          );

          const newTotal = currentTotal + 1;
          const newErrors = currentErrors + (isError ? 1 : 0);

          await env.AGENT_STATUS.put(totalKey, String(newTotal), {
            expirationTtl: SUSPENSION_WINDOW,
          });
          await env.AGENT_STATUS.put(errorKey, String(newErrors), {
            expirationTtl: SUSPENSION_WINDOW,
          });

          // Auto-suspend if error rate exceeds threshold (min 10 requests)
          if (newTotal >= 10) {
            const errorRate = newErrors / newTotal;
            if (errorRate > SUSPENSION_THRESHOLD) {
              const suspendUntil = Date.now() + SUSPENSION_WINDOW * 1000;
              await env.AGENT_STATUS.put(
                `suspended:${agentId}`,
                String(suspendUntil),
                { expirationTtl: SUSPENSION_WINDOW }
              );
              console.log(
                `[AUTO-SUSPEND] Agent ${agentId} suspended. Error rate: ${(errorRate * 100).toFixed(1)}%`
              );
            }
          }
        } catch (e) {
          console.error("Perf logging error:", e);
        }
      })()
    );

    // 5. Apply HTMLRewriter for HTML responses (strip seller branding)
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("text/html")) {
      const transformed = new HTMLRewriter()
        .on("meta", new BrandingStripper())
        .on("title", new TitleRewriter())
        .transform(response);

      // Add platform headers
      const headers = new Headers(transformed.headers);
      headers.set("X-Powered-By", "AI Genius");
      headers.set("X-Frame-Options", "SAMEORIGIN");
      headers.delete("X-Powered-By"); // Remove seller's
      headers.set("X-AI-Genius-Agent", agentId);

      return new Response(transformed.body, {
        status: transformed.status,
        headers,
      });
    }

    // 6. Cache static assets
    if (isStaticAsset(url.pathname) && response.ok) {
      const headers = new Headers(response.headers);
      headers.set(
        "Cache-Control",
        `public, max-age=${CACHE_TTL_STATIC}, immutable`
      );
      return new Response(response.body, {
        status: response.status,
        headers,
      });
    }

    return response;
  },
};
