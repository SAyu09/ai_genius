import { auth } from "@/backend/lib/auth";
import { redirect } from "next/navigation";
import { getUserSubscriptions } from "@/features/subscriptions/services/subscriptionService";
import { Header } from "@/frontend/components/site/Header";
import { Footer } from "@/frontend/components/site/Footer";
import { Button } from "@/frontend/components/ui/button";
import { Bot, CreditCard, Calendar, AlertCircle, Sparkles, Receipt } from "lucide-react";
import { SubscriptionBadge } from "@/frontend/components/shared/SubscriptionBadge";
import { CancelSubscriptionButton } from "@/app/(frontend)/(dashboard)/billing/CancelButton";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Billing — Manage Your Subscriptions",
  description: "View and manage your active subscriptions, billing history, and payment details.",
};

export default async function MarketplaceBillingPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth?callbackUrl=/marketplace/billing");

  const subs = await getUserSubscriptions(session.user.id);
  const activeSubs = subs.filter(({ subscription }) => subscription.status === "active");
  const pastSubs = subs.filter(({ subscription }) => subscription.status !== "active");

  // Calculate totals
  const monthlyTotal = activeSubs.reduce((sum, { agent }) => sum + ((agent.monthlyPriceCents || 0) / 100), 0);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-12 pb-20">
        <div className="mx-auto w-[min(900px,92%)]">
          {/* Page header */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Account</span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl">Billing</h1>
            <p className="mt-2 text-muted-foreground">Manage your subscriptions and billing history.</p>
          </div>

          {/* Spending Summary */}
          <div className="grid gap-4 sm:grid-cols-3 mb-10">
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Monthly Spend</span>
                <div className="rounded-lg bg-primary/10 p-2 text-primary"><CreditCard className="h-4 w-4" /></div>
              </div>
              <div className="font-display text-2xl font-bold">${monthlyTotal.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-0.5">{activeSubs.length} active plan{activeSubs.length !== 1 ? "s" : ""}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Tools</span>
                <div className="rounded-lg bg-green-500/10 p-2 text-green-600"><Bot className="h-4 w-4" /></div>
              </div>
              <div className="font-display text-2xl font-bold">{activeSubs.length}</div>
              <p className="text-xs text-muted-foreground mt-0.5">Subscribed agents</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total History</span>
                <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600"><Receipt className="h-4 w-4" /></div>
              </div>
              <div className="font-display text-2xl font-bold">{subs.length}</div>
              <p className="text-xs text-muted-foreground mt-0.5">All time subscriptions</p>
            </div>
          </div>

          <div className="space-y-10">
            {/* Active Subscriptions */}
            <section>
              <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Active Subscriptions
              </h2>
              {activeSubs.length > 0 ? (
                <div className="grid gap-4">
                  {activeSubs.map(({ subscription, agent }) => (
                    <div key={subscription.id} className="rounded-2xl border border-border bg-card overflow-hidden">
                      <div className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
                              <Bot className="h-6 w-6" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{agent.name}</h3>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{agent.description}</p>
                              <div className="flex items-center gap-3 mt-2">
                                <SubscriptionBadge status={subscription.status as "active" | "trial" | "expired" | "cancelled"} />
                                <span className="text-xs text-muted-foreground capitalize">
                                  {subscription.planType} plan
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="font-display text-xl font-bold">${(agent.monthlyPriceCents || 0) / 100}</div>
                            <div className="text-xs text-muted-foreground">/{subscription.planType === "annual" ? "year" : "month"}</div>
                          </div>
                        </div>
                        {subscription.currentPeriodEnd && (
                          <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5" />
                              Next billing: {new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </div>
                            <CancelSubscriptionButton subscriptionId={subscription.id} agentName={agent.name} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-border bg-card/50 p-10 text-center">
                  <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">No active subscriptions.</p>
                  <Button asChild variant="outline" className="rounded-full">
                    <Link href="/marketplace">Browse Marketplace</Link>
                  </Button>
                </div>
              )}
            </section>

            {/* Past Subscriptions */}
            {pastSubs.length > 0 && (
              <section>
                <h2 className="font-display text-xl font-semibold mb-4 text-muted-foreground">Past Subscriptions</h2>
                <div className="grid gap-3">
                  {pastSubs.map(({ subscription, agent }) => (
                    <div key={subscription.id} className="rounded-2xl border border-border bg-card/60 opacity-60 hover:opacity-80 transition">
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-lg bg-muted text-muted-foreground">
                            <Bot className="h-4 w-4" />
                          </div>
                          <div>
                            <h3 className="font-medium text-sm">{agent.name}</h3>
                            <p className="text-xs text-muted-foreground capitalize">{subscription.planType} · Ended {subscription.cancelledAt ? new Date(subscription.cancelledAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <SubscriptionBadge status={subscription.status as "active" | "trial" | "expired" | "cancelled"} />
                          <Button asChild size="sm" variant="ghost" className="rounded-full text-xs text-primary">
                            <Link href={`/marketplace/${agent.id}`}>Resubscribe</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
