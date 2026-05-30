import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 12 bytes is standard for GCM

/**
 * Ensures the secret is exactly 32 bytes for aes-256
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error('ENCRYPTION_SECRET environment variable is missing');
  }
  
  if (secret === '12345678901234567890123456789012' && process.env.NODE_ENV === 'production') {
    throw new Error(
      'CRITICAL SECURITY ERROR: Weak placeholder ENCRYPTION_SECRET detected in production. ' +
      'You MUST rotate this key immediately to protect user PII.'
    );
  }

  // If the secret is a hex string, parse it. Otherwise, assume it's base64 or raw string.
  // We'll create a SHA-256 hash to ensure it's exactly 32 bytes long if we aren't sure.
  return crypto.createHash('sha256').update(String(secret)).digest();
}

/**
 * Encrypts a plain text string using AES-256-GCM.
 * Returns a string in the format "iv:authTag:encryptedData" (all hex encoded)
 */
export function encryptData(plainText: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');
  const ivHex = iv.toString('hex');

  return `${ivHex}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a string that was encrypted by `encryptData`.
 * Expects the format "iv:authTag:encryptedData" (all hex encoded)
 */
export function decryptData(encryptedString: string): string {
  const key = getEncryptionKey();
  const parts = encryptedString.split(':');
  
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted string format. Expected iv:authTag:encryptedData');
  }

  const [ivHex, authTagHex, encryptedDataHex] = parts;

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedDataHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
