"use client";

import { Star } from "lucide-react";
import { motion } from "framer-motion";

const items = [
  { name: "Priya R.", role: "Head of GTM, Northwind", quote: "We replaced an outsourced SDR team with Atlas. Booked meetings doubled in 6 weeks.", rating: 5, avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d" },
  { name: "Marco D.", role: "Founder, Halcyon", quote: "Listing our ops agent on SellGetAI brought in $40k MRR in the first quarter.", rating: 5, avatar: "https://i.pravatar.cc/150?u=a04258a2462d826712d" },
  { name: "Yuki T.", role: "CX Lead, Lumen", quote: "Helio handles 72% of our tickets without escalation. Game changer for off-hours.", rating: 5, avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d" },
  { name: "Sara K.", role: "Editor, Inkstone", quote: "Quill writes in our voice better than half our junior staff. Genuinely scary.", rating: 5, avatar: "https://i.pravatar.cc/150?u=a048581f4e29026701d" },
];

export function Testimonials() {
  return (
    <section className="py-24 bg-white">
      <div className="mx-auto w-[min(1200px,92%)]">
        <div className="max-w-2xl text-center mx-auto mb-16">
          <p className="text-sm font-bold uppercase tracking-widest text-primary">Loved worldwide</p>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl font-semibold text-foreground">Trusted by 80,000+ teams.</h2>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {items.map((t, i) => (
            <motion.figure 
              key={t.name} 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex flex-col justify-between rounded-3xl border border-gray-100 bg-white p-7 shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-float)]"
            >
              <div>
                <div className="flex gap-1 mb-5">
                  {Array.from({ length: t.rating }).map((_, idx) => (
                    <Star key={idx} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <blockquote className="text-[15px] leading-relaxed text-slate-700 font-medium">
                  &quot;{t.quote}&quot;
                </blockquote>
              </div>
              
              <figcaption className="mt-8 flex items-center gap-3 border-t border-gray-100 pt-5">
                <img src={t.avatar} alt={t.name} className="h-10 w-10 rounded-full object-cover shadow-sm" />
                <div>
                  <div className="font-semibold text-sm text-slate-900">{t.name}</div>
                  <div className="text-[13px] text-slate-500">{t.role}</div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
