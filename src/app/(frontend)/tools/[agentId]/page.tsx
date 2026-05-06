import { db } from "@/backend/db";
import { agents, subscriptions } from "@/backend/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/backend/lib/auth";
import { generateEmbedToken } from "@/features/tools/services/tokenService";
import { ToolEmbed } from "@/frontend/components/shared/ToolEmbed";
import { ToolUnavailable } from "@/frontend/components/shared/ToolUnavailable";
import { Bot, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function ToolAppPage(props: { params: Promise<{ agentId: string }> }) {
  const params = await props.params;
  const agentId = params.agentId;
  const session = await auth();

  if (!session?.user) {
    redirect(`/sign-in?callbackUrl=/tools/${agentId}`);
  }

  const [agent] = await db
    .select()
    .from(agents)
    .where(eq(agents.id, agentId))
    .limit(1);

  if (!agent || agent.status !== "approved") {
    notFound();
  }

  // Verify subscription or ownership (server-side)
  const isSeller = agent.sellerId === session.user.id;
  const isAdmin = session.user.role === "admin";
  let hasAccess = isSeller || isAdmin;
  let planType: "trial" | "monthly" | "annual" = "monthly";

  if (!hasAccess) {
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.buyerId, session.user.id),
          eq(subscriptions.agentId, agentId),
          eq(subscriptions.status, "active")
        )
      )
      .limit(1);

    if (sub) {
      hasAccess = true;
      planType = (sub.planType as "trial" | "monthly" | "annual") || "monthly";
    }
  }

  // Redirect to tool detail if not subscribed (not 403)
  if (!hasAccess) {
    redirect(`/marketplace/${agentId}`);
  }

  // Generate initial token for postMessage handshake
  // Token is 5 minutes, refresh happens client-side every 4 minutes
  let initialToken = "";
  try {
    const { token } = await generateEmbedToken(
      session.user.id,
      agentId,
      planType
    );
    initialToken = token;
  } catch {
    // If PLATFORM_SECRET isn't set, fall back gracefully
    console.error("Failed to generate embed token");
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <header className="flex h-14 items-center justify-between border-b bg-background px-4 z-10 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-muted transition">
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </Link>
          <div className="h-6 w-[1px] bg-border mx-2"></div>
          <div className="flex items-center gap-2 font-semibold">
            <Bot className="h-5 w-5 text-primary" />
            {agent.name}
          </div>
        </div>
        <div className="text-xs font-medium px-2.5 py-1 rounded-md bg-green-500/10 text-green-600">
          Secure Connection Active
        </div>
      </header>

      <main className="flex-1 bg-muted/20 relative">
        {agent.embedUrl ? (
          <ToolEmbed
            embedUrl={agent.embedUrl}
            agentId={agent.id}
            agentName={agent.name}
            initialToken={initialToken}
          />
        ) : (
          <ToolUnavailable agentName={agent.name} />
        )}
      </main>
    </div>
  );
}
