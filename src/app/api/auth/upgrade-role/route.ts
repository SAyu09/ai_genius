import { NextResponse } from "next/server";
import { auth } from "@/backend/lib/auth";
import { upgradeToSeller } from "@/features/auth/services/authService";

export async function GET(req: Request) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // Check if they came from the seller intent flow
  try {
    await upgradeToSeller(session.user.id);
  } catch (error) {
    console.error("Auto-upgrade error:", error);
  }

  // Redirect them to their new dashboard
  return NextResponse.redirect(new URL("/dashboard/seller", req.url));
}
