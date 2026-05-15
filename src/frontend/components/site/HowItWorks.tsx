"use client";

import { motion } from "framer-motion";

const steps = [
  { n: "1", title: "Discover", text: "Browse thousands of vetted AI agents across every category and use case." },
  { n: "2", title: "Download", text: "Instant source-code delivery. Download the agent, blueprints, and integrations." },
  { n: "3", title: "Deploy Anywhere", text: "Bring your own cloud. Deploy locally or to your preferred infrastructure." },
];

export function HowItWorks() {
  return (
    <section id="how" className="py-24 bg-surface">
      <div className="mx-auto w-[min(1200px,92%)]">
        <div className="max-w-2xl text-center mx-auto mb-16">
          <p className="text-sm font-bold uppercase tracking-widest text-primary">How it works</p>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl font-semibold text-foreground">From discovery to downloaded in minutes.</h2>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div 
              key={s.n} 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="group relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-10 shadow-sm transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-float)] hover:border-primary/20"
            >
              {/* Oversized background number */}
              <div className="absolute -right-4 -top-8 font-display text-[160px] font-bold leading-none text-blue-50/60 transition-transform duration-500 group-hover:scale-110 pointer-events-none select-none">
                0{s.n}
              </div>
              
              <div className="relative z-10">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-glow text-xl font-bold text-white shadow-md">
                  {s.n}
                </div>
                <h3 className="font-display text-2xl font-semibold text-slate-900">{s.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-slate-500 max-w-[90%]">{s.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
