import Link from "next/link";
import { Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { agents } from "@/data/agents";

export function FeaturedAgents() {
  const featured = agents.slice(0, 6);
  return (
    <section id="marketplace" className="py-20">
      <div className="mx-auto w-[min(1200px,92%)]">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-sm uppercase tracking-widest text-muted-foreground">Featured</p>
            <h2 className="mt-2 font-display text-4xl sm:text-5xl">Top agents this week</h2>
          </div>
          <Link href="/marketplace" className="hidden sm:inline-flex">
            <Button variant="outline" className="rounded-full">View marketplace</Button>
          </Link>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((a) => (
            <Link
              key={a.slug}
              href={`/agents/${a.slug}`}
              className="group relative flex flex-col rounded-3xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:shadow-[var(--shadow-card)]"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                  <Zap className="h-3 w-3 text-primary" /> {a.tag}
                </span>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="h-3.5 w-3.5 fill-primary text-primary" /> {a.rating}
                  <span className="opacity-50">· {a.sales}</span>
                </div>
              </div>
              <h3 className="mt-4 font-display text-2xl">{a.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">by {a.author}</p>
              <p className="mt-3 text-sm leading-relaxed text-foreground/80">{a.desc}</p>
              <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                <div>
                  <span className="font-display text-2xl">${a.price}</span>
                  <span className="text-sm text-muted-foreground">/mo</span>
                </div>
                <Button size="sm" className="rounded-full">View →</Button>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
