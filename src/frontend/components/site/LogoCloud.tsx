"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  staggerContainer,
  staggerItem,
  viewportConfig,
} from "@/frontend/hooks/useAnimations";

const logos = ["Northwind", "Lumen", "Halcyon", "Inkstone", "Vector AI", "Kite & Co", "Praxis", "Forma"];
const marqueeLogos = [...logos, ...logos, ...logos];

export function LogoCloud() {
  return (
    <section className="relative py-20 sm:py-28 soothing-bg-subtle overflow-hidden">
      <div className="mx-auto w-[min(1200px,92%)]">
        {/* Social proof section — large headline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportConfig}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col lg:flex-row lg:items-end gap-10 lg:gap-20"
        >
          {/* Left — large text */}
          <div className="flex-1">
            <h2
              className="text-3xl sm:text-4xl lg:text-[2.75rem] font-medium leading-[1.2] tracking-tight"
              style={{ color: "var(--landing-text-primary)" }}
            >
              Discover why thousands{" "}
              <br className="hidden lg:block" />
              of teams use AI Genius.
            </h2>
          </div>

          {/* Right — description + CTAs */}
          <div className="flex-shrink-0">
            <p
              className="text-[15px] leading-relaxed max-w-[360px] mb-6"
              style={{ color: "var(--landing-text-secondary)" }}
            >
              Join 10,000+ businesses deploying AI agents to transform their operations.
            </p>

            {/* Dotted separator */}
            <div
              className="w-full h-[1px] mb-6"
              style={{
                backgroundImage: "repeating-linear-gradient(90deg, var(--landing-text-muted) 0, var(--landing-text-muted) 4px, transparent 4px, transparent 12px)",
                opacity: 0.3,
              }}
            />

            <div className="flex flex-wrap gap-3">
              <Link href="/marketplace">
                <button className="cta-primary group px-6 shadow-sm">
                  Browse Marketplace
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-white/60 group-hover:bg-white transition-colors" />
                </button>
              </Link>
              <Link href="/about">
                <button className="cta-secondary group px-6 shadow-sm">
                  Learn More
                </button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Stats row — centered, muted */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 mt-16 pt-10"
          style={{ borderTop: "1px solid var(--landing-border-light)" }}
        >
          {[
            ["2,400+", "Agents"],
            ["140+", "Countries"],
            ["10K+", "Buyers"],
            ["85%", "Seller Payout"],
            ["$0", "Upfront"],
            ["Weekly", "Settlements"],
          ].map(([n, l]) => (
            <motion.div
              key={l}
              variants={staggerItem}
              className="flex flex-col items-center text-center"
            >
              <div
                className="text-sm font-semibold whitespace-nowrap"
                style={{ color: "var(--landing-text-primary)" }}
              >
                {n}
              </div>
              <div
                className="mt-0.5 text-xs whitespace-nowrap"
                style={{ color: "var(--landing-text-muted)" }}
              >
                {l}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Logo marquee — full width below */}
      <div className="mt-14">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="section-tag text-center mb-8"
        >
          Powering intelligent automation at scale
        </motion.p>

        <div className="relative flex overflow-hidden mask-horizontal">
          <motion.div
            className="flex flex-none items-center gap-16 pr-16"
            animate={{ x: "-33.33%" }}
            transition={{ duration: 30, ease: "linear", repeat: Infinity }}
          >
            {marqueeLogos.map((l, i) => (
              <span
                key={`${l}-${i}`}
                className="text-2xl sm:text-3xl font-medium tracking-tight transition-colors duration-300 cursor-default whitespace-nowrap"
                style={{ color: "hsl(210, 15%, 82%)" }}
              >
                {l}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
