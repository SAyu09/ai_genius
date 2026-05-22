"use client";

import Link from "next/link";
import { Button } from "@/frontend/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { viewportConfig } from "@/frontend/hooks/useAnimations";

export function SellCTA() {
  return (
    <section id="sell" className="py-12 sm:py-16 bg-white">
      <div className="mx-auto w-[min(1200px,92%)]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportConfig}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-[2rem] bg-indigo-900 text-white p-10 sm:p-20 border border-indigo-800"
          style={{
            boxShadow: "0 20px 60px -20px rgba(49,46,129,0.5)",
          }}
        >
          {/* Immersive radial glow behind the text and button */}
          <div
            aria-hidden
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[800px] rounded-full opacity-[0.4] blur-[100px] pointer-events-none"
            style={{
              background: "radial-gradient(circle, #6366f1 0%, transparent 70%)",
              animation: "float-slow 12s ease-in-out infinite",
            }}
          />
          <div
            aria-hidden
            className="absolute right-0 bottom-0 h-[400px] w-[400px] translate-x-1/3 translate-y-1/3 rounded-full opacity-[0.3] blur-[80px] pointer-events-none"
            style={{
              background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)",
              animation: "float-slower 16s ease-in-out infinite",
            }}
          />

          {/* Animated grid inside CTA */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:48px_48px] opacity-50" />

          <div className="relative z-10 grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-[13px] font-bold uppercase tracking-[0.2em] text-indigo-300 mb-4"
              >
                For builders
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="font-[family-name:var(--font-inter)] text-4xl sm:text-5xl lg:text-[56px] leading-[1.1] font-semibold tracking-tight text-white"
              >
                Turn your AI agent into <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300 italic pr-2">global revenue.</span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.45 }}
                className="mt-6 max-w-xl text-[17px] leading-relaxed text-indigo-100/80"
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
                <Button className="w-full lg:w-[280px] rounded-full bg-white hover:bg-gray-50 text-indigo-900 px-8 py-7 text-[17px] font-semibold shadow-[0_4px_14px_rgba(255,255,255,0.25)] transition-all duration-300 hover:shadow-[0_6px_20px_rgba(255,255,255,0.3)] hover:scale-[1.03] active:scale-95">
                  Become a seller <ArrowUpRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/sell" className="w-full lg:w-auto">
                <Button variant="ghost" className="w-full lg:w-[280px] rounded-full text-indigo-200 hover:text-white hover:bg-white/10 px-8 py-7 text-[17px] font-medium transition-all duration-300">
                  Read seller guide
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
