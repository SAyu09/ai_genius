import { Star } from "lucide-react";

const items = [
  { name: "Priya R.", role: "Head of GTM, Northwind", quote: "We replaced an outsourced SDR team with Atlas. Booked meetings doubled in 6 weeks.", rating: 5 },
  { name: "Marco D.", role: "Founder, Halcyon", quote: "Listing our ops agent on SellGetAI brought in $40k MRR in the first quarter.", rating: 5 },
  { name: "Yuki T.", role: "CX Lead, Lumen", quote: "Helio handles 72% of our tickets without escalation. Game changer for off-hours.", rating: 5 },
  { name: "Sara K.", role: "Editor, Inkstone", quote: "Quill writes in our voice better than half our junior staff. Genuinely scary.", rating: 5 },
];

export function Testimonials() {
  return (
    <section className="py-20">
      <div className="mx-auto w-[min(1200px,92%)]">
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-widest text-muted-foreground">Loved worldwide</p>
          <h2 className="mt-2 font-display text-4xl sm:text-5xl">Trusted by 80,000+ teams.</h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {items.map((t) => (
            <figure key={t.name} className="rounded-3xl border border-border bg-card p-6">
              <div className="flex gap-0.5 text-primary">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary" />
                ))}
              </div>
              <blockquote className="mt-4 text-sm leading-relaxed text-foreground/85">&quot;{t.quote}&quot;</blockquote>
              <figcaption className="mt-4 text-sm">
                <div className="font-medium">{t.name}</div>
                <div className="text-muted-foreground">{t.role}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
