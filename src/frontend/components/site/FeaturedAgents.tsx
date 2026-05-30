"use client";

import Link from "next/link";
import { Star, Zap, CheckCircle2, TrendingUp } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { motion } from "framer-motion";
import { useRef, useState, useCallback } from "react";
import {
  staggerContainer,
  staggerItem,
  viewportConfig,
} from "@/frontend/hooks/useAnimations";

/* ─── Agent card with hover glow ─────────────────── */
function AgentCard({ a, index }: { a: any; index: number }) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const [glowPos, setGlowPos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    setGlowPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  return (
    <motion.div variants={staggerItem}>
      <Link
        ref={cardRef}
        href={`/marketplace/${a.id}`}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:border-indigo-100 overflow-hidden"
        style={{
          boxShadow: isHovered
            ? "0 10px 40px -10px rgba(99,102,241,0.15), 0 4px 6px -4px rgba(99,102,241,0.05)"
            : "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        {/* Mouse-follow glow */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-500"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(300px circle at ${glowPos.x}px ${glowPos.y}px, rgba(99,102,241,0.04), transparent 60%)`,
          }}
        />

        {/* Header: Badges & Rating */}
        <div className="relative z-10 flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 border border-indigo-100">
              <Zap className="h-3 w-3" /> Featured
            </span>
            <span className="inline-flex items-center rounded-full bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-500 border border-gray-200">
              {a.tag}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded-md border border-gray-200">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {a.rating} <span className="text-gray-400 font-normal">({a.sales})</span>
          </div>
        </div>

        {/* Body: Name & Desc */}
        <div className="relative z-10 flex items-center gap-3 mb-2">
          <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 p-[1px]">
            <div className="h-full w-full rounded-full bg-white flex items-center justify-center text-indigo-600 font-bold text-sm">
              {a.name[0]}
            </div>
          </div>
          <div>
            <h3 className="font-[family-name:var(--font-inter)] text-xl font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors duration-300">
              {a.name}
            </h3>
            <p className="text-[13px] text-gray-500 flex items-center gap-1">
              by <span className="font-medium text-gray-700">{a.author}</span>
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            </p>
          </div>
        </div>

        <p className="relative z-10 mt-3 text-[14px] leading-relaxed text-gray-500 flex-grow">
          {a.desc}
        </p>

        {/* Footer: Price & CTA */}
        <div className="relative z-10 mt-6 flex items-end justify-between border-t border-gray-100 pt-5">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-0.5">Starting at</div>
            <div className="flex items-baseline gap-1">
              <span className="font-[family-name:var(--font-inter)] text-2xl font-semibold text-gray-900">${a.price}</span>
              <span className="text-sm font-medium text-gray-400">/mo</span>
            </div>
          </div>
          <Button className="rounded-xl bg-indigo-50 px-5 py-4 font-semibold text-indigo-600 transition-all duration-300 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-[0_4px_12px_rgba(99,102,241,0.3)] group-hover:scale-105 group-active:scale-95 border border-indigo-100 group-hover:border-transparent">
            View agent
          </Button>
        </div>
      </Link>
    </motion.div>
  );
}

export function FeaturedAgents({ agents = [] }: { agents?: any[] }) {
  const featured = agents.slice(0, 6);
  return (
    <section id="marketplace" className="py-12 sm:py-16 bg-white border-y border-gray-100">
      <div className="mx-auto w-[min(1200px,92%)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6"
        >
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-indigo-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Marketplace Preview
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-inter)] text-4xl sm:text-5xl font-semibold text-gray-900 tracking-tight">
              Top agents this week
            </h2>
          </div>
          <Link href="/marketplace" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto rounded-full px-6 py-5 font-semibold text-gray-600 border-gray-200 bg-white hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 transition-all duration-300 hover:shadow-sm"
            >
              Browse all 2,400+ agents
            </Button>
          </Link>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {featured.map((a, i) => (
            <AgentCard key={a.slug} a={a} index={i} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
