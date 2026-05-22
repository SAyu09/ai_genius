"use client";

import Link from "next/link";
import { Button } from "@/frontend/components/ui/button";
import { ArrowRight, Search, Activity, ShieldCheck, Cpu, CreditCard } from "lucide-react";
import { motion } from "framer-motion";

export function Hero() {
  const trustCues = [
    { label: "Enterprise Deployments", value: "4,200+", icon: Cpu },
    { label: "Average Response Time", value: "850ms", icon: Activity },
    { label: "De-branded Secure Sandbox", value: "100%", icon: ShieldCheck },
    { label: "Payment & AutoPay Secured", value: "Stripe & UPI", icon: CreditCard },
  ];

  return (
    <section className="relative overflow-hidden pt-24 pb-20 sm:pt-32 sm:pb-28 bg-white min-h-[85vh] flex items-center justify-center select-none">
      {/* High-end Subtle Enterprise Grid Background */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:32px_32px]"></div>
      
      {/* Decorative Radial Overlay for linear design glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[300px] bg-indigo-50/20 blur-3xl rounded-full z-0"></div>

      <div className="relative z-10 mx-auto w-full max-w-[960px] text-center px-4 flex flex-col items-center">
        {/* Sleek Announcement Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-500 mb-8 tracking-tight">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
          Enterprise Redesign Live: v4.0 Secure SDK Protocol
        </div>

        {/* Headline exactly as requested */}
        <h1 className="font-display text-4xl tracking-tight sm:text-[54px] text-gray-900 font-bold max-w-[800px] leading-[1.1]">
          The App Store for Business Automation.
        </h1>
        
        <p className="mt-6 max-w-[620px] text-lg sm:text-xl leading-relaxed text-gray-500 font-normal">
          Discover, test, and deploy verified AI agents in seconds.
        </p>

        {/* Search & Omnibar interactive shortcut cue */}
        <div className="mx-auto mt-10 w-full max-w-[520px] relative">
          <div className="relative flex items-center h-[52px] rounded-xl border border-gray-200 bg-white transition-all shadow-sm focus-within:border-indigo-600 focus-within:shadow-[0_0_0_3px_rgba(79,70,229,0.1)] overflow-hidden">
            <Search className="ml-4 h-4 w-4 text-gray-400 shrink-0" />
            <input
              placeholder="Search 2,400+ enterprise agents..."
              className="flex-1 bg-transparent px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400"
              onClick={() => {
                const event = new KeyboardEvent("keydown", {
                  key: "k",
                  metaKey: true,
                  bubbles: true,
                  cancelable: true
                });
                document.dispatchEvent(event);
              }}
            />
            <div className="absolute right-2 flex items-center gap-1.5 text-[10px] text-gray-400 font-mono bg-gray-50 border border-gray-150 px-2 py-1 rounded">
              <span>Press</span>
              <span className="font-semibold text-gray-600">⌘K</span>
            </div>
          </div>
        </div>

        {/* CTA Group */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link href="/marketplace">
            <Button size="xl" className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm h-11 px-6 text-sm">
              Explore Enterprise Marketplace <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/sell">
            <Button size="xl" variant="outline" className="rounded-lg border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 h-11 px-6 text-sm">
              List Your Agent
            </Button>
          </Link>
        </div>

        {/* Divider line for spatial design */}
        <div className="w-full max-w-[760px] h-[1px] bg-gray-100 my-16"></div>

        {/* Heuristic Trust Cues & Verified Stats Grid */}
        <div className="w-full max-w-[800px] grid grid-cols-2 md:grid-cols-4 gap-6">
          {trustCues.map((cue) => (
            <div key={cue.label} className="flex flex-col items-center p-4 rounded-xl border border-gray-100 bg-white shadow-xs">
              <div className="p-2 rounded-lg bg-gray-50 border border-gray-150 text-indigo-600 mb-3">
                <cue.icon className="h-4 w-4" />
              </div>
              <span className="font-display text-xl font-bold text-gray-900 leading-none">{cue.value}</span>
              <span className="text-[11px] font-semibold text-gray-400 mt-2 uppercase tracking-wider text-center">{cue.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
