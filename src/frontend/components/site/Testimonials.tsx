"use client";

import { Star, Quote } from "lucide-react";
import { motion } from "framer-motion";
import {
  staggerContainer,
  staggerItem,
  viewportConfig,
} from "@/frontend/hooks/useAnimations";

const items = [
  { name: "Priya R.", role: "Head of GTM, Northwind", quote: "We replaced an outsourced SDR team with Atlas. Booked meetings doubled in 6 weeks.", rating: 5, avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d" },
  { name: "Marco D.", role: "Founder, Halcyon", quote: "Listing our ops agent on AI Genius brought in $40k MRR in the first quarter.", rating: 5, avatar: "https://i.pravatar.cc/150?u=a04258a2462d826712d" },
  { name: "Yuki T.", role: "CX Lead, Lumen", quote: "Helio handles 72% of our tickets without escalation. Game changer for off-hours.", rating: 5, avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d" },
  { name: "Sara K.", role: "Editor, Inkstone", quote: "Quill writes in our voice better than half our junior staff. Genuinely scary.", rating: 5, avatar: "https://i.pravatar.cc/150?u=a048581f4e29026701d" },
];

export function Testimonials() {
  return (
    <section className="relative py-20 sm:py-28 overflow-hidden" style={{ backgroundColor: "var(--landing-dark-card)" }}>
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Ambient glow */}
      <div
        className="absolute left-1/4 top-0 w-[600px] h-[400px] rounded-full blur-[120px] pointer-events-none"
        style={{
          background: "radial-gradient(circle, hsla(174, 60%, 46%, 0.08) 0%, transparent 70%)",
        }}
      />

      <div className="mx-auto w-[min(1200px,92%)] relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl mb-14"
        >
          <span className="section-tag section-tag-light">Trusted worldwide</span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-white">
            Loved by 80,000+ teams{" "}
            <br className="hidden sm:block" />
            around the world.
          </h2>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          className="grid gap-5 md:grid-cols-2 lg:grid-cols-4"
        >
          {items.map((t) => (
            <motion.figure
              key={t.name}
              variants={staggerItem}
              className="group flex flex-col justify-between rounded-2xl p-7 transition-all duration-400 overflow-hidden"
              style={{
                backgroundColor: "var(--landing-dark-card-surface)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div className="relative z-10">
                {/* Quote icon */}
                <Quote className="h-6 w-6 mb-5 opacity-20 text-white" />
                
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, idx) => (
                    <Star key={idx} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <blockquote className="text-[15px] leading-relaxed text-white/70 font-normal">
                  &quot;{t.quote}&quot;
                </blockquote>
              </div>

              <figcaption className="relative z-10 mt-8 flex items-center gap-3 pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="relative">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-white/10"
                  />
                </div>
                <div>
                  <div className="font-semibold text-sm text-white">{t.name}</div>
                  <div className="text-[12px] text-white/40">{t.role}</div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
