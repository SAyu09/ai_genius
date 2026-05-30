import Link from "next/link";
import { Header } from "@/frontend/components/site/Header";
import { Footer } from "@/frontend/components/site/Footer";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Star, Zap, Search, ShieldCheck, Activity, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { SearchInput } from "@/frontend/components/marketplace/SearchInput";
import { db } from "@/backend/db";
import { agents, users } from "@/backend/db/schema";
import { eq, and, sql, or, ilike } from "drizzle-orm";

export default async function MarketplacePage(props: { searchParams: Promise<{ q?: string; cat?: string; sort?: string; page?: string }> }) {
  const searchParams = await props.searchParams;
  const q = searchParams.q || "";
  const cat = searchParams.cat || "All";
  const sort = searchParams.sort || "top";
  const page = parseInt(searchParams.page || "1", 10);
  const limit = 12;
  const offset = (page - 1) * limit;

  const conditions = [eq(agents.status, "approved")];
  if (cat && cat !== "All") {
    conditions.push(eq(agents.category, cat));
  }
  if (q) {
    conditions.push(
      or(
        ilike(agents.name, `%${q}%`),
        ilike(agents.description, `%${q}%`)
      )!
    );
  }

  let orderBy;
  switch (sort) {
    case "price-asc":
      orderBy = agents.monthlyPriceCents;
      break;
    case "price-desc":
      orderBy = sql`${agents.monthlyPriceCents} DESC`;
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
    .orderBy(orderBy)
    .limit(limit + 1)
    .offset(offset);

  const hasNextPage = allAgents.length > limit;
  const displayedAgents = allAgents.slice(0, limit);



  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
        {/* Subtle dot pattern */}
        <div className="absolute inset-0 opacity-[0.35]" style={{
          backgroundImage: "radial-gradient(circle, #94a3b8 0.5px, transparent 0.5px)",
          backgroundSize: "24px 24px",
        }} />

        <div className="relative mx-auto w-[min(1200px,92%)] pt-14 pb-10">
          <div className="flex items-start justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 text-[12px] font-bold text-indigo-600 uppercase tracking-widest mb-4">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                AI Agent Marketplace
              </div>
              <h1 className="font-[family-name:var(--font-inter)] text-4xl sm:text-[48px] font-bold text-slate-800 tracking-tight leading-[1.1]">
                Find the right agent<br />
                <span className="text-slate-400">for your workflow.</span>
              </h1>
              <p className="mt-4 text-[16px] text-slate-500 leading-relaxed max-w-md">
                Sandbox-tested. Latency-verified. Try any agent with your own data before subscribing.
              </p>
            </div>
          </div>

          {/* Smart Search */}
          <SearchInput defaultValue={q} />

          {/* Filters */}
          <div className="mt-6 flex flex-wrap items-center gap-1.5">
            {["All", "productivity", "sales", "development", "content"].map((c) => (
              <Link
                href={`/marketplace?cat=${c}&q=${q}&sort=${sort}`}
                key={c}
                className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium border transition-all duration-150 ${
                  cat === c
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900"
                }`}
              >
                {c === "All" ? "All Categories" : c.charAt(0).toUpperCase() + c.slice(1)}
              </Link>
            ))}

            <div className="h-5 w-px bg-slate-200 mx-2 hidden sm:block" />

            {[
              { value: "top", label: "Popular" },
              { value: "new", label: "Newest" },
              { value: "price-asc", label: "Price ↑" },
              { value: "price-desc", label: "Price ↓" },
            ].map((s) => (
              <Link
                key={s.value}
                href={`/marketplace?cat=${cat}&q=${q}&sort=${s.value}`}
                className={`rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  sort === s.value
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Grid */}
      <main>
        <div className="mx-auto w-[min(1200px,92%)] py-10">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {displayedAgents.map(({ agent, seller }, idx) => {
              const price = (agent.monthlyPriceCents || 0) / 100;
              return (
                <Link
                  key={agent.id}
                  href={`/marketplace/${agent.id}`}
                  className="group flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden transition-all duration-200 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/50"
                >


                  <div className="p-6 flex flex-col flex-grow">
                    {/* Top row */}
                    <div className="flex items-center justify-between mb-5">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        {agent.tag || "Tool"}
                      </span>
                      <span className="flex items-center gap-1.5 text-[12px] text-slate-400 font-medium">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {agent.avgRating ? Number(agent.avgRating).toFixed(1) : "New"}
                        <span className="text-slate-300">·</span>
                        <span>{agent.salesCount || 0} sales</span>
                      </span>
                    </div>

                    {/* Agent identity */}
                    <div className="flex items-center gap-3.5 mb-4">
                      <div className="h-10 w-10 shrink-0 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-[15px] font-bold shadow-sm shadow-indigo-200">
                        {agent.name[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-[16px] font-semibold text-slate-800 truncate leading-snug">
                          {agent.name}
                        </h3>
                        <p className="text-[12px] text-slate-400 truncate mt-0.5">by {seller.name}</p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-[13.5px] text-slate-500 leading-relaxed line-clamp-2 flex-grow">
                      {agent.description}
                    </p>

                    {/* Status pills */}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {agent.performancePass && (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <ShieldCheck className="h-2.5 w-2.5" /> Verified
                        </span>
                      )}
                      {agent.performanceAvgMs && (
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Activity className="h-2.5 w-2.5" /> {agent.performanceAvgMs}ms
                        </span>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-xl font-semibold text-slate-800">${price}</span>
                        <span className="text-[12px] text-slate-400 ml-0.5">/mo</span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-indigo-600 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                        Details <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Empty */}
          {displayedAgents.length === 0 && (
            <div className="py-24 text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-slate-300" />
              </div>
              <p className="text-[15px] font-medium text-slate-600">No agents found</p>
              <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filter criteria.</p>
            </div>
          )}

          {/* Pagination */}
          {(page > 1 || hasNextPage) && (
            <div className="flex items-center justify-between pt-8 mt-4 border-t border-slate-100">
              {page > 1 ? (
                <Link href={`/marketplace?cat=${cat}&q=${q}&sort=${sort}&page=${page - 1}`}>
                  <Button variant="outline" size="sm" className="rounded-lg gap-1.5 h-9 px-4 text-[13px] font-medium border-slate-200">
                    <ChevronLeft className="h-3.5 w-3.5" /> Previous
                  </Button>
                </Link>
              ) : <div />}
              <span className="text-[12px] text-slate-400 font-medium">Page {page}</span>
              {hasNextPage ? (
                <Link href={`/marketplace?cat=${cat}&q=${q}&sort=${sort}&page=${page + 1}`}>
                  <Button variant="outline" size="sm" className="rounded-lg gap-1.5 h-9 px-4 text-[13px] font-medium border-slate-200">
                    Next <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              ) : <div />}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
