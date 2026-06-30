import {
  pgTable,
  text,
  timestamp,
  integer,
  uuid,
  boolean,
  primaryKey,
  real,
  uniqueIndex,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// ─────────────────────────────────────────────────────────────
// 1. NEXTAUTH TABLES
// ─────────────────────────────────────────────────────────────
export const accounts = pgTable(
  "account",
  {
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] })
  ]
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

// ─────────────────────────────────────────────────────────────
// 1b. API KEYS — Bearer-token auth for headless / B2B access
// ─────────────────────────────────────────────────────────────
export const apiKeys = pgTable("api_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  keyHash: text("key_hash").notNull(),           // SHA-256 hex digest — raw key is NEVER stored
  prefix: text("prefix").notNull(),               // e.g. "aig_live_a1b2c3d4" (for UI display)
  name: text("name").notNull(),                   // e.g. "Production Key"
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
}));

// ─────────────────────────────────────────────────────────────
// 2. USERS — Buyers, Sellers, Admins
// ─────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  passwordHash: text("password_hash"), // null for OAuth users
  image: text("image"),
  avatarUrl: text("avatar_url"),
  role: text("role", { enum: ["buyer", "seller", "admin"] })
    .default("buyer")
    .notNull(),

  stripeCustomerId: text("stripe_customer_id"), // for buyers
  stripeOnboarded: boolean("stripe_onboarded").default(false),
  
  isFirstLogin: boolean("is_first_login").default(true),
  lastLoginAt: timestamp("last_login_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  listedAgents: many(agents),
  purchases: many(purchases),
  subscriptions: many(subscriptions),
  reviews: many(reviews),
  apiKeys: many(apiKeys),
  sellerProfile: one(sellerProfiles, {
    fields: [users.id],
    references: [sellerProfiles.userId],
  }),
  sellerBankDetails: one(sellerBankDetails, {
    fields: [users.id],
    references: [sellerBankDetails.sellerId],
  }),
  sellerSettlements: many(sellerSettlements),
}));

export const sellerProfiles = pgTable("seller_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  businessName: text("business_name"),
  gamificationTier: text("gamification_tier", { enum: ["Novice Creator", "Verified Builder", "Elite Architect"] }).default("Novice Creator").notNull(),
  settlementStatus: text("settlement_status", { enum: ["pending_details", "pending_verification", "verified"] }).default("pending_details"),
  tosAcceptedAt: timestamp("tos_accepted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sellerBankDetails = pgTable("seller_bank_details", {
  id: uuid("id").primaryKey().defaultRandom(),
  sellerId: uuid("seller_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  accountHolderName: text("account_holder_name").notNull(),
  bankName: text("bank_name").notNull(),
  accountNumberEncrypted: text("account_number_encrypted").notNull(),
  ifscCode: text("ifsc_code").notNull(),
  accountType: text("account_type", { enum: ["savings", "current"] }).default("savings").notNull(),
  upiIdEncrypted: text("upi_id_encrypted"),
  panNumberEncrypted: text("pan_number_encrypted").notNull(),
  gstNumber: text("gst_number"),
  isVerified: boolean("is_verified").default(false),
  verifiedAt: timestamp("verified_at"),
  verifiedBy: uuid("verified_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sellerSettlements = pgTable("seller_settlements", {
  id: uuid("id").primaryKey().defaultRandom(),
  sellerId: uuid("seller_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  periodStart: timestamp("period_start", { mode: "date" }).notNull(),
  periodEnd: timestamp("period_end", { mode: "date" }).notNull(),
  grossPayoutCents: integer("gross_payout_cents").notNull(),
  tdsDeductedCents: integer("tds_deducted_cents").default(0).notNull(),
  refundDeductionsCents: integer("refund_deductions_cents").default(0).notNull(),
  netPayoutCents: integer("net_payout_cents").notNull(),
  bankReferenceNumber: text("bank_reference_number"),
  status: text("status", { enum: ["processing", "completed", "failed"] }).default("processing").notNull(),
  failureReason: text("failure_reason"),
  initiatedBy: uuid("initiated_by").references(() => users.id),
  settledAt: timestamp("settled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────
// 3. AGENTS — The digital assets sellers upload
// ─────────────────────────────────────────────────────────────
export const agents = pgTable("agents", {
  id: uuid("id").primaryKey().defaultRandom(),
  sellerId: uuid("seller_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  type: text("type", { enum: ["hosted", "workflow"] }).default("hosted").notNull(),
  // v4 SDK: Agent type determines which platform UI to render
  agentType: text("agent_type", { enum: ["chat", "form", "workflow"] }).default("chat").notNull(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  tag: text("tag").notNull(),
  description: text("description").notNull(),
  longDesc: text("long_desc").notNull(),

  pricingModel: text("pricing_model", { enum: ["subscription", "one_time", "usage_based", "tiered_subscription", "outcome_based"] }).default("subscription").notNull(),
  pricingConfig: jsonb("pricing_config"),
  monthlyPriceCents: integer("monthly_price_cents"),
  annualPriceCents: integer("annual_price_cents"),
  stripePriceIdMonthly: text("stripe_price_id_monthly"),
  stripePriceIdAnnual: text("stripe_price_id_annual"),

  // Private S3/R2 key to the ZIP/source-code bundle
  assetKey: text("asset_key").notNull(),
  embedUrl: text("embed_url"), // URL for iframe embed (legacy, deprecated in v4)

  // v4 SDK: Seller's registered endpoint for SDK communication
  endpointUrl: text("endpoint_url"),           // HTTPS URL to seller's SDK handler
  sdkSecretEncrypted: text("sdk_secret_encrypted"), // HMAC secret, AES-256 encrypted
  sdkVersion: text("sdk_version"),              // e.g. '1.0.0' — for SDK compatibility checks
  // v4 SDK: Agent UI configuration (input schema for form, starter message for chat, etc.)
  agentConfig: jsonb("agent_config"),           // { inputSchema?, starterMessage?, inputPlaceholder?, outputLabel? }

  category: text("category"), // Category for marketplace
  status: text("status", { enum: ["pending", "testing", "pending_review", "approved", "rejected_performance", "rejected_admin", "rejected_manual", "suspended", "draft", "staging", "published", "flagged"] }).default("draft").notNull(),
  isFeatured: boolean("is_featured").default(false),
  featureOrder: integer("feature_order"),
  approvedAt: timestamp("approved_at"),
  approvedBy: uuid("approved_by").references(() => users.id),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),

  features: text("features").array(),
  integrations: text("integrations").array(),
  useCases: text("use_cases").array(),

  // Aggregated stats
  rating: integer("rating").default(0).notNull(),     // sum of stars
  avgRating: text("avg_rating"), // DECIMAL(3,2) as text
  reviewCount: integer("review_count").default(0).notNull(),
  salesCount: integer("sales_count").default(0).notNull(),
  subscriberCount: integer("subscriber_count").default(0).notNull(),

  // Performance monitoring
  performanceAvgMs: real("performance_avg_ms"),
  performanceP95Ms: real("performance_p95_ms"),
  performanceErrorRate: real("performance_error_rate"),
  performanceTestedAt: timestamp("performance_tested_at"),
  performancePass: boolean("performance_pass"),

  // Suspension
  suspendedAt: timestamp("suspended_at"),
  suspensionReason: text("suspension_reason"),
  suspensionNote: text("suspension_note"),

  isApproved: boolean("is_approved").default(false).notNull(), // legacy, kept for compatibility
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const agentsRelations = relations(agents, ({ one, many }) => ({
  seller: one(users, {
    fields: [agents.sellerId],
    references: [users.id],
  }),
  purchases: many(purchases),
  subscriptions: many(subscriptions),
  reviews: many(reviews),
}));

// ─────────────────────────────────────────────────────────────
// 4. SUBSCRIPTIONS — Access control & recurring payments
// ─────────────────────────────────────────────────────────────
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  buyerId: uuid("buyer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  agentId: uuid("agent_id")
    .notNull()
    .references(() => agents.id, { onDelete: "restrict" }),
  
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  stripeCustomerId: text("stripe_customer_id"),
  planType: text("plan_type").notNull(), // 'monthly' | 'annual' | 'trial' | 'one_time'
  status: text("status").notNull(), // 'active' | 'cancelled' | 'expired' | 'trial'
  
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelledAt: timestamp("cancelled_at"),
  trialEndsAt: timestamp("trial_ends_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("active_sub_idx")
    .on(table.buyerId, table.agentId)
    .where(sql`${table.status} = 'active'`)
]);

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  buyer: one(users, {
    fields: [subscriptions.buyerId],
    references: [users.id],
  }),
  agent: one(agents, {
    fields: [subscriptions.agentId],
    references: [agents.id],
  }),
}));

// ─────────────────────────────────────────────────────────────
// 5. PURCHASES — Access control & financial ledger (Legacy / One-time)
// ─────────────────────────────────────────────────────────────
export const purchases = pgTable("purchases", {
  id: uuid("id").primaryKey().defaultRandom(),
  buyerId: uuid("buyer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  agentId: uuid("agent_id")
    .notNull()
    .references(() => agents.id, { onDelete: "restrict" }),
  sellerId: uuid("seller_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  subscriptionId: uuid("subscription_id")
    .references(() => subscriptions.id),

  stripePaymentId: text("stripe_payment_id"), // Removed unique since a purchase record might span or we use this generic
  amountPaid: integer("amount_paid").notNull(),   // cents
  platformFee: integer("platform_fee").notNull(),  // 15%
  sellerPayout: integer("seller_payout").notNull(), // 85%

  currency: text("currency").default("inr"),
  type: text("type", { enum: ["subscription", "renewal", "one_time"] }).default("one_time").notNull(),
  
  settlementStatus: text("settlement_status", { enum: ["pending", "settled", "refunded", "withheld"] }).default("pending").notNull(),
  settlementId: uuid("settlement_id").references(() => sellerSettlements.id),

  purchasedAt: timestamp("purchased_at").defaultNow().notNull(),
});

export const purchasesRelations = relations(purchases, ({ one }) => ({
  buyer: one(users, {
    fields: [purchases.buyerId],
    references: [users.id],
  }),
  agent: one(agents, {
    fields: [purchases.agentId],
    references: [agents.id],
  }),
  seller: one(users, {
    fields: [purchases.sellerId],
    references: [users.id],
  }),
  subscription: one(subscriptions, {
    fields: [purchases.subscriptionId],
    references: [subscriptions.id],
  }),
  settlement: one(sellerSettlements, {
    fields: [purchases.settlementId],
    references: [sellerSettlements.id],
  }),
}));

// ─────────────────────────────────────────────────────────────
// 6. REVIEWS — Buyers can review purchased agents
// ─────────────────────────────────────────────────────────────
export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  buyerId: uuid("buyer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  agentId: uuid("agent_id")
    .notNull()
    .references(() => agents.id, { onDelete: "cascade" }),
  subscriptionId: uuid("subscription_id")
    .references(() => subscriptions.id),

  stars: integer("stars").notNull(), // 1–5
  comment: text("comment"),
  isVisible: boolean("is_visible").default(true),

  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("one_review_per_buyer_agent").on(table.buyerId, table.agentId)
]);

export const reviewsRelations = relations(reviews, ({ one }) => ({
  buyer: one(users, {
    fields: [reviews.buyerId],
    references: [users.id],
  }),
  agent: one(agents, {
    fields: [reviews.agentId],
    references: [agents.id],
  }),
  subscription: one(subscriptions, {
    fields: [reviews.subscriptionId],
    references: [subscriptions.id],
  }),
}));

// ─────────────────────────────────────────────────────────────
// 7. MANAGED HOSTING — Docker + Coolify for sellers with weak infra
// ─────────────────────────────────────────────────────────────
export const managedHosting = pgTable("managed_hosting", {
  id: uuid("id").primaryKey().defaultRandom(),
  sellerId: uuid("seller_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  agentId: uuid("agent_id")
    .notNull()
    .references(() => agents.id, { onDelete: "cascade" }),
  tier: text("tier", { enum: ["basic", "pro", "enterprise"] }).notNull(),
  dockerImage: text("docker_image").notNull(),
  port: integer("port").default(3000).notNull(),
  envVarsEncrypted: text("env_vars_encrypted"),
  coolifyAppId: text("coolify_app_id"),
  hostedUrl: text("hosted_url"),
  status: text("status", { enum: ["provisioning", "active", "failed", "cancelled"] }).default("provisioning").notNull(),
  stripeSubscriptionId: text("stripe_subscription_id"),
  monthlyCostCents: integer("monthly_cost_cents").notNull(),
  provisionedAt: timestamp("provisioned_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const managedHostingRelations = relations(managedHosting, ({ one }) => ({
  seller: one(users, {
    fields: [managedHosting.sellerId],
    references: [users.id],
  }),
  agent: one(agents, {
    fields: [managedHosting.agentId],
    references: [agents.id],
  }),
}));

// ─────────────────────────────────────────────────────────────
// 8. REFUNDS — Dispute and refund tracking
// ─────────────────────────────────────────────────────────────
export const refunds = pgTable("refunds", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscriptionId: uuid("subscription_id")
    .references(() => subscriptions.id),
  purchaseId: uuid("purchase_id")
    .references(() => purchases.id),
  adminId: uuid("admin_id")
    .notNull()
    .references(() => users.id),
  amountCents: integer("amount_cents").notNull(),
  stripeRefundId: text("stripe_refund_id"),
  reason: text("reason"),
  decision: text("decision", { enum: ["approved", "partial", "rejected"] }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const refundsRelations = relations(refunds, ({ one }) => ({
  subscription: one(subscriptions, {
    fields: [refunds.subscriptionId],
    references: [subscriptions.id],
  }),
  purchase: one(purchases, {
    fields: [refunds.purchaseId],
    references: [purchases.id],
  }),
  admin: one(users, {
    fields: [refunds.adminId],
    references: [users.id],
  }),
}));
