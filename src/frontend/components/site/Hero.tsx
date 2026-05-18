"use client";

import Link from "next/link";
import { Button } from "@/frontend/components/ui/button";
import { ArrowRight, Search, TrendingUp, LifeBuoy, PieChart, Feather } from "lucide-react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useRef, useEffect, useState } from "react";

type Chip = {
  name: string;
  role: string;
  icon: React.ComponentType<{ className?: string }>;
  className: string;
  delay: number;
};

const chips: Chip[] = [
  { name: "Atlas SDR", role: "Sales · live", icon: TrendingUp, className: "left-[10%] top-[20%] xl:left-[15%]", delay: 0 },
  { name: "Helio Support", role: "Support · live", icon: LifeBuoy, className: "right-[10%] top-[25%] xl:right-[15%]", delay: 1.5 },
  { name: "Pulse", role: "Analytics · live", icon: PieChart, className: "left-[15%] bottom-[25%] xl:left-[20%]", delay: 3 },
  { name: "Quill", role: "Content · live", icon: Feather, className: "right-[15%] bottom-[20%] xl:right-[20%]", delay: 4.5 },
];

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <section ref={containerRef} className="relative overflow-hidden pt-20 pb-24 sm:pt-32 sm:pb-36 bg-white min-h-[90vh] flex items-center justify-center">
      {/* Background Grid */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      {/* Floating Cards */}
      {chips.map((c) => (
        <div
          key={c.name}
          className={`absolute z-10 hidden lg:flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 shadow-md animate-float w-44 ${c.className}`}
          style={{ animationDelay: `${c.delay}s` }}
        >
          <div className="grid h-5 w-5 place-items-center text-primary">
            <c.icon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-medium text-foreground">{c.name}</div>
            <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {c.role}
            </div>
          </div>
        </div>
      ))}

      <div className="relative z-10 mx-auto w-full max-w-[720px] text-center px-4">
        {/* Announcement Bar */}
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
          Live in 140+ countries
        </div>

        {/* Headline */}
        <h1 className="mt-8 font-display text-5xl leading-tight tracking-tight sm:text-[48px] text-gray-900 font-bold">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both delay-0">Buy, sell & deploy</div>
          <div className="text-primary italic animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both delay-100">intelligent agents</div>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both delay-200">from anywhere.</div>
        </h1>

        <p className="mx-auto mt-5 max-w-[480px] text-lg leading-relaxed text-gray-500 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both delay-[300ms]">
          AI Genius is the worldwide marketplace where builders monetize AI agents and teams discover ready to run automation.
        </p>

        {/* CTA Group */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both delay-[400ms]">
          <Link href="/marketplace">
            <Button size="xl" className="rounded-md">
              Browse marketplace <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/sell">
            <Button size="xl" variant="outline" className="rounded-md border-border bg-white text-gray-700">
              List your agent
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="mx-auto mt-12 max-w-[480px] relative animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both delay-[500ms]">
          <div className="relative flex items-center h-[52px] rounded-xl border-2 border-gray-200 bg-white transition-all focus-within:border-primary focus-within:shadow-focus overflow-hidden">
            <Search className="ml-4 h-4 w-4 text-gray-400 shrink-0" />
            <input
              placeholder="Search 2,400+ agents..."
              className="flex-1 bg-transparent px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400"
            />
            <div className="absolute right-1.5">
              <Link href="/marketplace">
                <Button className="h-9 px-4 rounded-lg bg-primary hover:bg-primary-glow font-medium text-white shadow-none text-sm">
                  Search
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
