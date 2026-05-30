import { NextResponse } from "next/server";
import { withSeller } from "@/backend/lib/api";
import { getUploadSignedUrl } from "@/backend/lib/storage";
import { uploadSchema } from "@/backend/lib/validation";

export const POST = withSeller(async ({ userId, req }) => {
  const body = await req.json();
  const parsed = uploadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid filename", details: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { filename } = parsed.data;
  const { signedUrl, path } = await getUploadSignedUrl(userId, filename);

  return NextResponse.json({ uploadUrl: signedUrl, path });
});
