import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/frontend/components/site/Header";
import { Footer } from "@/frontend/components/site/Footer";
import { Button } from "@/frontend/components/ui/button";
import { Globe, Heart, Rocket, ShieldCheck, Sparkles, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "About",
  description: "We're building the global marketplace for AI agents.",
  openGraph: {
    title: "About, AI Genius",
    description: "We're building the global marketplace for AI agents.",
  },
};

const values = [
  { icon: Heart, t: "Builders first", d: "We obsess over creator economics. Sellers keep 85% of every sale, get fast payouts and own their customer relationships." },
  { icon: ShieldCheck, t: "Trust by default", d: "Every agent is reviewed for safety, security and quality. Buyers can deploy with confidence on day one." },
  { icon: Globe, t: "Truly global", d: "Live in 140+ countries with local payment methods, 60+ currencies and multilingual support baked in." },
  { icon: Rocket, t: "Speed matters", d: "From discovery to deploy in under a minute. No sales calls, no procurement loops, no friction." },
];

const team = [
  { name: "Aarav Mehta", role: "Co founder & CEO", initials: "AM" },
  { name: "Sofia Lindgren", role: "Co founder & CTO", initials: "SL" },
  { name: "Daniel Okafor", role: "Head of Marketplace", initials: "DO" },
  { name: "Mei Tanaka", role: "Head of Trust & Safety", initials: "MT" },
];

const milestones = [
  { y: "2023", t: "Founded", d: "Started as a side project to help indie AI builders find their first paying customers." },
  { y: "2024", t: "Public launch", d: "Opened the marketplace with 120 hand picked agents and processed first $100k in GMV." },
  { y: "2025", t: "Global rollout", d: "Expanded to 140+ countries, 60+ currencies and crossed 2,400 listed agents." },
  { y: "2026", t: "Today", d: "Powering AI workforces for 80,000+ teams and paying out to 4,000+ creators worldwide." },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-12 pb-20 sm:pt-16">
        <section className="mx-auto w-[min(1100px,92%)]">
          <p className="text-xs sm:text-sm uppercase tracking-widest text-muted-foreground">About</p>
          <h1 className="mt-3 font-display text-4xl leading-[1.05] sm:text-6xl lg:text-7xl">
            We believe every team deserves an <span className="text-gradient italic">AI workforce.</span>
          </h1>
          <div className="mt-8 grid gap-6 text-base sm:text-lg text-foreground/85 lg:grid-cols-2">
            <p>
              AI Genius was born out of a simple frustration. The best AI agents were locked inside a few
              corporations or scattered across obscure GitHub repos. They were inaccessible to the people
              who needed them most.
            </p>
            <p className="text-gray-500 leading-relaxed mt-4">
              We are changing that. AI Genius is the worldwide marketplace where 80,000+ teams discover,
              purchase, and instantly deploy intelligent automation, and where 4,000+ creators monetize their work. We handle
              billing, infra and global payouts so builders can focus on building.
            </p>
          </div>
        </section>

        <section className="mx-auto mt-12 w-[min(1100px,92%)] grid gap-4 sm:grid-cols-3">
          {[
            ["2,400+", "Agents listed"],
            ["140+", "Countries"],
            ["$8M+", "Paid to creators"],
          ].map(([n, l]) => (
            <div key={l} className="rounded-3xl border border-border bg-card p-6">
              <div className="font-display text-3xl sm:text-4xl text-gradient">{n}</div>
              <div className="mt-1 text-sm sm:text-base text-muted-foreground">{l}</div>
            </div>
          ))}
        </section>

        {/* Mission */}
        <section className="mx-auto mt-20 w-[min(1100px,92%)]">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Our mission</p>
              <h2 className="mt-2 font-display text-3xl sm:text-5xl">
                Make autonomous software accessible to everyone.
              </h2>
            </div>
            <p className="text-base sm:text-lg text-muted-foreground">
              The next decade of software will be built by autonomous agents working alongside humans. We
              are building the open marketplace that connects the people creating those agents with the
              teams who need them, without gatekeepers and without lock in.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="mx-auto mt-20 w-[min(1200px,92%)]">
          <div className="text-center">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">What we stand for</p>
            <h2 className="mt-2 font-display text-3xl sm:text-5xl">Our values.</h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.t} className="rounded-3xl border border-border bg-card p-6">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary/15 to-primary-glow/15 text-primary">
                  <v.icon className="h-5 w-5" />
                </div>
                <div className="mt-4 font-display text-xl">{v.t}</div>
                <p className="mt-1 text-sm text-muted-foreground">{v.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Story / Timeline */}
        <section className="mx-auto mt-20 w-[min(1100px,92%)]">
          <div className="text-center">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Our story</p>
            <h2 className="mt-2 font-display text-3xl sm:text-5xl">From side project to global platform.</h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {milestones.map((m) => (
              <div key={m.y} className="rounded-3xl border border-border bg-gradient-to-b from-card to-surface p-6">
                <div className="font-display text-3xl text-gradient">{m.y}</div>
                <div className="mt-2 font-display text-lg">{m.t}</div>
                <p className="mt-1 text-sm text-muted-foreground">{m.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Team */}
        <section className="mx-auto mt-20 w-[min(1100px,92%)]">
          <div className="text-center">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">The team</p>
            <h2 className="mt-2 font-display text-3xl sm:text-5xl">A small team, a big mission.</h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((p) => (
              <div key={p.name} className="rounded-3xl border border-border bg-card p-6 text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-primary to-primary-glow font-display text-xl text-primary-foreground">
                  {p.initials}
                </div>
                <div className="mt-4 font-display text-lg">{p.name}</div>
                <div className="text-sm text-muted-foreground">{p.role}</div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
            <Users className="h-4 w-4" /> Plus 38 engineers, designers and creators across 14 countries.
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto mt-20 w-[min(1100px,92%)]">
          <div className="relative overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] border border-border bg-foreground p-8 text-background sm:p-14">
            <div aria-hidden className="absolute -right-24 -top-24 h-80 w-80 rounded-full opacity-40 blur-3xl" style={{ background: "var(--gradient-primary)" }} />
            <div className="relative grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-background/10 px-3 py-1 text-xs text-background/80">
                  <Sparkles className="h-3.5 w-3.5" /> Headquartered everywhere. Built worldwide.
                </div>
                <h2 className="mt-4 font-display text-3xl sm:text-5xl">Come build the AI economy with us.</h2>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Link href="/sell"><Button size="lg" className="w-full rounded-full bg-background text-foreground hover:bg-background/90">Start selling</Button></Link>
                <Link href="/marketplace"><Button size="lg" variant="ghost" className="w-full rounded-full text-background hover:bg-background/10">Browse agents</Button></Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
