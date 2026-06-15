import { auth } from "@/backend/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/backend/db";
import { subscriptions, agents, users } from "@/backend/db/schema";
import { eq } from "drizzle-orm";
import { Header } from "@/frontend/components/site/Header";
import { Footer } from "@/frontend/components/site/Footer";
import { Button } from "@/frontend/components/ui/button";
import { Bot, Play, Star, Search, Sparkles, Zap } from "lucide-react";
import { SubscriptionBadge } from "@/frontend/components/shared/SubscriptionBadge";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Agents — Your Active AI Tools",
  description: "Access and manage your purchased AI agents and active subscriptions.",
};

export default async function MyAgentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth?callbackUrl=/marketplace/my-agents");

  // Fetch user's active subscriptions with agent details
  const userSubs = await db
    .select({ sub: subscriptions, agent: agents, seller: users })
    .from(subscriptions)
    .innerJoin(agents, eq(subscriptions.agentId, agents.id))
    .innerJoin(users, eq(agents.sellerId, users.id))
    .where(eq(subscriptions.buyerId, session.user.id));

  const activeSubs = userSubs.filter(({ sub }) => sub.status === "active" || sub.status === "trial");
  const expiredSubs = userSubs.filter(({ sub }) => sub.status !== "active" && sub.status !== "trial");

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-32 pb-20">
        <div className="mx-auto w-[min(1200px,92%)]">
          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Your Workspace</span>
              </div>
              <h1 className="font-display text-4xl sm:text-5xl">My Agents</h1>
              <p className="mt-2 text-muted-foreground">Launch and manage your subscribed AI agents.</p>
            </div>
            <Button asChild className="rounded-full gap-2 shadow-lg shadow-primary/20 self-start sm:self-auto">
              <Link href="/marketplace">
                <Search className="h-4 w-4" /> Explore More
              </Link>
            </Button>
          </div>

          {/* Active Agents Grid */}
          {activeSubs.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {activeSubs.map(({ sub, agent, seller }) => (
                <div
                  key={sub.id}
                  className="group relative flex flex-col rounded-3xl border border-border bg-card/80 backdrop-blur-md overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/20"
                >
                  {/* Top gradient bar with glow effect on hover */}
                  <div className="h-1.5 w-full bg-gradient-to-r from-primary to-primary-glow transition-all duration-300 group-hover:h-2 group-hover:opacity-100 opacity-90" />
                  
                  {/* Background radial gradient reveal on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  <div className="p-6 flex flex-col flex-1 relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary shadow-inner group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                        <Bot className="h-6 w-6" />
                      </div>
                      <SubscriptionBadge status={sub.status as "active" | "trial" | "expired" | "cancelled"} />
                    </div>

                    <h3 className="font-display text-xl font-semibold group-hover:text-primary transition-colors">{agent.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">by <span className="font-medium text-foreground/80">{seller.name}</span></p>
                    <p className="mt-3 text-sm text-foreground/70 line-clamp-2 flex-1 leading-relaxed">{agent.description}</p>

                    <div className="flex items-center gap-3 mt-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-md border border-border/50">
                        <Star className="h-3 w-3 fill-primary text-primary" /> {agent.avgRating || "New"}
                      </span>
                      <span className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-md border border-border/50">
                        <Zap className="h-3 w-3 text-primary" /> {agent.tag || "Tool"}
                      </span>
                      <span className="capitalize bg-muted/50 px-2 py-1 rounded-md border border-border/50">{sub.planType} plan</span>
                    </div>

                    <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                      <div>
                        <span className="font-display text-lg font-bold bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">${(agent.monthlyPriceCents || 0) / 100}</span>
                        <span className="text-xs text-muted-foreground font-medium">/mo</span>
                      </div>
                      <Button asChild className="rounded-full gap-2 transition-all duration-300 shadow-md group-hover:shadow-primary/25 group-hover:bg-primary hover:scale-105">
                        <Link href={`/tools/${agent.id}`}>
                          <Play className="h-3.5 w-3.5" /> Launch
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[400px] rounded-3xl border-2 border-dashed border-border bg-card/50 p-12 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary mb-6">
                <Bot className="h-8 w-8" />
              </div>
              <h2 className="font-display text-2xl font-semibold mb-2">No active agents yet</h2>
              <p className="text-muted-foreground text-sm max-w-md mb-8">
                You haven&apos;t subscribed to any AI agents yet. Browse the marketplace to discover powerful tools that can accelerate your workflow.
              </p>
              <Button asChild size="lg" className="rounded-full gap-2 shadow-lg shadow-primary/20">
                <Link href="/marketplace">
                  <Search className="h-4 w-4" /> Explore Marketplace
                </Link>
              </Button>
            </div>
          )}

          {/* Expired/Cancelled Subscriptions */}
          {expiredSubs.length > 0 && (
            <section className="mt-16">
              <h2 className="font-display text-xl font-semibold mb-4 text-muted-foreground">Past Subscriptions</h2>
              <div className="grid gap-3">
                {expiredSubs.map(({ sub, agent, seller }) => (
                  <div key={sub.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card/60 p-4 opacity-60 hover:opacity-80 transition">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-muted text-muted-foreground flex-shrink-0">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold truncate">{agent.name}</h3>
                      <p className="text-xs text-muted-foreground">by {seller.name} · {sub.planType}</p>
                    </div>
                    <SubscriptionBadge status={sub.status as "active" | "trial" | "expired" | "cancelled"} />
                    <Button asChild size="sm" variant="outline" className="rounded-full text-xs">
                      <Link href={`/marketplace/${agent.id}`}>Resubscribe</Link>
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
