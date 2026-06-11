"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Search, Zap, Blocks } from "lucide-react";
import {
  staggerContainer,
  staggerItem,
  viewportConfig,
} from "@/frontend/hooks/useAnimations";

const steps = [
  {
    icon: Search,
    title: "Discover",
    text: "Browse thousands of vetted AI agents across every category, industry, and use case.",
    detail: "Search by capability",
  },
  {
    icon: Zap,
    title: "Deploy Instantly",
    text: "One-click deployment with instant source-code delivery, blueprints, and integrations.",
    detail: "Zero configuration",
  },
  {
    icon: Blocks,
    title: "Build & Sell",
    text: "Create agents and monetize on the marketplace. We handle billing, infra, and global payouts.",
    detail: "85% revenue share",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="py-16 sm:py-24 soothing-bg-subtle">
      <div className="mx-auto w-[min(1200px,92%)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl mx-auto text-center mb-14"
        >
          <span className="section-tag">How it works</span>
          <h2
            className="mt-4 font-[family-name:var(--font-space-grotesk)] text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight"
            style={{ color: "var(--landing-text-primary)" }}
          >
            From discovery to deployed{" "}
            <br className="hidden sm:block" />
            in minutes.
          </h2>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          className="grid gap-6 md:grid-cols-3"
        >
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              variants={staggerItem}
              className="group relative flex flex-col rounded-2xl bg-white p-9 sm:p-10 transition-all duration-400 hover:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] cursor-pointer overflow-hidden"
              style={{
                border: "1px solid var(--landing-border-light)",
              }}
            >
              {/* Oversized background number */}
              <div
                className="absolute -right-3 -top-6 font-[family-name:var(--font-space-grotesk)] text-[140px] font-bold leading-none select-none pointer-events-none transition-all duration-500 group-hover:scale-110"
                style={{ color: "hsl(210, 20%, 95%)" }}
              >
                0{i + 1}
              </div>

              {/* Hover accent — top border glow */}
              <div
                className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: "linear-gradient(90deg, var(--landing-accent-teal), hsl(210, 80%, 60%))",
                }}
              />

              <div className="relative z-10">
                {/* Icon + arrow */}
                <div className="flex items-center justify-between mb-7">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 group-hover:shadow-md"
                    style={{
                      backgroundColor: "var(--landing-accent-teal-light)",
                      color: "var(--landing-accent-teal)",
                    }}
                  >
                    <s.icon className="h-5 w-5 stroke-[1.8]" />
                  </div>
                  <ArrowUpRight
                    className="h-5 w-5 opacity-0 group-hover:opacity-60 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    style={{ color: "var(--landing-text-muted)" }}
                  />
                </div>

                <h3
                  className="font-[family-name:var(--font-space-grotesk)] text-xl font-semibold tracking-tight"
                  style={{ color: "var(--landing-text-primary)" }}
                >
                  {s.title}
                </h3>
                <p
                  className="mt-3 text-[15px] leading-relaxed"
                  style={{ color: "var(--landing-text-secondary)" }}
                >
                  {s.text}
                </p>

                {/* Detail tag at bottom */}
                <div className="mt-8 pt-5" style={{ borderTop: "1px solid var(--landing-border-light)" }}>
                  <span
                    className="section-tag"
                    style={{ color: "var(--landing-accent-teal)" }}
                  >
                    {s.detail}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
