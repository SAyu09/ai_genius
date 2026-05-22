"use client";

import { motion } from "framer-motion";
import {
  staggerContainer,
  staggerItem,
  viewportConfig,
} from "@/frontend/hooks/useAnimations";

const logos = ["Northwind", "Lumen", "Halcyon", "Inkstone", "Vector AI", "Kite & Co", "Praxis", "Forma"];
const marqueeLogos = [...logos, ...logos, ...logos];

const stats = [
  ["2,400+", "Agents"],
  ["140+", "Countries"],
  ["10K+", "Buyers"],
  ["85%", "Seller Payout"],
  ["$0", "Upfront"],
  ["Weekly", "Settlements"],
];

export function LogoCloud() {
  return (
    <section className="bg-white py-0 sm:py-4">
      <div className="mx-auto w-full">
        {/* Stats Section */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          className="flex flex-col sm:flex-row items-center justify-center divide-y sm:divide-y-0 sm:divide-x divide-gray-200 border-y border-gray-200 bg-gray-50/50 py-6 mb-8"
        >
          {stats.map(([n, l]) => (
            <motion.div
              key={l}
              variants={staggerItem}
              className="flex flex-col items-center justify-center px-6 py-4 sm:py-0 text-center"
            >
              <div className="text-sm font-semibold text-gray-800 whitespace-nowrap">{n}</div>
              <div className="mt-0.5 text-xs text-gray-400 whitespace-nowrap">{l}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Marquee Section */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400 mb-8"
        >
          Powering intelligent automation at scale
        </motion.p>

        <div className="relative flex overflow-hidden mask-horizontal pb-8">
          <motion.div
            className="flex flex-none items-center gap-16 pr-16"
            animate={{ x: "-33.33%" }}
            transition={{ duration: 25, ease: "linear", repeat: Infinity }}
          >
            {marqueeLogos.map((l, i) => (
              <span
                key={`${l}-${i}`}
                className="font-[family-name:var(--font-inter)] text-3xl font-semibold text-gray-300 transition-colors duration-300 hover:text-indigo-400 cursor-default whitespace-nowrap"
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
