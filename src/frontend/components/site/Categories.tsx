"use client";

import { Send, LifeBuoy, Compass, Feather, Blocks, PieChart, Workflow, Wand2 } from "lucide-react";
import { motion } from "framer-motion";
import { useRef, useState, useCallback } from "react";
import {
  staggerContainer,
  staggerItem,
  viewportConfig,
} from "@/frontend/hooks/useAnimations";

const cats = [
  { icon: Send, name: "Sales & Outreach", count: 312 },
  { icon: LifeBuoy, name: "Customer Support", count: 248 },
  { icon: Compass, name: "Research", count: 197 },
  { icon: Feather, name: "Content & Marketing", count: 421 },
  { icon: Blocks, name: "Developer Tools", count: 188 },
  { icon: PieChart, name: "Analytics", count: 134 },
  { icon: Workflow, name: "Operations", count: 156 },
  { icon: Wand2, name: "Personal Assistants", count: 289 },
];

/* ─── Card with mouse-follow glow border ─────────── */
function CategoryCard({ icon: Icon, name, count, index }: {
  icon: React.ElementType;
  name: string;
  count: number;
  index: number;
}) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const [glowPos, setGlowPos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    setGlowPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  return (
    <motion.a
      ref={cardRef}
      href="#"
      variants={staggerItem}
      whileHover={{ y: -4 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex flex-col rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:border-indigo-100 overflow-hidden"
      style={{
        boxShadow: isHovered
          ? "0 10px 40px -10px rgba(99,102,241,0.2), 0 4px 6px -4px rgba(99,102,241,0.1)"
          : "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      {/* Mouse-follow glow effect */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(250px circle at ${glowPos.x}px ${glowPos.y}px, rgba(99,102,241,0.05), transparent 60%)`,
        }}
      />

      <div className="relative z-10 flex items-center justify-between mb-8">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-50 text-indigo-600 transition-all duration-300 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-[0_4px_12px_rgba(99,102,241,0.3)]">
          <Icon className="h-5 w-5 stroke-[1.5]" />
        </div>
        <div className="text-xs font-medium text-gray-400 group-hover:text-indigo-500/70 transition-colors duration-300">
          {count} agents
        </div>
      </div>

      <div className="relative z-10 mt-auto">
        <div className="text-[17px] font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors duration-300">
          {name}
        </div>
      </div>
    </motion.a>
  );
}

export function Categories() {
  return (
    <section id="categories" className="py-12 sm:py-16 bg-gray-50/50">
      <div className="mx-auto w-[min(1200px,92%)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-end justify-between gap-6"
        >
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">Browse Categories</p>
            <h2 className="mt-3 font-[family-name:var(--font-inter)] text-4xl sm:text-5xl font-semibold text-gray-900 tracking-tight">
              Explore by capability
            </h2>
          </div>
          <a className="hidden text-[15px] font-semibold text-indigo-600 hover:text-indigo-700 transition-colors sm:inline-flex items-center gap-1" href="#">
            View all categories <span aria-hidden>→</span>
          </a>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {cats.map((c, i) => (
            <CategoryCard key={c.name} {...c} index={i} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
