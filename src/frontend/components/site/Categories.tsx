"use client";

import { Send, LifeBuoy, Compass, Feather, Blocks, PieChart, Workflow, Wand2 } from "lucide-react";
import { motion } from "framer-motion";

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

export function Categories() {
  return (
    <section id="categories" className="py-24 bg-surface">
      <div className="mx-auto w-[min(1200px,92%)]">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-primary">Browse Categories</p>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl font-semibold text-foreground">Explore by capability</h2>
          </div>
          <a className="hidden text-[15px] font-semibold text-primary hover:text-primary-glow transition-colors sm:inline-flex items-center gap-1" href="#">
            View all categories <span aria-hidden>→</span>
          </a>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {cats.map((c, i) => (
            <motion.a
              key={c.name}
              href="#"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              whileHover={{ y: -4 }}
              className="group relative flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-[var(--shadow-float)] hover:border-primary/20"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50/50 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <c.icon className="h-5 w-5 stroke-[1.5]" />
                </div>
                <div className="text-xs font-medium text-slate-400 group-hover:text-primary/70 transition-colors">
                  {c.count} agents
                </div>
              </div>
              
              <div className="mt-auto">
                <div className="text-[17px] font-semibold text-foreground group-hover:text-primary transition-colors">{c.name}</div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
