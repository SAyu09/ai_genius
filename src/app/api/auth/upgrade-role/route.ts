import { NextResponse } from "next/server";
import { withAuth } from "@/backend/lib/api";
import { upgradeToSeller } from "@/features/auth/services/authService";
import { cookies } from "next/headers";
import { checkRateLimit, RATE_LIMIT_AUTH } from "@/backend/lib/rateLimit";

export const POST = withAuth(async ({ userId }) => {
  // Rate limiting to prevent abuse
  const rl = await checkRateLimit(`upgrade_role:${userId}`, RATE_LIMIT_AUTH);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const cookieStore = await cookies();
  const intendedRole = cookieStore.get("intended_role")?.value;

  if (intendedRole !== "seller") {
    return NextResponse.json({ error: "No pending seller intent found" }, { status: 400 });
  }

  try {
    await upgradeToSeller(userId);
  } catch (error) {
    console.error("Auto-upgrade error:", error);
    return NextResponse.json({ error: "Upgrade failed" }, { status: 500 });
  }

  // Clear the intended_role cookie
  cookieStore.delete("intended_role");

  return NextResponse.json({ success: true, redirectUrl: "/dashboard/seller" });
});
