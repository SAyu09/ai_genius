"use client";

import { motion } from "framer-motion";
import {
  staggerContainer,
  staggerItem,
  viewportConfig,
} from "@/frontend/hooks/useAnimations";

const steps = [
  { n: "1", title: "Discover", text: "Browse thousands of vetted AI agents across every category and use case." },
  { n: "2", title: "Download", text: "Instant source-code delivery. Download the agent, blueprints, and integrations." },
  { n: "3", title: "Deploy Anywhere", text: "Bring your own cloud. Deploy locally or to your preferred infrastructure." },
];

export function HowItWorks() {
  return (
    <section id="how" className="py-12 sm:py-16 bg-gray-50/50">
      <div className="mx-auto w-[min(1200px,92%)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl text-center mx-auto mb-12"
        >
          <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">How it works</p>
          <h2 className="mt-3 font-[family-name:var(--font-inter)] text-4xl sm:text-5xl font-semibold text-gray-900 tracking-tight">
            From discovery to deployed in minutes.
          </h2>
        </motion.div>

        {/* Step connector line — desktop only */}
        <div className="hidden md:block relative">
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-[60px] left-[16.66%] right-[16.66%] h-[1px] origin-left"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.15) 20%, rgba(99,102,241,0.25) 50%, rgba(99,102,241,0.15) 80%, transparent)",
            }}
          />
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          className="grid gap-6 md:grid-cols-3 relative"
        >
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              variants={staggerItem}
              whileHover={{ y: -6 }}
              className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-10 transition-all duration-300 hover:border-indigo-100 hover:shadow-xl shadow-sm"
            >
              {/* Oversized background number */}
              <div className="absolute -right-4 -top-8 font-[family-name:var(--font-inter)] text-[160px] font-bold leading-none text-gray-50 transition-all duration-500 group-hover:text-gray-100 group-hover:scale-110 pointer-events-none select-none">
                0{s.n}
              </div>

              {/* Hover glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: "radial-gradient(300px circle at 50% 0%, rgba(99,102,241,0.04), transparent 60%)",
                }}
              />

              <div className="relative z-10">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-xl font-bold text-white shadow-[0_4px_12px_rgba(99,102,241,0.3)] transition-shadow duration-300 group-hover:shadow-[0_6px_16px_rgba(99,102,241,0.4)]">
                  {s.n}
                </div>
                <h3 className="font-[family-name:var(--font-inter)] text-2xl font-semibold text-gray-900">
                  {s.title}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-gray-500 max-w-[90%]">
                  {s.text}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
