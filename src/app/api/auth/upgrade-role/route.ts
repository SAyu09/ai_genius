import { NextResponse } from "next/server";
import { auth } from "@/backend/lib/auth";
import { upgradeToSeller } from "@/features/auth/services/authService";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.redirect(new URL("/auth", req.url));
  }

  // Check if they came from the seller intent flow (cookie set before Google OAuth)
  try {
    await upgradeToSeller(session.user.id);
  } catch (error) {
    console.error("Auto-upgrade error:", error);
  }

  // Clear the intended_role cookie
  const cookieStore = await cookies();
  cookieStore.delete("intended_role");

  // Redirect them to their new seller dashboard
  return NextResponse.redirect(new URL("/dashboard/seller", req.url));
}
