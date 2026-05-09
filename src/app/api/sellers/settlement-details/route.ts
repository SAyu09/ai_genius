import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/backend/lib/auth";
import { db } from "@/backend/db";
import { users, sellerProfiles, sellerBankDetails } from "@/backend/db/schema";
import { eq } from "drizzle-orm";
import { encryptData } from "@/backend/lib/crypto";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();

    const {
      accountHolderName,
      bankName,
      accountNumber,
      ifscCode,
      accountType,
      upiId,
      panNumber,
      gstNumber
    } = body;

    // Validation
    if (!accountHolderName || !bankName || !accountNumber || !ifscCode || !accountType || !panNumber) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(ifscCode)) {
      return NextResponse.json({ error: "Invalid IFSC code format" }, { status: 400 });
    }

    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(panNumber)) {
      return NextResponse.json({ error: "Invalid PAN number format" }, { status: 400 });
    }

    // Encrypt sensitive fields
    const accountNumberEncrypted = encryptData(accountNumber);
    const panNumberEncrypted = encryptData(panNumber);
    const upiIdEncrypted = upiId ? encryptData(upiId) : null;

    // Check if seller profile exists
    const [profile] = await db.select().from(sellerProfiles).where(eq(sellerProfiles.userId, userId)).limit(1);
    
    // Upsert logic for bank details
    const [existingBankDetails] = await db.select().from(sellerBankDetails).where(eq(sellerBankDetails.sellerId, userId)).limit(1);

    if (existingBankDetails) {
      await db.update(sellerBankDetails).set({
        accountHolderName,
        bankName,
        accountNumberEncrypted,
        ifscCode,
        accountType,
        upiIdEncrypted,
        panNumberEncrypted,
        gstNumber,
        isVerified: false,
        updatedAt: new Date()
      }).where(eq(sellerBankDetails.sellerId, userId));
    } else {
      await db.insert(sellerBankDetails).values({
        sellerId: userId,
        accountHolderName,
        bankName,
        accountNumberEncrypted,
        ifscCode,
        accountType,
        upiIdEncrypted,
        panNumberEncrypted,
        gstNumber,
        isVerified: false,
      });
    }

    // Update seller profile status
    if (profile) {
      await db.update(sellerProfiles).set({
        settlementStatus: "pending_verification"
      }).where(eq(sellerProfiles.userId, userId));
    } else {
      // Create if it doesn't exist
      await db.insert(sellerProfiles).values({
        userId,
        settlementStatus: "pending_verification"
      });
    }

    // Ensure user role is seller
    await db.update(users).set({ role: "seller" }).where(eq(users.id, userId));

    return NextResponse.json({ success: true, message: "Settlement details submitted successfully." });
  } catch (error: any) {
    console.error("Settlement details error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save settlement details" },
      { status: 500 }
    );
  }
}
