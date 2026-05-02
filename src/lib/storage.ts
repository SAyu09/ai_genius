import { createSupabaseAdminClient } from "@/lib/auth";

const BUCKET = "agent-assets";

/**
 * Upload a file to Supabase Storage and return its private path.
 * File is stored in the "agent-assets" bucket (private by default).
 */
export async function uploadAgentAsset(
  file: Buffer,
  filename: string,
  contentType: string,
  sellerId: string
): Promise<string> {
  const supabase = createSupabaseAdminClient();
  const path = `${sellerId}/${Date.now()}-${filename}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType, upsert: false });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  return path;
}

/**
 * Generate a short-lived signed download URL (60 seconds).
 * Only call this after verifying the user has purchased the agent.
 */
export async function getDownloadUrl(assetPath: string): Promise<string> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(assetPath, 60); // 60 second expiry

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to generate download URL: ${error?.message}`);
  }

  return data.signedUrl;
}

/**
 * Generate a short-lived signed upload URL (10 minutes).
 * Sellers use this to upload directly from their browser to Supabase Storage.
 */
export async function getUploadSignedUrl(
  sellerId: string,
  filename: string
): Promise<{ signedUrl: string; path: string }> {
  const supabase = createSupabaseAdminClient();
  const ext = filename.split(".").pop() || "zip";
  const path = `${sellerId}/${Date.now()}.${ext}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) {
    throw new Error(`Failed to generate upload URL: ${error?.message}`);
  }

  return { signedUrl: data.signedUrl, path };
}
