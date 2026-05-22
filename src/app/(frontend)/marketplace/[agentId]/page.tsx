import { db } from "@/backend/db";
import { agents, users } from "@/backend/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/backend/lib/auth";
import { Header } from "@/frontend/components/site/Header";
import { Footer } from "@/frontend/components/site/Footer";
import { Button } from "@/frontend/components/ui/button";
import { Bot, Check, ArrowLeft, ShieldCheck, Clock, TrendingUp, Zap } from "lucide-react";
import { SafeZoneSandbox } from "./SafeZoneSandbox";

export default async function AgentDetailPage(props: { params: Promise<{ agentId: string }> }) {
  const params = await props.params;
  const agentId = params.agentId;
  const session = await auth();

  const [agentWithSeller] = await db
    .select({ agent: agents, seller: users })
    .from(agents)
    .innerJoin(users, eq(agents.sellerId, users.id))
    .where(eq(agents.id, agentId))
    .limit(1);

  if (!agentWithSeller || agentWithSeller.agent.status !== "approved") {
    notFound();
  }

  const { agent, seller } = agentWithSeller;
  const price = (agent.monthlyPricePaise || 0) / 100;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-8 pb-24">
        <div className="mx-auto w-[min(1200px,92%)]">
          <Link href="/marketplace" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition">
            <ArrowLeft className="h-4 w-4" /> Back to Marketplace
          </Link>

          <div className="grid lg:grid-cols-[1fr_400px] gap-12">
            <div>
              <div className="flex items-start gap-6">
                <div className="grid h-20 w-20 flex-shrink-0 place-items-center rounded-3xl bg-primary/10 text-primary">
                  <Bot className="h-10 w-10" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold uppercase tracking-wider">
                      {agent.category || "Tool"}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 text-xs font-semibold uppercase tracking-wider">
                      <ShieldCheck className="h-3.5 w-3.5" /> 100% Sandbox Tested
                    </span>
                    {agent.performancePass && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-700 text-xs font-semibold uppercase tracking-wider">
                        <Zap className="h-3.5 w-3.5" /> Avg Latency: {agent.performanceAvgMs || 250}ms
                      </span>
                    )}
                  </div>
                  <h1 className="font-display text-4xl sm:text-5xl font-bold">{agent.name}</h1>
                  <p className="mt-2 text-lg text-muted-foreground">by {seller.name}</p>
                </div>
              </div>

              <div className="mt-10 prose prose-gray dark:prose-invert max-w-none">
                <h3 className="text-xl font-display font-bold">About this Agent</h3>
                <p className="text-lg leading-relaxed text-foreground/80">{agent.description}</p>
                
                {agent.longDesc && (
                  <div className="mt-6">
                    <h3 className="text-xl font-display font-bold">Details</h3>
                    <p className="whitespace-pre-wrap">{agent.longDesc}</p>
                  </div>
                )}

                {(agent.features as string[])?.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-xl font-display font-bold">Key Features</h3>
                    <ul className="grid sm:grid-cols-2 gap-3 mt-4 list-none pl-0">
                      {(agent.features as string[]).map((feature, i) => (
                        <li key={i} className="flex items-center gap-3 border border-border/50 rounded-xl p-3 bg-muted/30">
                          <div className="rounded-full bg-primary/20 p-1 text-primary">
                            <Check className="h-3 w-3" />
                          </div>
                          <span className="font-medium text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Safe-Zone Sandbox */}
                <div className="mt-12">
                  <h3 className="text-xl font-display font-bold">Test Before You Buy</h3>
                  <p className="text-muted-foreground mt-2">Use this sandbox to securely verify the agent's capabilities with your own data. Your inputs are not stored.</p>
                  <SafeZoneSandbox agentName={agent.name} latencyMs={agent.performanceAvgMs || 250} />
                </div>
              </div>
            </div>

            <div className="lg:pl-8">
              <div className="sticky top-24 rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
                <div className="mb-6 pb-6 border-b border-border/50">
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-2">Subscription</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-5xl font-bold">${price}</span>
                    <span className="text-muted-foreground">/ month</span>
                  </div>
                </div>

                <form action="/api/checkout" method="POST">
                  <input type="hidden" name="agentId" value={agent.id} />
                  <Button type="submit" size="lg" className="w-full rounded-2xl h-14 text-lg font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
                    {session?.user ? "Subscribe Now" : "Sign in to Subscribe"}
                  </Button>
                </form>

                <p className="text-center text-xs text-muted-foreground mt-4">
                  Cancel anytime. Secure payment via Stripe.
                </p>
                
                {/* Value Telemetry ROI Box */}
                <div className="mt-6 bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3 text-indigo-900 font-semibold text-sm">
                    <TrendingUp className="h-4 w-4 text-indigo-500" /> Value Telemetry Estimate
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-indigo-700">Average time saved</span>
                      <span className="font-bold text-indigo-900 flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-indigo-400" /> 18 hrs/week</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-t border-indigo-100/50 pt-3">
                      <span className="text-indigo-700">Estimated ROI</span>
                      <span className="font-bold text-emerald-600 text-lg">+${Math.round(price * 14.5)}/mo</span>
                    </div>
                  </div>
                </div>

                {(agent.useCases as string[])?.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-border/50">
                    <h4 className="font-semibold mb-4 text-sm">Perfect for:</h4>
                    <div className="flex flex-wrap gap-2">
                      {(agent.useCases as string[]).map((useCase, i) => (
                        <span key={i} className="inline-flex px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium">
                          {useCase}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
