import Link from "next/link";
import { Button } from "@/frontend/components/ui/button";
import { ArrowUpRight } from "lucide-react";

export function SellCTA() {
  return (
    <section id="sell" className="py-16 sm:py-20">
      <div className="mx-auto w-[min(1200px,92%)]">
        <div className="relative overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] border border-border bg-foreground text-background p-8 sm:p-16">
          <div
            aria-hidden
            className="absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full opacity-40 blur-3xl"
            style={{ background: "var(--gradient-primary)" }}
          />
          <div className="relative grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
            <div>
              <p className="text-xs sm:text-sm uppercase tracking-widest text-background/60">For builders</p>
              <h2 className="mt-3 font-display text-3xl sm:text-5xl lg:text-6xl">
                Turn your AI agent into <span className="text-gradient">global revenue.</span>
              </h2>
              <p className="mt-5 max-w-xl text-sm sm:text-base text-background/70">
                List once. Reach 80,000+ teams worldwide. We handle billing, distribution,
                infra and payouts in 60+ currencies. You keep 85% of every sale.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link href="/sell">
                <Button size="lg" className="w-full rounded-full bg-background text-foreground hover:bg-background/90">
                  Become a seller <ArrowUpRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/sell">
                <Button size="lg" variant="ghost" className="w-full rounded-full text-background hover:bg-background/10">
                  Read seller guide
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
