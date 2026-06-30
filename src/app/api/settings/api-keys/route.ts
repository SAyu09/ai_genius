import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/backend/lib/auth";
import { db } from "@/backend/db";
import { apiKeys } from "@/backend/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { generateApiKey } from "@/backend/lib/apiKeys";
import { z } from "zod";

// ═══════════════════════════════════════════════════════════════
// Validation
// ═══════════════════════════════════════════════════════════════

const createKeySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters"),
});

const deleteKeySchema = z.object({
  keyId: z.string().uuid("Invalid key ID"),
});

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

/** Enforce session-only auth. API key management must NOT be accessible via API key. */
async function requireSession(): Promise<
  { userId: string } | NextResponse
> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized — session required" }, { status: 401 });
  }
  return { userId: session.user.id };
}

// ═══════════════════════════════════════════════════════════════
// GET /api/settings/api-keys — List all keys for the current user
// ═══════════════════════════════════════════════════════════════

export async function GET() {
  const result = await requireSession();
  if (result instanceof NextResponse) return result;
  const { userId } = result;

  const keys = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      prefix: apiKeys.prefix,
      lastUsedAt: apiKeys.lastUsedAt,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.userId, userId))
    .orderBy(desc(apiKeys.createdAt));

  return NextResponse.json({ keys });
}

// ═══════════════════════════════════════════════════════════════
// POST /api/settings/api-keys — Create a new API key
// ═══════════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  const result = await requireSession();
  if (result instanceof NextResponse) return result;
  const { userId } = result;

  // Parse & validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createKeySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation error" },
      { status: 400 }
    );
  }

  const { name } = parsed.data;

  // Generate key material
  const { rawKey, keyHash, prefix } = generateApiKey();

  // Persist (only the hash — never the raw key)
  const [inserted] = await db
    .insert(apiKeys)
    .values({
      userId,
      keyHash,
      prefix,
      name,
    })
    .returning({
      id: apiKeys.id,
      name: apiKeys.name,
      prefix: apiKeys.prefix,
      createdAt: apiKeys.createdAt,
    });

  // Return the raw key exactly ONCE — the user must copy it now
  return NextResponse.json(
    {
      key: {
        ...inserted,
        rawKey, // ⚠️ Only time the raw key is ever exposed
      },
    },
    { status: 201 }
  );
}

// ═══════════════════════════════════════════════════════════════
// DELETE /api/settings/api-keys — Revoke an API key
// ═══════════════════════════════════════════════════════════════

export async function DELETE(req: NextRequest) {
  const result = await requireSession();
  if (result instanceof NextResponse) return result;
  const { userId } = result;

  // Parse & validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = deleteKeySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation error" },
      { status: 400 }
    );
  }

  const { keyId } = parsed.data;

  // Delete only if the key belongs to this user (prevents horizontal privilege escalation)
  const deleted = await db
    .delete(apiKeys)
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)))
    .returning({ id: apiKeys.id });

  if (deleted.length === 0) {
    return NextResponse.json({ error: "API key not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
