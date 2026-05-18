import { NextResponse } from "next/server";
import { withAdmin } from "@/backend/lib/api";
import { db } from "@/backend/db";
import { agents } from "@/backend/db/schema";
import { eq } from "drizzle-orm";

export const POST = withAdmin(async ({ req }) => {
  const url = new URL(req.url);
  const parts = url.pathname.split("/");
  const agentId = parts[parts.indexOf("agents") + 1];

  await db.update(agents).set({
    status: "approved",
    suspendedAt: null,
    suspensionReason: null,
    suspensionNote: null,
    updatedAt: new Date(),
  }).where(eq(agents.id, agentId));

  return NextResponse.json({ ok: true });
});
