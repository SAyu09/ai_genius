"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { viewportConfig } from "@/frontend/hooks/useAnimations";

export function SellCTA() {
  return (
    <section id="sell" className="py-16 sm:py-24 soothing-bg-subtle">
      <div className="mx-auto w-[min(1260px,92%)]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportConfig}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="dark-panel relative p-10 sm:p-16 lg:p-20 overflow-hidden"
        >
          {/* Ambient teal glow */}
          <div
            aria-hidden
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[700px] rounded-full opacity-[0.12] blur-[100px] pointer-events-none"
            style={{
              background: "radial-gradient(circle, var(--landing-accent-teal) 0%, transparent 70%)",
              animation: "float-slow 12s ease-in-out infinite",
            }}
          />
          <div
            aria-hidden
            className="absolute right-0 bottom-0 h-[350px] w-[350px] translate-x-1/4 translate-y-1/4 rounded-full opacity-[0.08] blur-[80px] pointer-events-none"
            style={{
              background: "radial-gradient(circle, hsl(210, 80%, 60%) 0%, transparent 70%)",
              animation: "float-slower 16s ease-in-out infinite",
            }}
          />

          {/* Subtle grid inside */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />

          <div className="relative z-10 grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="section-tag section-tag-light"
              >
                For builders
              </motion.span>
              <motion.h2
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-4 font-[family-name:var(--font-space-grotesk)] text-3xl sm:text-4xl lg:text-[3.25rem] leading-[1.1] font-semibold tracking-tight text-white"
              >
                Turn your AI agent into{" "}
                <br className="hidden lg:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400 italic">
                  global revenue.
                </span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.45 }}
                className="mt-6 max-w-xl text-[16px] leading-relaxed text-white/50"
              >
                List once. Reach 80,000+ teams worldwide. We handle billing, distribution,
                infra and payouts in 60+ currencies. You keep 85% of every sale.
              </motion.p>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex flex-col gap-4 sm:flex-row lg:flex-col lg:items-end justify-center"
            >
              <Link href="/sell" className="w-full lg:w-auto">
                <button className="w-full lg:w-[280px] cta-mono inline-flex items-center justify-center gap-3 rounded-lg bg-white text-[var(--landing-dark-card)] px-8 py-4 text-[14px] font-semibold transition-all duration-300 hover:shadow-[0_4px_20px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-95">
                  Become a Seller <ArrowUpRight className="h-4 w-4" />
                </button>
              </Link>
              <Link href="/sell" className="w-full lg:w-auto">
                <button className="w-full lg:w-[280px] cta-mono inline-flex items-center justify-center gap-3 rounded-lg bg-transparent text-white/60 hover:text-white px-8 py-4 text-[14px] font-medium border border-white/10 hover:border-white/25 transition-all duration-300">
                  Read Seller Guide
                </button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
