import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/backend/lib/auth";
import { db } from "@/backend/db";
import { agents, purchases } from "@/backend/db/schema";
import { eq, and } from "drizzle-orm";
import { getDownloadUrl } from "@/backend/lib/storage";

type Props = { params: Promise<{ slug: string }> };

export async function GET(req: NextRequest, { params }: Props) {
  const session = await auth();
  const user = session?.user;
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  const [agent] = await db
    .select()
    .from(agents)
    .where(eq(agents.slug, slug))
    .limit(1);

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  // Verify purchase
  const [purchase] = await db
    .select()
    .from(purchases)
    .where(and(eq(purchases.buyerId, user.id!), eq(purchases.agentId, agent.id)))
    .limit(1);

  if (!purchase) {
    return NextResponse.json(
      { error: "You have not purchased this agent" },
      { status: 403 }
    );
  }

  // Generate 60-second signed Supabase Storage URL
  const downloadUrl = await getDownloadUrl(agent.assetKey);

  return NextResponse.json({ downloadUrl });
}
