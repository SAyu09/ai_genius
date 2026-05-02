import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db"; // Assuming this is set up, or just use supabase
import { agents } from "@/db/schema"; // If using Drizzle

// We can just use the Supabase client to insert directly to avoid Drizzle config issues
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Ensure user is a seller
  if (user.user_metadata?.role !== "seller") {
    return NextResponse.json({ error: "Must be a seller to list an agent" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, tag, description, longDesc, price, features, useCases } = body;

    // Create a slug from the name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    // Insert into Supabase
    // To use postgres directly without Drizzle:
    const { data, error } = await supabase.from('agents').insert([
      {
        seller_id: user.id, // Ensure user id is valid uuid
        slug,
        name,
        tag,
        description,
        long_desc: longDesc,
        price: Number(price), // Stored in cents
        features: features.split(',').map((f: string) => f.trim()),
        use_cases: useCases.split(',').map((u: string) => u.trim()),
        asset_key: `agents/${slug}.zip`,
        is_approved: false // Requires approval
      }
    ]).select();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, agent: data[0] });
  } catch (error: any) {
    console.error("Listing error:", error);
    return NextResponse.json({ error: error.message || "Failed to list agent" }, { status: 500 });
  }
}
