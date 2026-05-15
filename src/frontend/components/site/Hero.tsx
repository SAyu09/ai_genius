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
  yOffset: number;
  xOffset: number;
};

const chips: Chip[] = [
  { name: "Atlas SDR", role: "Sales · live", icon: TrendingUp, className: "left-[5%] top-[10%] sm:left-[8%] sm:top-[15%]", delay: 0.1, yOffset: -20, xOffset: -10 },
  { name: "Helio Support", role: "Support · live", icon: LifeBuoy, className: "right-[5%] top-[20%] sm:right-[8%] sm:top-[25%]", delay: 0.2, yOffset: -30, xOffset: 15 },
  { name: "Pulse", role: "Analytics · live", icon: PieChart, className: "left-[8%] bottom-[15%] sm:left-[12%] sm:bottom-[20%]", delay: 0.3, yOffset: 20, xOffset: -20 },
  { name: "Quill", role: "Content · live", icon: Feather, className: "right-[8%] bottom-[10%] sm:right-[12%] sm:bottom-[15%]", delay: 0.4, yOffset: 30, xOffset: 10 },
];

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      const x = (clientX / innerWidth - 0.5) * 20;
      const y = (clientY / innerHeight - 0.5) * 20;
      setMousePosition({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const springConfig = { damping: 25, stiffness: 150 };
  const mouseX = useSpring(mousePosition.x, springConfig);
  const mouseY = useSpring(mousePosition.y, springConfig);

  return (
    <section ref={containerRef} className="relative overflow-hidden pt-16 pb-24 sm:pt-28 sm:pb-36 bg-background">
      {/* Background gradients for light mode depth */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,color-mix(in_oklab,var(--primary)_8%,transparent),transparent)]" />
      
      {chips.map((c, i) => (
        <motion.div
          key={c.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: c.delay, ease: [0.16, 1, 0.3, 1] }}
          style={{
            x: useTransform(mouseX, (v) => v * (c.xOffset / 10)),
            y: useTransform(mouseY, (v) => v * (c.yOffset / 10)),
          }}
          className={`absolute z-10 hidden lg:flex items-center gap-3 rounded-full border border-gray-200/60 bg-white/80 px-4 py-2.5 shadow-[var(--shadow-float)] backdrop-blur-md transition-shadow hover:shadow-[var(--shadow-glow)] ${c.className}`}
        >
          <div className="grid h-10 w-10 place-items-center rounded-full bg-blue-50 text-primary">
            <c.icon className="h-4 w-4" />
          </div>
          <div className="pr-2">
            <div className="text-[13px] font-semibold tracking-tight text-foreground">{c.name}</div>
            <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {c.role}
            </div>
          </div>
        </motion.div>
      ))}

      <div className="relative mx-auto w-[min(1100px,92%)] text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-[11px] sm:text-xs font-medium text-slate-600 shadow-sm"
        >
          <span className="h-2 w-2 rounded-full bg-primary" />
          The global marketplace for AI agents · live in 140+ countries
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-8 font-display text-5xl leading-[1.05] tracking-tight sm:text-7xl lg:text-[88px] text-foreground"
        >
          Buy, sell &amp; deploy
          <br />
          <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent italic pr-2">intelligent agents</span>
          <br />
          from anywhere.
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-[15px] leading-relaxed text-slate-500 sm:mt-8 sm:text-[19px]"
        >
          SellGetAI is the worldwide marketplace where builders monetize AI agents and teams
          discover ready to run automation.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mx-auto mt-10 flex max-w-[500px] items-center gap-2 rounded-full border border-gray-200 bg-white p-2 shadow-[var(--shadow-soft)] transition-shadow focus-within:shadow-[var(--shadow-glow)] focus-within:border-primary/30"
        >
          <Search className="ml-4 h-5 w-5 text-slate-400 shrink-0" />
          <input
            placeholder="Search 2,400+ agents..."
            className="flex-1 min-w-0 bg-transparent px-2 py-3 text-[15px] outline-none placeholder:text-slate-400 text-slate-800"
          />
          <Link href="/marketplace">
            <Button className="rounded-full px-6 py-6 font-semibold bg-primary text-white hover:bg-blue-700 shadow-[var(--shadow-inner-btn)] hover:scale-[1.02] transition-all duration-200 active:scale-95">
              Search
            </Button>
          </Link>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm"
        >
          <Link href="/marketplace">
            <Button size="lg" className="rounded-full bg-slate-900 px-7 py-6 text-[15px] font-semibold text-white hover:bg-slate-800 shadow-md transition-all hover:-translate-y-0.5">
              Browse marketplace <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/sell">
            <Button size="lg" variant="ghost" className="rounded-full px-7 py-6 text-[15px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors">
              List your agent
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
