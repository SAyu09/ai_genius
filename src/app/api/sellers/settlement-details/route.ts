import { NextResponse } from "next/server";
import { withAuth } from "@/backend/lib/api";
import { db } from "@/backend/db";
import { users, sellerProfiles, sellerBankDetails } from "@/backend/db/schema";
import { eq } from "drizzle-orm";
import { encryptData } from "@/backend/lib/crypto";
import { settlementDetailsSchema } from "@/backend/lib/validation";

export const POST = withAuth(async ({ userId, role, req }) => {
  // Only sellers (or admins) can submit settlement details
  if (role !== "seller" && role !== "admin") {
    return NextResponse.json({ error: "Only verified sellers can submit settlement details" }, { status: 403 });
  }

  try {
    const body = await req.json();

    // Zod Validation
    const parsed = settlementDetailsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input data", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const {
      accountHolderName,
      bankName,
      accountNumber,
      ifscCode,
      accountType,
      upiId,
      panNumber,
      gstNumber
    } = parsed.data;

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

    return NextResponse.json({ success: true, message: "Settlement details submitted successfully." });
  } catch (error: any) {
    console.error("Settlement details error:", error);
    // Don't leak error message details to client
    return NextResponse.json(
      { error: "Failed to save settlement details" },
      { status: 500 }
    );
  }
});
