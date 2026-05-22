"use client";

import { Star } from "lucide-react";
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
    <section className="py-12 sm:py-16 bg-white">
      <div className="mx-auto w-[min(1200px,92%)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl text-center mx-auto mb-10"
        >
          <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">Loved worldwide</p>
          <h2 className="mt-3 font-[family-name:var(--font-inter)] text-4xl sm:text-5xl font-semibold text-gray-900 tracking-tight">
            Trusted by 80,000+ teams.
          </h2>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
        >
          {items.map((t, i) => (
            <motion.figure
              key={t.name}
              variants={staggerItem}
              whileHover={{ y: -4 }}
              className="group flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-7 transition-all duration-300 hover:border-indigo-100 hover:shadow-xl shadow-sm overflow-hidden"
            >
              <div className="relative z-10">
                {/* Decorative quote mark */}
                <div className="text-[48px] leading-none font-serif text-indigo-100 mb-2 select-none">&ldquo;</div>
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, idx) => (
                    <Star key={idx} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <blockquote className="text-[15px] leading-relaxed text-gray-700 font-medium">
                  &quot;{t.quote}&quot;
                </blockquote>
              </div>

              <figcaption className="relative z-10 mt-8 flex items-center gap-3 border-t border-gray-100 pt-5">
                <div className="relative">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-indigo-50"
                  />
                </div>
                <div>
                  <div className="font-semibold text-sm text-gray-900">{t.name}</div>
                  <div className="text-[13px] text-gray-500">{t.role}</div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
