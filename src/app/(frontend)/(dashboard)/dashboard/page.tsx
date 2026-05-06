import { auth } from "@/backend/lib/auth";
import { db } from "@/backend/db";
import { subscriptions, agents, users } from "@/backend/db/schema";
import { eq } from "drizzle-orm";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Bot, Search, Play, Star, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CategoryGrid } from "@/frontend/components/shared/CategoryGrid";
import { SubscriptionBadge } from "@/frontend/components/shared/SubscriptionBadge";
import { markFirstLoginComplete } from "@/features/auth/services/authService";

export default async function BuyerDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  // Check isFirstLogin flag
  const [dbUser] = await db
    .select({ isFirstLogin: users.isFirstLogin })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  const isFirstLogin = dbUser?.isFirstLogin ?? false;

  // Mark first login as complete (non-blocking)
  if (isFirstLogin) {
    markFirstLoginComplete(session.user.id).catch(console.error);
  }

  // Fetch buyer's active subscriptions
  const userSubs = await db.select({
    sub: subscriptions,
    agent: agents,
  })
  .from(subscriptions)
  .innerJoin(agents, eq(subscriptions.agentId, agents.id))
  .where(eq(subscriptions.buyerId, session.user.id));

  // Fetch some featured/recommended agents for the buyer to explore
  const recommended = await db.query.agents.findMany({
    where: (agents, { eq }) => eq(agents.status, "approved"),
    limit: 4,
    orderBy: (agents, { desc }) => [desc(agents.salesCount)],
  });

  return (
    <div className="p-6 lg:p-8">
      {/* Welcome Banner (first login only) */}
      {isFirstLogin && (
        <div className="mb-8 rounded-3xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/10 p-8 relative overflow-hidden">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">Welcome to AI Genius</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl">
              Hello, {session.user.name?.split(" ")[0] || "there"}! 👋
            </h2>
            <p className="mt-2 text-muted-foreground max-w-lg">
              Discover AI tools built by top creators worldwide. Browse categories below or explore the full marketplace.
            </p>
            <Button asChild className="mt-4 rounded-xl gap-2">
              <Link href="/marketplace">
                Explore Marketplace <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      )}

      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">My Tools</h1>
          <p className="text-muted-foreground text-sm">Access your subscribed AI agents and applications.</p>
        </div>
        <Button asChild className="rounded-xl gap-2 shadow-lg shadow-primary/20 hidden sm:flex">
          <Link href="/marketplace">
            <Search className="h-4 w-4" /> Explore Marketplace
          </Link>
        </Button>
      </div>

      <div className="space-y-12">
        {/* Active Subscriptions Section */}
        <section>
          <h2 className="font-display text-xl font-semibold mb-4">Active Subscriptions</h2>
          {userSubs.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {userSubs.map(({ sub, agent }) => (
                <Card key={sub.id} className="rounded-2xl border border-primary/10 shadow-sm overflow-hidden flex flex-col">
                  <div className="p-4 bg-primary/5 border-b border-primary/10 flex items-center justify-between">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-white shadow-sm text-primary">
                      <Bot className="h-5 w-5" />
                    </div>
                    <SubscriptionBadge status={sub.status as "active" | "trial" | "expired" | "cancelled"} />
                  </div>
                  <CardHeader className="pt-4 pb-2">
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                    <p className="text-xs text-muted-foreground truncate">{agent.description}</p>
                  </CardHeader>
                  <CardContent className="mt-auto pt-4 border-t border-border/50">
                    <Button asChild className="w-full gap-2 rounded-xl">
                      <Link href={`/tools/${agent.id}`}>
                        <Play className="h-4 w-4" /> Launch App
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="rounded-3xl border-dashed border-2 bg-transparent shadow-none min-h-[250px] flex items-center justify-center">
              <div className="text-center p-8">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary mb-4">
                  <Bot className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold">No active tools</h3>
                <p className="text-muted-foreground text-sm max-w-[280px] mx-auto mt-2">
                  You haven't subscribed to any AI agents yet. Explore the marketplace to find tools that accelerate your workflow.
                </p>
                <Button asChild className="mt-6 rounded-xl">
                  <Link href="/marketplace">Browse Marketplace</Link>
                </Button>
              </div>
            </Card>
          )}
        </section>

        {/* Explore by Category */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold">Explore by Category</h2>
            <Link href="/marketplace" className="text-sm text-primary hover:underline font-medium">View all</Link>
          </div>
          <CategoryGrid />
        </section>

        {/* Recommended Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold">Recommended for you</h2>
            <Link href="/marketplace" className="text-sm text-primary hover:underline font-medium">View all</Link>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {recommended.map((agent) => (
              <Link href={`/marketplace/${agent.id}`} key={agent.id}>
                <Card className="rounded-2xl h-full border-transparent hover:border-primary/20 hover:shadow-md transition-all cursor-pointer bg-background">
                  <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-muted text-muted-foreground">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div className="flex items-center gap-1 text-xs font-medium">
                      <Star className="h-3 w-3 fill-primary text-primary" />
                      {agent.avgRating || "New"}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <h3 className="font-bold text-sm truncate">{agent.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{agent.description}</p>
                    <div className="mt-4 font-semibold text-sm">
                      ${agent.price / 100} <span className="text-xs font-normal text-muted-foreground">/mo</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
