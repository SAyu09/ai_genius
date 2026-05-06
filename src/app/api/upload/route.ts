import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/backend/lib/auth";
import { getUploadSignedUrl } from "@/backend/lib/storage";

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user;
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = user.role;
  if (role !== "seller" && role !== "admin") {
    return NextResponse.json({ error: "Only sellers can upload" }, { status: 403 });
  }

  const { filename } = await req.json();
  if (!filename) {
    return NextResponse.json({ error: "filename is required" }, { status: 400 });
  }

  const { signedUrl, path } = await getUploadSignedUrl(user.id!, filename);

  return NextResponse.json({ uploadUrl: signedUrl, path });
}
