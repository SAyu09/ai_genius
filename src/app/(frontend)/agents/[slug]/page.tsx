import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/frontend/components/site/Header";
import { Footer } from "@/frontend/components/site/Footer";
import { Button } from "@/frontend/components/ui/button";
import { ArrowLeft, Check, Star, Zap, Shield, Plug, Sparkles } from "lucide-react";
import { getAgent, agents } from "@/frontend/data/agents";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const agent = getAgent(slug);
  if (!agent) return {};
  return {
    title: agent.name,
    description: agent.desc,
    openGraph: {
      title: `${agent.name}, AI Genius`,
      description: agent.desc,
    },
  };
}

export function generateStaticParams() {
  return agents.map((a) => ({ slug: a.slug }));
}

export default async function AgentDetail({ params }: Props) {
  const { slug } = await params;
  const agent = getAgent(slug);
  if (!agent) notFound();

  const related = agents.filter((a) => a.slug !== agent.slug && a.tag === agent.tag).slice(0, 3);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-12">
        <div className="mx-auto w-[min(1200px,92%)]">
          <Link href="/marketplace" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to marketplace
          </Link>

          <div className="mt-8 grid gap-12 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                  <Zap className="h-3 w-3 text-primary" /> {agent.tag}
                </span>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="h-3.5 w-3.5 fill-primary text-primary" /> {agent.rating}
                  <span className="opacity-60">({agent.reviews.toLocaleString()} reviews)</span>
                  <span className="opacity-40">· {agent.sales} deploys</span>
                </div>
              </div>
              <h1 className="mt-4 font-display text-5xl sm:text-6xl">{agent.name}</h1>
              <p className="mt-2 text-muted-foreground">by <span className="text-foreground">{agent.author}</span></p>
              <p className="mt-6 text-lg text-foreground/85">{agent.long}</p>

              <div className="mt-10">
                <h2 className="font-display text-2xl">What it does</h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {agent.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 rounded-xl border border-border bg-card p-4 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-10">
                <h2 className="font-display text-2xl">Integrations</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {agent.integrations.map((i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm">
                      <Plug className="h-3.5 w-3.5 text-primary" /> {i}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-10">
                <h2 className="font-display text-2xl">Common use cases</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {agent.useCases.map((u) => (
                    <div key={u} className="rounded-2xl border border-border bg-card p-5">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <div className="mt-3 text-sm font-medium">{u}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-10 rounded-3xl border border-border bg-card p-8">
                <h2 className="font-display text-2xl">About the seller</h2>
                <div className="mt-4 flex items-start gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-primary to-primary-glow text-primary-foreground font-display text-xl">
                    {agent.author[0]}
                  </div>
                  <div>
                    <div className="font-medium">{agent.author}</div>
                    <p className="mt-1 text-sm text-muted-foreground">{agent.authorBio}</p>
                  </div>
                </div>
              </div>
            </div>

            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-5xl">${agent.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Cancel any time. 7-day free trial.</p>

                <Button className="mt-6 w-full rounded-full" size="lg">Deploy agent →</Button>
                <Button variant="outline" className="mt-2 w-full rounded-full" size="lg">Try free for 7 days</Button>

                <div className="mt-6 space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Shield className="h-4 w-4 text-primary" /> Vetted &amp; security reviewed
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Plug className="h-4 w-4 text-primary" /> {agent.integrations.length} native integrations
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Zap className="h-4 w-4 text-primary" /> One-click deploy
                  </div>
                </div>
              </div>
            </aside>
          </div>

          {related.length > 0 && (
            <div className="mt-20 pb-20">
              <h2 className="font-display text-3xl">More in {agent.tag}</h2>
              <div className="mt-6 grid gap-5 md:grid-cols-3">
                {related.map((a) => (
                  <Link
                    key={a.slug}
                    href={`/agents/${a.slug}`}
                    className="group rounded-3xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:shadow-[var(--shadow-card)]"
                  >
                    <h3 className="font-display text-2xl">{a.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">by {a.author}</p>
                    <p className="mt-3 text-sm text-foreground/80">{a.desc}</p>
                    <div className="mt-4 font-display text-xl">${a.price}<span className="text-sm text-muted-foreground">/mo</span></div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
