import { NextResponse } from "next/server";
import { db } from "@/backend/db";
import { users, sellerProfiles } from "@/backend/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { registerSchema } from "@/backend/lib/validation";
import { checkRateLimit, RATE_LIMIT_AUTH } from "@/backend/lib/rateLimit";

export async function POST(req: Request) {
  try {
    // Basic IP-based rate limiting for registration
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const rl = await checkRateLimit(`register:${ip}`, RATE_LIMIT_AUTH);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many registration attempts. Try again later." }, { status: 429 });
    }

    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password, role } = parsed.data;

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
      columns: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in instead." },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email: email.toLowerCase(),
        passwordHash,
        role,
        isFirstLogin: true,
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
      });

    // If seller, also create seller profile
    if (role === "seller") {
      await db.insert(sellerProfiles).values({
        userId: newUser.id,
        settlementStatus: "pending_details",
      });
    }

    return NextResponse.json(
      { message: "Account created successfully", user: newUser },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
