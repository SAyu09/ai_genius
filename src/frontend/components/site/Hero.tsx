"use client";

import Link from "next/link";
import { Button } from "@/frontend/components/ui/button";
import { ArrowRight, Search, Activity, ShieldCheck, Cpu, CreditCard } from "lucide-react";
import { motion, useMotionValue, useTransform, useSpring, useInView } from "framer-motion";
import { useRef, useEffect } from "react";
import {
  staggerContainer,
  staggerItem,
  useCountUp,
  viewportConfig,
} from "@/frontend/hooks/useAnimations";

/* ─── Animated Counter Component ─────────────────── */
function AnimatedStat({ value, label, icon: Icon }: { value: string; label: string; icon: React.ElementType }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const numericMatch = value.match(/^([\d,]+)/);
  const numericPart = numericMatch ? parseInt(numericMatch[1].replace(/,/g, ""), 10) : 0;
  const suffix = numericMatch ? value.slice(numericMatch[0].length) : value;
  const isNumeric = numericMatch !== null;
  const { count, start } = useCountUp(numericPart, 1800);

  useEffect(() => {
    if (isInView) start();
  }, [isInView, start]);

  return (
    <motion.div
      ref={ref}
      variants={staggerItem}
      className="group flex flex-col items-center p-5 rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:border-indigo-100 hover:-translate-y-0.5"
    >
      <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 mb-3 transition-colors group-hover:bg-indigo-100 group-hover:text-indigo-700">
        <Icon className="h-4 w-4" />
      </div>
      <span className="font-[family-name:var(--font-inter)] text-xl font-bold text-gray-900 leading-none tracking-tight">
        {isNumeric ? count.toLocaleString() : value}
        {isNumeric && suffix}
      </span>
      <span className="text-[11px] font-semibold text-gray-400 mt-2 uppercase tracking-wider text-center">
        {label}
      </span>
    </motion.div>
  );
}

/* ─── Main Hero ──────────────────────────────────── */
export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 30 });

  // Mouse spotlight effect
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const handler = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    };
    el.addEventListener("mousemove", handler);
    return () => el.removeEventListener("mousemove", handler);
  }, [mouseX, mouseY]);

  const spotlightBackground = useTransform(
    [springX, springY],
    ([x, y]) => `radial-gradient(600px circle at ${x}px ${y}px, rgba(99,102,241,0.04), transparent 60%)`
  );

  const trustCues = [
    { label: "Enterprise Deployments", value: "4,200+", icon: Cpu },
    { label: "Average Response Time", value: "850ms", icon: Activity },
    { label: "De-branded Secure Sandbox", value: "100%", icon: ShieldCheck },
    { label: "Payment & AutoPay Secured", value: "Stripe & UPI", icon: CreditCard },
  ];

  const headlineWords = "The App Store for Business Automation.".split(" ");

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden pt-20 pb-12 sm:pt-24 sm:pb-16 bg-white flex items-center justify-center select-none"
    >
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000003_1px,transparent_1px),linear-gradient(to_bottom,#00000003_1px,transparent_1px)] bg-[size:48px_48px]" />

      {/* Mouse-follow spotlight */}
      <motion.div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{ background: spotlightBackground }}
      />

      {/* Ambient floating orbs - light theme */}
      <div
        className="absolute top-[5%] left-[10%] w-[500px] h-[500px] rounded-full opacity-[0.15] blur-[120px] pointer-events-none"
        style={{
          background: "radial-gradient(circle, #c7d2fe 0%, transparent 70%)",
          animation: "float-slow 12s ease-in-out infinite",
        }}
      />
      <div
        className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] rounded-full opacity-[0.12] blur-[100px] pointer-events-none"
        style={{
          background: "radial-gradient(circle, #ddd6fe 0%, transparent 70%)",
          animation: "float-slower 16s ease-in-out infinite",
        }}
      />
      <div
        className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] rounded-full opacity-[0.08] blur-[120px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, #a5b4fc 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-[960px] text-center px-4 flex flex-col items-center">
        {/* Announcement Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="inline-flex items-center gap-2.5 rounded-full border border-gray-200 bg-gray-50/80 px-4 py-2 text-xs font-semibold text-gray-500 mb-10 backdrop-blur-sm shadow-sm"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-500 opacity-40" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-600" />
          </span>
          <span className="text-gray-700">Enterprise Redesign Live:</span>
          v4.0 Secure SDK Protocol
        </motion.div>

        {/* Animated Headline — word-by-word reveal */}
        <h1 className="font-[family-name:var(--font-inter)] text-4xl tracking-tight sm:text-[56px] lg:text-[64px] text-gray-900 font-bold max-w-[800px] leading-[1.08] flex flex-wrap justify-center gap-x-[0.3em]">
          {headlineWords.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                duration: 0.5,
                delay: 0.4 + i * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={
                word === "Business" || word === "Automation."
                  ? "bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent"
                  : ""
              }
            >
              {word}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="mt-6 max-w-[620px] text-lg sm:text-xl leading-relaxed text-gray-500 font-normal"
        >
          Discover, test, and deploy verified AI agents in seconds.
        </motion.p>

        {/* Search Omnibar */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.05 }}
          className="mx-auto mt-10 w-full max-w-[520px] relative"
        >
          <div className="relative flex items-center h-[52px] rounded-xl border border-gray-200 bg-white transition-all shadow-sm focus-within:border-indigo-500 focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] overflow-hidden hover:border-gray-300 hover:shadow-md">
            <Search className="ml-4 h-4 w-4 text-gray-400 shrink-0" />
            <input
              placeholder="Search 2,400+ enterprise agents..."
              className="flex-1 bg-transparent px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400"
              onClick={() => {
                const event = new KeyboardEvent("keydown", {
                  key: "k",
                  metaKey: true,
                  bubbles: true,
                  cancelable: true,
                });
                document.dispatchEvent(event);
              }}
            />
            <div className="absolute right-2 flex items-center gap-1.5 text-[10px] text-gray-400 font-mono bg-gray-50 border border-gray-200 px-2 py-1 rounded">
              <span>Press</span>
              <span className="font-semibold text-gray-600">⌘K</span>
            </div>
          </div>
        </motion.div>

        {/* CTA Group */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-4"
        >
          <Link href="/marketplace">
            <Button
              size="xl"
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-[0_4px_14px_rgba(99,102,241,0.35)] h-12 px-7 text-sm transition-all duration-300 hover:shadow-[0_6px_20px_rgba(99,102,241,0.45)] hover:-translate-y-0.5 active:translate-y-0"
            >
              Explore Enterprise Marketplace <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/sell">
            <Button
              size="xl"
              variant="outline"
              className="rounded-xl border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 h-12 px-7 text-sm transition-all duration-300 hover:shadow-md"
            >
              List Your Agent
            </Button>
          </Link>
        </motion.div>

        {/* Gradient Divider */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          className="w-full max-w-[760px] h-[1px] my-16"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.15) 30%, rgba(99,102,241,0.25) 50%, rgba(99,102,241,0.15) 70%, transparent)",
          }}
        />

        {/* Trust Metrics — Animated Counters */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          className="w-full max-w-[850px] grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {trustCues.map((cue) => (
            <AnimatedStat key={cue.label} {...cue} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
