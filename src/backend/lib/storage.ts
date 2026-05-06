import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  endpoint: process.env.AWS_ENDPOINT, // For Supabase S3 compatibility
  forcePathStyle: true,
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME || "agents";

export async function getDownloadUrl(key: string) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn: 60 });
}

export async function getUploadSignedUrl(userId: string, filename: string) {
  const path = `${userId}/${Date.now()}-${filename}`;
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: path,
  });

  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  return { signedUrl, path };
}
