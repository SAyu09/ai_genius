import Link from "next/link";
import { Header } from "@/frontend/components/site/Header";
import { Footer } from "@/frontend/components/site/Footer";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Star, Zap, Search, ShieldCheck, Activity } from "lucide-react";
import { db } from "@/backend/db";
import { agents, users } from "@/backend/db/schema";
import { eq, ilike, and, sql } from "drizzle-orm";

export default async function MarketplacePage(props: { searchParams: Promise<{ q?: string; cat?: string; sort?: string }> }) {
  const searchParams = await props.searchParams;
  const q = searchParams.q || "";
  const cat = searchParams.cat || "All";
  const sort = searchParams.sort || "top";

  // Build WHERE conditions
  const conditions = [eq(agents.status, "approved")];

  if (cat && cat !== "All") {
    conditions.push(eq(agents.category, cat));
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

  const allAgents = await db
    .select({ agent: agents, seller: users })
    .from(agents)
    .innerJoin(users, eq(agents.sellerId, users.id))
    .where(and(...conditions))
    .orderBy(orderBy);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-12">
        <div className="mx-auto w-[min(1200px,92%)]">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-widest text-emerald-600 font-semibold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Enterprise App Store
            </p>
            <h1 className="mt-3 font-display text-5xl sm:text-6xl font-bold leading-tight">Discover verified AI agents.</h1>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              Every agent is 100% Sandbox Tested, latency-verified, and guaranteed by our pre-flight moderation. 
              Test with your own data in the Safe Zone before checkout.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center">
            <form action="/marketplace" className="relative flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  name="q"
                  defaultValue={q}
                  placeholder="Search agents…"
                  className="h-11 rounded-full pl-10"
                />
              </div>
              <input type="hidden" name="cat" value={cat} />
              <input type="hidden" name="sort" value={sort} />
              <Button type="submit" className="rounded-full h-11 px-6">Search</Button>
            </form>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {["All", "productivity", "sales", "development", "content"].map((c) => (
              <Link
                href={`/marketplace?cat=${c}&q=${q}&sort=${sort}`}
                key={c}
                className={`rounded-full border px-4 py-1.5 text-sm transition ${
                  cat === c
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {c === "All" ? "All Categories" : c.charAt(0).toUpperCase() + c.slice(1)}
              </Link>
            ))}
          </div>

          <div className="mt-6 text-sm text-muted-foreground">
            {allAgents.length} {allAgents.length === 1 ? "agent" : "agents"}
          </div>

          <div className="mt-4 grid gap-5 pb-20 md:grid-cols-2 lg:grid-cols-3">
            {allAgents.map(({ agent, seller }) => (
              <Link
                key={agent.id}
                href={`/marketplace/${agent.id}`}
                className="group relative flex flex-col rounded-3xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:shadow-[var(--shadow-card)]"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                    <Zap className="h-3 w-3 text-primary" /> {agent.tag || "Tool"}
                  </span>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="h-3.5 w-3.5 fill-primary text-primary" /> {agent.avgRating || "New"}
                    <span className="opacity-50">· {agent.salesCount}</span>
                  </div>
                </div>
                <h3 className="mt-4 font-display text-2xl font-bold">{agent.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">by {seller.name}</p>
                <p className="mt-3 text-sm leading-relaxed text-foreground/80 line-clamp-2">{agent.description}</p>
                
                {/* Telemetry Tags */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <ShieldCheck className="h-3 w-3" /> Tested
                  </span>
                  {agent.performancePass && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                      <Activity className="h-3 w-3" /> {agent.performanceAvgMs || 250}ms
                    </span>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                  <div>
                    <span className="font-display text-2xl">${(agent.monthlyPricePaise || 0) / 100}</span>
                    <span className="text-sm text-muted-foreground">/mo</span>
                  </div>
                  <Button size="sm" className="rounded-full group-hover:bg-primary group-hover:text-primary-foreground">View →</Button>
                </div>
              </Link>
            ))}
          </div>

          {allAgents.length === 0 && (
            <div className="my-20 text-center text-muted-foreground">No agents match your filters.</div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
