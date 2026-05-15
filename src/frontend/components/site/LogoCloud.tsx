"use client";

import { motion } from "framer-motion";

const logos = ["Northwind", "Lumen", "Halcyon", "Inkstone", "Vector AI", "Kite & Co", "Praxis", "Forma"];

// Duplicate array for seamless infinite scrolling
const marqueeLogos = [...logos, ...logos, ...logos];

export function LogoCloud() {
  return (
    <section className="bg-white py-16 sm:py-24 border-b border-gray-200">
      <div className="mx-auto w-[min(1200px,92%)]">
        
        {/* Stats Section */}
        <div className="mx-auto mb-16 flex max-w-4xl flex-col sm:flex-row items-center justify-center divide-y sm:divide-y-0 sm:divide-x divide-gray-200 rounded-2xl border border-gray-200 bg-white/50 p-6 shadow-[var(--shadow-soft)]">
          {[
            ["2,400+", "Agents listed"],
            ["140+", "Countries active"],
            ["$8M+", "Paid to creators"],
          ].map(([n, l]) => (
            <div key={l} className="flex flex-col items-center justify-center w-full px-8 py-4 sm:py-0">
              <div className="font-display text-4xl sm:text-5xl text-primary">{n}</div>
              <div className="mt-1 text-sm font-medium text-slate-500 uppercase tracking-wide">{l}</div>
            </div>
          ))}
        </div>

        {/* Marquee Section */}
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-8">
          Powering intelligent automation at scale
        </p>
        
        <div className="relative flex overflow-hidden mask-horizontal">
          <motion.div
            className="flex flex-none items-center gap-16 pr-16"
            animate={{ x: "-33.33%" }}
            transition={{ duration: 25, ease: "linear", repeat: Infinity }}
          >
            {marqueeLogos.map((l, i) => (
              <span 
                key={`${l}-${i}`} 
                className="font-display text-3xl font-semibold text-slate-300 transition-colors duration-300 hover:text-primary cursor-default whitespace-nowrap"
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
