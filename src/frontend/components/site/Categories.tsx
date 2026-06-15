"use client";

import { Crosshair, Headset, FlaskConical, PenLine, TerminalSquare, TrendingUp, GitFork, Wand } from "lucide-react";
import { motion } from "framer-motion";
import {
  staggerContainer,
  staggerItem,
  viewportConfig,
} from "@/frontend/hooks/useAnimations";

const cats = [
  { icon: Crosshair, name: "Sales & Outreach" },
  { icon: Headset, name: "Customer Support" },
  { icon: FlaskConical, name: "Research" },
  { icon: PenLine, name: "Content & Marketing" },
  { icon: TerminalSquare, name: "Developer Tools" },
  { icon: TrendingUp, name: "Analytics" },
  { icon: GitFork, name: "Operations" },
  { icon: Wand, name: "Personal Assistants" },
];

export function Categories() {
  return (
    <section id="categories" className="py-16 sm:py-24" style={{ backgroundColor: "var(--landing-bg)" }}>
      <div className="mx-auto w-[min(1200px,92%)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-end justify-between gap-6 mb-10"
        >
          <div>
            <span className="section-tag">Browse Categories</span>
            <h2
              className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight"
              style={{ color: "var(--landing-text-primary)" }}
            >
              Explore by capability
            </h2>
          </div>
          <a
            className="hidden text-[14px] font-medium transition-colors sm:inline-flex items-center gap-1.5"
            href="/marketplace"
            style={{ color: "var(--landing-text-secondary)" }}
          >
            View all <span aria-hidden>→</span>
          </a>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {cats.map((c) => (
            <motion.a
              key={c.name}
              href="/marketplace"
              variants={staggerItem}
              className="group relative flex flex-col rounded-2xl bg-white p-7 sm:p-8 transition-all duration-300 cursor-pointer overflow-hidden hover:shadow-[0_6px_30px_-8px_rgba(0,0,0,0.06)]"
              style={{
                border: "1px solid var(--landing-border-light)",
              }}
            >
              {/* Hover left accent line */}
              <div
                className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full opacity-0 group-hover:opacity-100 transition-all duration-400 scale-y-0 group-hover:scale-y-100"
                style={{ backgroundColor: "var(--landing-accent-teal)" }}
              />

              <div
                className="flex h-11 w-11 items-center justify-center rounded-full transition-all duration-300 group-hover:scale-110 mb-6"
                style={{
                  backgroundColor: "var(--landing-accent-teal-light)",
                  color: "var(--landing-accent-teal)",
                }}
              >
                <c.icon className="h-5 w-5 stroke-[1.5]" />
              </div>

              <div
                className="text-[16px] font-medium tracking-tight transition-colors duration-300"
                style={{ color: "var(--landing-text-primary)" }}
              >
                {c.name}
              </div>
            </motion.a>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
