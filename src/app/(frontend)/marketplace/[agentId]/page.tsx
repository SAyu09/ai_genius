import { db } from "@/backend/db";
import { agents, users } from "@/backend/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/backend/lib/auth";
import { Header } from "@/frontend/components/site/Header";
import { Footer } from "@/frontend/components/site/Footer";
import { Button } from "@/frontend/components/ui/button";
import { Bot, Check, ArrowLeft } from "lucide-react";

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
  const price = agent.price / 100;

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
                  <div className="flex items-center gap-3 mb-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold uppercase tracking-wider">
                      {agent.category || "Tool"}
                    </span>
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
