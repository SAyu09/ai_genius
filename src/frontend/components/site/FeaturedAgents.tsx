"use client";

import Link from "next/link";
import { Gem, Flame, BadgeCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useRef, useState, useCallback } from "react";
import {
  staggerContainer,
  staggerItem,
  viewportConfig,
} from "@/frontend/hooks/useAnimations";

/* ─── Agent card ─────────────────────────────────── */
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
        className="group relative flex h-full flex-col rounded-2xl bg-white p-7 sm:p-8 transition-all duration-400 overflow-hidden"
        style={{
          border: "1px solid var(--landing-border-light)",
          boxShadow: isHovered
            ? "0 12px 40px -12px rgba(0,0,0,0.08)"
            : "none",
        }}
      >
        {/* Mouse-follow glow */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-500"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(300px circle at ${glowPos.x}px ${glowPos.y}px, hsla(174, 60%, 46%, 0.04), transparent 60%)`,
          }}
        />

        {/* Hover accent — top border */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: "linear-gradient(90deg, var(--landing-accent-teal), hsl(210, 80%, 60%))",
          }}
        />

        {/* Header: Badges & Rating */}
        <div className="relative z-10 flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{
                backgroundColor: "var(--landing-accent-teal-light)",
                color: "var(--landing-accent-teal)",
              }}
            >
              <Flame className="h-3 w-3" /> Featured
            </span>
            <span
              className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium"
              style={{
                backgroundColor: "hsl(210, 20%, 96%)",
                color: "var(--landing-text-secondary)",
              }}
            >
              {a.tag}
            </span>
          </div>
          <div
            className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md"
            style={{
              backgroundColor: "hsl(210, 20%, 96%)",
              color: "var(--landing-text-secondary)",
            }}
          >
            <Gem className="h-3.5 w-3.5 text-amber-500" />
            {a.rating} <span style={{ color: "var(--landing-text-muted)" }}>({a.sales})</span>
          </div>
        </div>

        {/* Body: Name & Desc */}
        <div className="relative z-10 flex items-center gap-3 mb-2">
          <div
            className="h-10 w-10 shrink-0 rounded-full p-[1px]"
            style={{ background: "linear-gradient(135deg, var(--landing-accent-teal-light), hsl(210, 50%, 92%))" }}
          >
            <div className="h-full w-full rounded-full bg-white flex items-center justify-center font-bold text-sm" style={{ color: "var(--landing-accent-teal)" }}>
              {a.name[0]}
            </div>
          </div>
          <div>
            <h3
              className="text-lg font-medium tracking-tight transition-colors duration-300"
              style={{ color: "var(--landing-text-primary)" }}
            >
              {a.name}
            </h3>
            <p className="text-[13px] flex items-center gap-1" style={{ color: "var(--landing-text-secondary)" }}>
              by <span className="font-medium" style={{ color: "var(--landing-text-primary)" }}>{a.author}</span>
              <BadgeCheck className="h-3 w-3 text-emerald-500" />
            </p>
          </div>
        </div>

        <p
          className="relative z-10 mt-3 text-[14px] leading-relaxed flex-grow"
          style={{ color: "var(--landing-text-secondary)" }}
        >
          {a.desc}
        </p>

        {/* Footer: Price & CTA */}
        <div
          className="relative z-10 mt-6 flex items-end justify-between pt-5"
          style={{ borderTop: "1px solid var(--landing-border-light)" }}
        >
          <div>
            <div className="section-tag mb-1" style={{ fontSize: "0.625rem" }}>Starting at</div>
            <div className="flex items-baseline gap-1">
              <span
                className="text-2xl font-semibold tracking-tight"
                style={{ color: "var(--landing-text-primary)" }}
              >
                ${a.price}
              </span>
              <span className="text-sm font-medium" style={{ color: "var(--landing-text-muted)" }}>/mo</span>
            </div>
          </div>
          <div
            className="rounded-lg px-4 py-2.5 text-[13px] font-medium transition-all duration-300 group-hover:shadow-md"
            style={{
              backgroundColor: "var(--landing-accent-teal-light)",
              color: "var(--landing-accent-teal)",
            }}
          >
            View agent
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function FeaturedAgents({ agents = [] }: { agents?: any[] }) {
  const featured = agents.slice(0, 6);
  return (
    <section id="marketplace" className="py-0" style={{ backgroundColor: "var(--landing-bg)" }}>
      {/* Dark banner intro — Kore-inspired */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="dark-panel mx-auto w-[min(1260px,92%)] p-10 sm:p-16 lg:p-20 mb-12"
      >
        <h2 className="text-3xl sm:text-4xl lg:text-[3rem] font-medium leading-[1.2] tracking-tight text-white max-w-[800px]">
          Drive faster business outcomes with intelligent AI agents.
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-white/50 max-w-[560px]">
          Purpose-built agents solving the most urgent enterprise challenges with battle-tested reliability.
        </p>
      </motion.div>

      {/* Agent grid */}
      <div className="mx-auto w-[min(1200px,92%)] pb-16 sm:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 mb-10"
        >
          <div>
            <span className="section-tag">Marketplace Preview</span>
            <h2
              className="mt-4 text-3xl sm:text-4xl font-medium tracking-tight"
              style={{ color: "var(--landing-text-primary)" }}
            >
              Top agents this week
            </h2>
          </div>
          <Link href="/marketplace" className="w-full sm:w-auto">
            <button className="cta-secondary w-full sm:w-auto font-medium px-6 shadow-sm">
              Browse all 2,400+ agents
            </button>
          </Link>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
        >
          {featured.map((a, i) => (
            <AgentCard key={a.slug} a={a} index={i} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
