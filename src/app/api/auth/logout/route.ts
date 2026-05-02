import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/auth";

/**
 * POST /api/auth/logout
 * Signs out the current user and clears session cookies.
 */
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return NextResponse.json({ message: "Signed out" });
}
