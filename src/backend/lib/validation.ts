import { z } from "zod";
import { NextRequest } from "next/server";

// ═══════════════════════════════════════════════════════════════
// URL / SSRF Validation
// ═══════════════════════════════════════════════════════════════

/** Private/reserved IPv4 CIDR ranges that MUST be blocked */
const BLOCKED_IP_PATTERNS = [
  /^127\./,             // loopback
  /^10\./,              // RFC 1918
  /^172\.(1[6-9]|2\d|3[01])\./,  // RFC 1918
  /^192\.168\./,        // RFC 1918
  /^169\.254\./,        // link-local / AWS metadata
  /^0\./,               // current network
  /^100\.(6[4-9]|[7-9]\d|1[0-2]\d)\./,  // shared address space
  /^198\.18\./,         // benchmark testing
];

const BLOCKED_HOSTNAMES = [
  "localhost",
  "metadata.google.internal",
  "metadata.google",
  "169.254.169.254",
  "[::1]",
  "0.0.0.0",
];

/**
 * Validates that a URL is safe to send server-side requests to.
 * Blocks SSRF vectors: private IPs, localhost, metadata endpoints, non-HTTPS.
 */
export function isValidPublicUrl(url: string): { valid: boolean; reason?: string } {
  try {
    const parsed = new URL(url);

    // Must be HTTPS
    if (parsed.protocol !== "https:") {
      return { valid: false, reason: "URL must use HTTPS" };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Block known dangerous hostnames
    if (BLOCKED_HOSTNAMES.includes(hostname)) {
      return { valid: false, reason: "URL points to a blocked hostname" };
    }

    // Block IPs in private ranges
    for (const pattern of BLOCKED_IP_PATTERNS) {
      if (pattern.test(hostname)) {
        return { valid: false, reason: "URL points to a private/reserved IP range" };
      }
    }

    // Block IPv6 addresses (wrapped in brackets)
    if (hostname.startsWith("[")) {
      return { valid: false, reason: "IPv6 addresses are not allowed" };
    }

    // Block bare IPs (any remaining numeric-only hostnames)
    if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      return { valid: false, reason: "Direct IP addresses are not allowed. Use a domain name." };
    }

    // Max URL length
    if (url.length > 2048) {
      return { valid: false, reason: "URL is too long (max 2048 characters)" };
    }

    return { valid: true };
  } catch {
    return { valid: false, reason: "Invalid URL format" };
  }
}

// ═══════════════════════════════════════════════════════════════
// Zod Schemas
// ═══════════════════════════════════════════════════════════════

/** Agent creation/update */
export const agentCreateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be at most 100 characters"),
  tag: z.string().min(1, "Tag is required").max(50),
  description: z.string().min(10, "Description must be at least 10 characters").max(500, "Description must be at most 500 characters"),
  longDesc: z.string().min(1, "Long description is required").max(10000, "Long description is too long"),
  category: z.string().max(50).optional().nullable(),
  monthlyPrice: z.union([z.string(), z.number()]).optional().nullable(),
  annualPrice: z.union([z.string(), z.number()]).optional().nullable(),
  pricingModel: z.enum(["subscription", "one_time", "usage_based", "tiered_subscription", "outcome_based"]).default("subscription"),
  type: z.enum(["hosted", "workflow"]).default("hosted"),
  agentType: z.enum(["chat", "form", "workflow"]).default("chat"),
  assetKey: z.string().max(500).optional().default(""),
  endpointUrl: z.string().max(2048).optional().nullable(),
  features: z.array(z.string().max(200)).max(20).optional().default([]),
  integrations: z.array(z.string().max(200)).max(20).optional().default([]),
  useCases: z.array(z.string().max(200)).max(20).optional().default([]),
});

/** Settlement details (bank info) */
export const settlementDetailsSchema = z.object({
  accountHolderName: z.string().min(2).max(100),
  bankName: z.string().min(2).max(100),
  accountNumber: z.string().min(5).max(30),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code format"),
  accountType: z.enum(["savings", "current"]),
  upiId: z.string().max(50).optional().nullable(),
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN number format"),
  gstNumber: z.string().max(20).optional().nullable(),
});

/** File upload */
const ALLOWED_UPLOAD_EXTENSIONS = [".json", ".zip", ".tar.gz", ".gz"];

export const uploadSchema = z.object({
  filename: z.string()
    .min(1, "Filename is required")
    .max(255, "Filename too long")
    .refine((name) => {
      const lower = name.toLowerCase();
      return ALLOWED_UPLOAD_EXTENSIONS.some(ext => lower.endsWith(ext));
    }, `Allowed extensions: ${ALLOWED_UPLOAD_EXTENSIONS.join(", ")}`),
});

/** Password with complexity requirements */
export const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

/** Registration */
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").max(255),
  password: passwordSchema,
  role: z.enum(["buyer", "seller"]),
});

// ═══════════════════════════════════════════════════════════════
// CSRF Helpers
// ═══════════════════════════════════════════════════════════════

/**
 * Validates Origin/Referer headers to prevent CSRF on state-mutating requests.
 * Returns true if the request is from an allowed origin.
 */
export function isValidOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const host = req.headers.get("host");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const allowedOrigins = [new URL(appUrl).origin];

  // Also allow Stripe webhook callbacks (they won't have origin headers)
  // API routes called without origin/referer should still work for programmatic access
  if (!origin && !referer) {
    // Programmatic / server-to-server — allow but check other auth
    return true;
  }

  // Allow strict same-origin requests (e.g. accessing via local IP 192.168.* during dev)
  if (host && origin && (origin === `http://${host}` || origin === `https://${host}`)) {
    return true;
  }

  if (origin && allowedOrigins.includes(origin)) return true;

  if (referer) {
    try {
      const refOrigin = new URL(referer).origin;
      if (allowedOrigins.includes(refOrigin)) return true;
    } catch {
      return false;
    }
  }

  return false;
}
