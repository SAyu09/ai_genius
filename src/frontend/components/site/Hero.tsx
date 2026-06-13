"use client";

import Link from "next/link";
import { ArrowDown } from "lucide-react";
import { motion } from "framer-motion";
import { useRef, useEffect } from "react";

/* ─── Main Hero ──────────────────────────────────── */
export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden min-h-[92vh] flex flex-col items-center justify-center select-none bg-black"
    >
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src="/scene_bhot_messy_lg_rha_jime.mp4" type="video/mp4" />
      </video>

      {/* Overlay to ensure text readability */}
      <div className="absolute inset-0 bg-black/40 z-[5] pointer-events-none" />
      {/* Concentric ring decoration — purely CSS */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5]">
        {/* Outer ring */}
        <div
          className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 w-[1400px] h-[1400px] rounded-full border opacity-[0.08]"
          style={{
            borderColor: "hsl(200, 30%, 75%)",
            animation: "concentric-breathe 8s ease-in-out infinite",
          }}
        />
        {/* Middle ring */}
        <div
          className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full border opacity-[0.06]"
          style={{
            borderColor: "hsl(210, 35%, 78%)",
            animation: "concentric-breathe 8s ease-in-out infinite 1s",
          }}
        />
        {/* Inner ring */}
        <div
          className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border opacity-[0.04]"
          style={{
            borderColor: "hsl(195, 25%, 80%)",
            animation: "concentric-breathe 8s ease-in-out infinite 2s",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-[1100px] text-center px-4 flex flex-col items-center">
        {/* Large confident headline */}
        <motion.h1
          initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="text-[clamp(2.5rem,6vw,5.5rem)] font-medium leading-[1.08] tracking-[-0.03em] max-w-[900px] text-white drop-shadow-md"
        >
          Great agents are built{" "}
          <br className="hidden sm:block" />
          on a strong foundation.
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 max-w-[550px] text-[17px] sm:text-xl leading-relaxed text-white/80 font-light tracking-wide drop-shadow-sm"
        >
          AI agents ready for your business.{" "}
          <br className="hidden sm:block" />
          The only agent marketplace you can trust.
        </motion.p>

        {/* CTA Buttons — Kore-inspired monospace style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4 relative z-10"
        >
          <Link href="/marketplace">
            <button className="cta-primary group !bg-white !text-black hover:!bg-gray-100 shadow-lg shadow-black/10 font-medium tracking-tight rounded-full px-7">
              Explore Marketplace
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-black/40 group-hover:bg-black transition-colors" />
            </button>
          </Link>
          <Link href="/sell">
            <button className="cta-secondary group !text-white !border-white/30 hover:!bg-white/10 hover:!border-white/60 shadow-lg shadow-black/10 font-medium tracking-tight rounded-full px-7">
              List Your Agent
            </button>
          </Link>
        </motion.div>
      </div>

      {/* Scroll indicator — right side */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.4 }}
        className="absolute right-6 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-center gap-3"
      >
        <span
          className="section-tag [writing-mode:vertical-rl] rotate-180"
          style={{ fontSize: "0.6875rem", letterSpacing: "0.2em", color: "rgba(255,255,255,0.4)" }}
        >
          Explore our platform
        </span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowDown className="h-4 w-4 text-white/40" />
        </motion.div>
      </motion.div>

      {/* Fade into the next section (light theme) */}
      <div className="absolute bottom-0 left-0 w-full h-32 sm:h-48 bg-gradient-to-t from-[var(--landing-aura-1)] to-transparent z-[5] pointer-events-none" />
    </section>
  );
}
