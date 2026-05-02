"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Star, Zap, Search } from "lucide-react";
import { agents, categories } from "@/data/agents";

export default function MarketplacePage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [sort, setSort] = useState<"top" | "new" | "price-asc" | "price-desc">("top");

  const filtered = useMemo(() => {
    let list = agents.filter((a) =>
      (cat === "All" || a.tag === cat) &&
      (q === "" || (a.name + a.desc + a.author).toLowerCase().includes(q.toLowerCase()))
    );
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "top") list = [...list].sort((a, b) => b.rating - a.rating);
    return list;
  }, [q, cat, sort]);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-12">
        <div className="mx-auto w-[min(1200px,92%)]">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-widest text-muted-foreground">Marketplace</p>
            <h1 className="mt-2 font-display text-5xl sm:text-6xl">Discover the world&apos;s best AI agents.</h1>
            <p className="mt-4 text-muted-foreground">Filter by category, search by use case, deploy in one click.</p>
          </div>

          <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search agents…"
                className="h-11 rounded-full pl-10"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="h-11 rounded-full border border-border bg-card px-4 text-sm"
            >
              <option value="top">Top rated</option>
              <option value="new">Newest</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </select>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`rounded-full border px-4 py-1.5 text-sm transition ${
                  cat === c
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="mt-6 text-sm text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "agent" : "agents"}
          </div>

          <div className="mt-4 grid gap-5 pb-20 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((a) => (
              <Link
                key={a.slug}
                href={`/agents/${a.slug}`}
                className="group relative flex flex-col rounded-3xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:shadow-[var(--shadow-card)]"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                    <Zap className="h-3 w-3 text-primary" /> {a.tag}
                  </span>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="h-3.5 w-3.5 fill-primary text-primary" /> {a.rating}
                    <span className="opacity-50">· {a.sales}</span>
                  </div>
                </div>
                <h3 className="mt-4 font-display text-2xl">{a.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">by {a.author}</p>
                <p className="mt-3 text-sm leading-relaxed text-foreground/80">{a.desc}</p>
                <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                  <div>
                    <span className="font-display text-2xl">${a.price}</span>
                    <span className="text-sm text-muted-foreground">/mo</span>
                  </div>
                  <Button size="sm" className="rounded-full">View →</Button>
                </div>
              </Link>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="my-20 text-center text-muted-foreground">No agents match your filters.</div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
