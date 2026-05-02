import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Search, Bot, MessageSquare, LineChart, Sparkles, Zap } from "lucide-react";

type Chip = {
  name: string;
  role: string;
  icon: React.ComponentType<{ className?: string }>;
  className: string;
};

const chips: Chip[] = [
  { name: "Atlas SDR", role: "Sales · live", icon: Bot, className: "left-[3%] top-[6%] sm:left-[4%] sm:top-[8%]" },
  { name: "Helio Support", role: "Support · live", icon: MessageSquare, className: "right-[3%] top-[14%] sm:right-[4%] sm:top-[16%]" },
  { name: "Pulse", role: "Analytics · live", icon: LineChart, className: "left-[4%] bottom-[8%] sm:left-[6%] sm:bottom-[10%]" },
  { name: "Quill", role: "Content · live", icon: Sparkles, className: "right-[4%] bottom-[10%] sm:right-[6%] sm:bottom-[12%]" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-32">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(to right, color-mix(in oklab, var(--foreground) 5%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--foreground) 5%, transparent) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 40%, transparent 75%)",
        }}
      />

      {chips.map((c) => (
        <div
          key={c.name}
          className={`absolute z-10 hidden lg:flex items-center gap-3 rounded-2xl border border-border bg-card/90 px-3.5 py-2.5 shadow-[var(--shadow-card)] backdrop-blur ${c.className}`}
        >
          <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground">
            <c.icon className="h-4 w-4" />
          </div>
          <div className="pr-1">
            <div className="text-sm font-semibold leading-tight text-foreground">{c.name}</div>
            <div className="text-[11px] text-muted-foreground">{c.role}</div>
          </div>
          <Zap className="h-3.5 w-3.5 text-primary" />
        </div>
      ))}

      <div className="relative mx-auto w-[min(1100px,92%)] text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1.5 text-[11px] sm:text-xs text-muted-foreground backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          The global marketplace for AI agents · live in 140+ countries
        </div>

        <h1 className="mt-6 font-display text-[36px] leading-[1.05] tracking-tight sm:text-6xl lg:text-[88px]">
          Buy, sell &amp; deploy
          <br />
          <span className="text-gradient italic">intelligent agents</span>
          <br />
          from anywhere.
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-sm text-muted-foreground sm:mt-7 sm:text-lg">
          SellGetAI is the worldwide marketplace where builders monetize AI agents and teams
          discover ready to run automation.
        </p>

        <div className="mx-auto mt-7 flex max-w-2xl items-center gap-2 rounded-full border border-border bg-card p-1.5 sm:p-2 shadow-[var(--shadow-card)]">
          <Search className="ml-2 sm:ml-3 h-4 w-4 text-muted-foreground shrink-0" />
          <input
            placeholder="Search 2,400+ agents..."
            className="flex-1 min-w-0 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
          />
          <Link href="/marketplace">
            <Button size="sm" className="rounded-full px-4 sm:px-5">Search</Button>
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
          <Link href="/marketplace">
            <Button size="lg" className="rounded-full bg-foreground px-6 text-background hover:bg-foreground/90">
              Browse marketplace <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/sell">
            <Button size="lg" variant="ghost" className="rounded-full">
              List your agent
            </Button>
          </Link>
        </div>

        <div className="mx-auto mt-12 grid max-w-xl grid-cols-3 gap-4 sm:gap-6 text-sm">
          {[
            ["2,400+", "Agents listed"],
            ["140+", "Countries"],
            ["$8M+", "Paid to creators"],
          ].map(([n, l]) => (
            <div key={l}>
              <div className="font-display text-2xl text-foreground sm:text-4xl">{n}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
