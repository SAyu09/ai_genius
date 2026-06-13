"use client";

import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { viewportConfig } from "@/frontend/hooks/useAnimations";

export function FeatureShowcase() {
  return (
    <section className="relative py-6 sm:py-10 soothing-bg-subtle">
      <div className="mx-auto w-[min(1260px,92%)]">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportConfig}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link href="/marketplace" className="block group">
            <div className="dark-panel relative min-h-[380px] sm:min-h-[420px] flex overflow-hidden">
              {/* Left content */}
              <div className="relative z-10 flex flex-col justify-center p-10 sm:p-14 lg:p-16 flex-1 max-w-[600px]">
                <span className="section-tag section-tag-light mb-4">
                  The AI Genius Agent Marketplace
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-medium leading-[1.15] tracking-tight text-white">
                  Discover{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400 italic">
                    verified agents
                  </span>
                </h2>
                <p className="mt-5 text-[15px] sm:text-base leading-relaxed text-white/55 max-w-[480px]">
                  The trusted marketplace for enterprise AI agents. Browse, test, and deploy agents for customer service, sales, operations, and more — with certainty.
                </p>
              </div>

              {/* Right side — organic art visual */}
              <div className="absolute right-0 top-0 bottom-0 w-[55%] hidden md:block overflow-hidden" style={{ WebkitMaskImage: "linear-gradient(to right, transparent, black 15%)", maskImage: "linear-gradient(to right, transparent, black 15%)" }}>
                <img
                  src="/feature-showcase-art.png"
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover object-center opacity-80 transition-transform duration-700 group-hover:scale-105"
                  aria-hidden="true"
                />
                {/* Gradient overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--landing-dark-card)] via-[var(--landing-dark-card)]/70 to-transparent pointer-events-none" />
              </div>

              {/* Arrow link button */}
              <div className="absolute right-6 bottom-6 sm:right-8 sm:bottom-8 z-20">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[var(--landing-dark-card)] transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_4px_20px_rgba(255,255,255,0.25)]">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Three-column feature cards below */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportConfig}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="mt-1 grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-[var(--landing-border-light)] rounded-2xl overflow-hidden"
        >
          {[
            {
              title: "Pre-built Agents",
              desc: "Deploy agents for Sales, Support, HR, IT, and Marketing instantly — no code required.",
              arrow: true,
            },
            {
              title: "Agent Accelerators",
              desc: "Leverage our marketplace of pre-built agent templates, integrations, and workflows.",
              arrow: true,
            },
            {
              title: "Custom Agents",
              desc: "Design and build custom agents for your unique business processes and workflows.",
              arrow: true,
            },
          ].map((item) => (
            <div
              key={item.title}
              className="group bg-white p-8 sm:p-10 transition-colors duration-300 hover:bg-gray-50/80 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <h3
                  className="text-xl font-medium tracking-tight"
                  style={{ color: "var(--landing-text-primary)" }}
                >
                  {item.title}
                </h3>
                {item.arrow && (
                  <ArrowUpRight
                    className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    style={{ color: "var(--landing-text-muted)" }}
                  />
                )}
              </div>
              <p
                className="text-[15px] leading-relaxed"
                style={{ color: "var(--landing-text-secondary)" }}
              >
                {item.desc}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
