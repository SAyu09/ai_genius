import type { DefaultSession } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";

/** User roles in the platform */
export type UserRole = "buyer" | "seller" | "admin";

// ─────────────────────────────────────────────────────────────
// NextAuth module augmentation — eliminates all `as any` casts
// ─────────────────────────────────────────────────────────────
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: UserRole;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: UserRole;
  }
}

// ─────────────────────────────────────────────────────────────
// Embed token payload (signed with PLATFORM_SECRET)
// ─────────────────────────────────────────────────────────────
export interface EmbedToken {
  userId: string;
  agentId: string;
  plan: "trial" | "monthly" | "annual";
  iat: number;
  exp: number; // iat + 300 (5 minutes)
}

// ─────────────────────────────────────────────────────────────
// API error response shape (consistent across all APIs)
// ─────────────────────────────────────────────────────────────
export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

// ─────────────────────────────────────────────────────────────
// Subscription types
// ─────────────────────────────────────────────────────────────
export type PlanType = "monthly" | "annual" | "trial" | "one_time";
export type SubscriptionStatus = "active" | "cancelled" | "expired" | "trial";

// ─────────────────────────────────────────────────────────────
// Agent status types
// ─────────────────────────────────────────────────────────────
export type AgentStatus =
  | "pending"
  | "testing"
  | "pending_review"
  | "approved"
  | "rejected_performance"
  | "rejected_admin"
  | "suspended";
