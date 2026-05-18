"use client";

import { motion } from "framer-motion";

const logos = ["Northwind", "Lumen", "Halcyon", "Inkstone", "Vector AI", "Kite & Co", "Praxis", "Forma"];
const marqueeLogos = [...logos, ...logos, ...logos];

export function LogoCloud() {
  return (
    <section className="bg-white py-0 sm:py-8">
      <div className="mx-auto w-full">
        {/* Stats Section */}
        <div className="flex flex-col sm:flex-row items-center justify-center divide-y sm:divide-y-0 sm:divide-x divide-gray-200 border-y border-gray-200 bg-gray-50/50 py-8 mb-16">
          {[
            ["2,400+", "Agents"],
            ["140+", "Countries"],
            ["10K+", "Buyers"],
            ["85%", "Seller Payout"],
            ["$0", "Upfront"],
            ["Weekly", "Settlements"],
          ].map(([n, l]) => (
            <div key={l} className="flex flex-col items-center justify-center px-6 py-4 sm:py-0 text-center">
              <div className="text-sm font-semibold text-gray-800 whitespace-nowrap">{n}</div>
              <div className="mt-0.5 text-xs text-gray-400 whitespace-nowrap">{l}</div>
            </div>
          ))}
        </div>

        {/* Marquee Section */}
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400 mb-8">
          Powering intelligent automation at scale
        </p>
        
        <div className="relative flex overflow-hidden mask-horizontal pb-16">
          <motion.div
            className="flex flex-none items-center gap-16 pr-16"
            animate={{ x: "-33.33%" }}
            transition={{ duration: 25, ease: "linear", repeat: Infinity }}
          >
            {marqueeLogos.map((l, i) => (
              <span 
                key={`${l}-${i}`} 
                className="font-display text-3xl font-semibold text-gray-300 transition-colors duration-300 hover:text-gray-400 cursor-default whitespace-nowrap"
              >
                {l}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
      
      {/* Horizontal mask for fading out edges */}
      <style jsx>{`
        .mask-horizontal {
          mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
        }
      `}</style>
    </section>
  );
}
