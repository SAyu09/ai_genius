import { db } from "@/backend/db";
import { agents } from "@/backend/db/schema";
import { eq } from "drizzle-orm";

interface PerfResult {
  avgMs: number;
  p95Ms: number;
  errorRate: number;
  pass: boolean;
  details: { status: number; latencyMs: number }[];
}

/**
 * Runs a performance test against a seller's embed URL.
 * Sends 10 HTTP HEAD requests with 3s spacing.
 * Pass criteria: avgMs < 2000 AND errorRate < 5%
 */
export async function runPerformanceTest(
  agentId: string,
  embedUrl: string
): Promise<PerfResult> {
  const PINGS = 10;
  const SPACING_MS = 3000;
  const results: { status: number; latencyMs: number }[] = [];

  // Mark agent as testing
  await db
    .update(agents)
    .set({ status: "testing", updatedAt: new Date() })
    .where(eq(agents.id, agentId));

  for (let i = 0; i < PINGS; i++) {
    const start = Date.now();
    try {
      const response = await fetch(embedUrl, {
        method: "HEAD",
        signal: AbortSignal.timeout(10000), // 10s timeout
      });
      results.push({
        status: response.status,
        latencyMs: Date.now() - start,
      });
    } catch {
      results.push({
        status: 0, // network error
        latencyMs: Date.now() - start,
      });
    }

    // Wait between pings (except last)
    if (i < PINGS - 1) {
      await new Promise((resolve) => setTimeout(resolve, SPACING_MS));
    }
  }

  // Calculate metrics
  const latencies = results.map((r) => r.latencyMs);
  const errors = results.filter((r) => r.status === 0 || r.status >= 500);

  const avgMs = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const sorted = [...latencies].sort((a, b) => a - b);
  const p95Index = Math.ceil(0.95 * sorted.length) - 1;
  const p95Ms = sorted[p95Index];
  const errorRate = (errors.length / results.length) * 100;

  // Pass: avg < 2000ms AND error < 5%
  const pass = avgMs < 2000 && errorRate < 5;

  // Store results
  const newStatus = pass ? "pending_review" : "rejected_performance";
  await db
    .update(agents)
    .set({
      status: newStatus,
      performanceAvgMs: avgMs,
      performanceP95Ms: p95Ms,
      performanceErrorRate: errorRate,
      performanceTestedAt: new Date(),
      performancePass: pass,
      updatedAt: new Date(),
    })
    .where(eq(agents.id, agentId));

  return { avgMs, p95Ms, errorRate, pass, details: results };
}
