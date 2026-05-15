"use client";

import Link from "next/link";
import { Star, Zap, CheckCircle2, TrendingUp } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { agents } from "@/frontend/data/agents";
import { motion } from "framer-motion";

export function FeaturedAgents() {
  const featured = agents.slice(0, 6);
  return (
    <section id="marketplace" className="py-24 bg-white border-y border-gray-100">
      <div className="mx-auto w-[min(1200px,92%)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Marketplace Preview
            </p>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl font-semibold text-foreground">Top agents this week</h2>
          </div>
          <Link href="/marketplace" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto rounded-full px-6 py-5 font-semibold text-slate-700 border-gray-200 hover:border-primary/50 hover:bg-blue-50/30 transition-all">
              Browse all 2,400+ agents
            </Button>
          </Link>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((a, i) => (
            <motion.div
              key={a.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Link
                href={`/agents/${a.slug}`}
                className="group flex h-full flex-col rounded-3xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-float)] hover:border-primary/20"
              >
                {/* Header: Badges & Rating */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-primary">
                      <Zap className="h-3 w-3" /> Featured
                    </span>
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                      {a.tag}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> 
                    {a.rating} <span className="text-slate-400 font-normal">({a.sales})</span>
                  </div>
                </div>

                {/* Body: Name & Desc */}
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 p-[1px]">
                    <div className="h-full w-full rounded-full bg-white flex items-center justify-center text-primary font-bold text-sm">
                      {a.name[0]}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-display text-2xl font-semibold text-slate-900 group-hover:text-primary transition-colors">{a.name}</h3>
                    <p className="text-[13px] text-slate-500 flex items-center gap-1">
                      by <span className="font-medium text-slate-700">{a.author}</span>
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    </p>
                  </div>
                </div>
                
                <p className="mt-3 text-[14px] leading-relaxed text-slate-600 flex-grow">{a.desc}</p>
                
                {/* Footer: Price & CTA */}
                <div className="mt-6 flex items-end justify-between border-t border-gray-100 pt-5">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Starting at</div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-3xl font-semibold text-slate-900">${a.price}</span>
                      <span className="text-sm font-medium text-slate-500">/mo</span>
                    </div>
                  </div>
                  <Button className="rounded-full bg-primary px-5 py-4 font-semibold text-white shadow-[var(--shadow-inner-btn)] transition-all duration-300 group-hover:bg-blue-700 group-hover:scale-105 group-active:scale-95">
                    View agent
                  </Button>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
