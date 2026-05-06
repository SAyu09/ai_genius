import { auth } from "@/backend/lib/auth";
import { redirect } from "next/navigation";
import { getUserSubscriptions } from "@/features/subscriptions/services/subscriptionService";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Bot, CreditCard, Calendar, AlertCircle } from "lucide-react";
import { SubscriptionBadge } from "@/frontend/components/shared/SubscriptionBadge";
import { CancelSubscriptionButton } from "./CancelButton";

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in?callbackUrl=/billing");

  const subs = await getUserSubscriptions(session.user.id);
  const activeSubs = subs.filter(({ subscription }) => subscription.status === "active");
  const pastSubs = subs.filter(({ subscription }) => subscription.status !== "active");

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Billing & Subscriptions</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your active subscriptions and billing history.</p>
      </div>

      <div className="space-y-8">
        {/* Active Subscriptions */}
        <section>
          <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Active Subscriptions
          </h2>
          {activeSubs.length > 0 ? (
            <div className="grid gap-4">
              {activeSubs.map(({ subscription, agent }) => (
                <Card key={subscription.id} className="rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                          <Bot className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{agent.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{agent.description}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <SubscriptionBadge status={subscription.status as "active" | "trial" | "expired" | "cancelled"} />
                            <span className="text-xs text-muted-foreground capitalize">
                              {subscription.planType} plan
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">${agent.price / 100}</div>
                        <div className="text-xs text-muted-foreground">/{subscription.planType === "annual" ? "year" : "month"}</div>
                      </div>
                    </div>
                    {subscription.currentPeriodEnd && (
                      <div className="mt-4 pt-4 border-t flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          Next billing: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                        </div>
                        <CancelSubscriptionButton subscriptionId={subscription.id} agentName={agent.name} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="rounded-2xl border-dashed bg-transparent">
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No active subscriptions. Browse the marketplace to find AI tools.</p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Past Subscriptions */}
        {pastSubs.length > 0 && (
          <section>
            <h2 className="font-display text-xl font-semibold mb-4">Past Subscriptions</h2>
            <div className="grid gap-3">
              {pastSubs.map(({ subscription, agent }) => (
                <Card key={subscription.id} className="rounded-2xl opacity-60">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-muted text-muted-foreground">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">{agent.name}</h3>
                        <p className="text-xs text-muted-foreground capitalize">{subscription.planType}</p>
                      </div>
                    </div>
                    <SubscriptionBadge status={subscription.status as "active" | "trial" | "expired" | "cancelled"} />
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
