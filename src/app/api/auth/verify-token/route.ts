import { NextRequest, NextResponse } from "next/server";
import { verifyEmbedToken } from "@/features/tools/services/tokenService";

/**
 * GET /api/auth/verify-token?token=xyz
 * Seller-facing endpoint to verify embed tokens.
 * Sellers call this from their tool to validate the platform token.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { error: { code: "MISSING_TOKEN", message: "Token parameter is required" } },
      { status: 400 }
    );
  }

  const payload = await verifyEmbedToken(token);

  if (!payload) {
    return NextResponse.json(
      { error: { code: "INVALID_TOKEN", message: "Token is invalid or expired" } },
      { status: 401 }
    );
  }

  return NextResponse.json({
    valid: true,
    userId: payload.userId,
    agentId: payload.agentId,
    plan: payload.plan,
    expiresAt: new Date(payload.exp * 1000).toISOString(),
  });
}
