import { SignJWT, jwtVerify } from "jose";
import type { EmbedToken } from "@/types/auth.types";

function getSecret(): Uint8Array {
  const secret = process.env.PLATFORM_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "PLATFORM_SECRET must be set and at least 32 characters long"
    );
  }
  return new TextEncoder().encode(secret);
}

/**
 * Generates a short-lived JWT embed token for the tool iframe.
 * Signed with PLATFORM_SECRET, expires in 5 minutes.
 */
export async function generateEmbedToken(
  userId: string,
  agentId: string,
  plan: "trial" | "monthly" | "annual"
): Promise<{ token: string; expiresAt: string }> {
  const secret = getSecret();
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 300; // 5 minutes

  const token = await new SignJWT({
    userId,
    agentId,
    plan,
  } satisfies Omit<EmbedToken, "iat" | "exp">)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(secret);

  return {
    token,
    expiresAt: new Date(exp * 1000).toISOString(),
  };
}

/**
 * Verifies an embed token and returns the payload.
 * Used by seller tools to validate tokens via GET /api/auth/verify-token.
 */
export async function verifyEmbedToken(
  token: string
): Promise<EmbedToken | null> {
  try {
    const secret = getSecret();
    const { payload } = await jwtVerify(token, secret);
    return {
      userId: payload.userId as string,
      agentId: payload.agentId as string,
      plan: payload.plan as "trial" | "monthly" | "annual",
      iat: payload.iat as number,
      exp: payload.exp as number,
    };
  } catch {
    return null;
  }
}
