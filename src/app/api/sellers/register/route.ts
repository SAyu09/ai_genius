import { NextResponse } from "next/server";
import { auth } from "@/backend/lib/auth";
import { upgradeToSeller } from "@/features/auth/services/authService";

/**
 * POST /api/sellers/register
 * Upgrades the authenticated user's role from 'buyer' to 'seller'.
 * Does NOT collect bank details — that's handled by /api/sellers/settlement-details.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    );
  }

  try {
    const result = await upgradeToSeller(session.user.id);

    if (result.alreadySeller) {
      return NextResponse.json(
        { error: { code: "ALREADY_SELLER", message: "Account is already a seller" } },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true, role: "seller" });
  } catch (error) {
    console.error("Seller registration error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to upgrade account" } },
      { status: 500 }
    );
  }
}
