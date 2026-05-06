import {
  pgTable,
  text,
  timestamp,
  integer,
  uuid,
  boolean,
  primaryKey,
  real,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

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

  // Stripe
  stripeAccountId: text("stripe_account_id"), // for sellers
  stripeCustomerId: text("stripe_customer_id"), // for buyers
  stripeOnboarded: boolean("stripe_onboarded").default(false),
  
  isFirstLogin: boolean("is_first_login").default(true),
  lastLoginAt: timestamp("last_login_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  listedAgents: many(agents),
  purchases: many(purchases),
  subscriptions: many(subscriptions),
  reviews: many(reviews),
}));

// ─────────────────────────────────────────────────────────────
// 3. AGENTS — The digital assets sellers upload
// ─────────────────────────────────────────────────────────────
export const agents = pgTable("agents", {
  id: uuid("id").primaryKey().defaultRandom(),
  sellerId: uuid("seller_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  tag: text("tag").notNull(),
  description: text("description").notNull(),
  longDesc: text("long_desc").notNull(),
  price: integer("price").notNull(), // cents — 4900 = $49.00

  // Private S3/R2 key to the ZIP/source-code bundle
  assetKey: text("asset_key").notNull(),
  embedUrl: text("embed_url"), // URL for iframe embed
  category: text("category"), // Category for marketplace
  status: text("status", { enum: ["pending", "testing", "pending_review", "approved", "rejected_performance", "rejected_admin", "suspended"] }).default("approved").notNull(),
  approvedAt: timestamp("approved_at"),
  approvedBy: uuid("approved_by").references(() => users.id),
  rejectionReason: text("rejection_reason"),

  features: text("features").array(),
  integrations: text("integrations").array(),
  useCases: text("use_cases").array(),

  // Aggregated stats
  rating: integer("rating").default(0).notNull(),     // sum of stars
  avgRating: text("avg_rating"), // DECIMAL(3,2) as text
  reviewCount: integer("review_count").default(0).notNull(),
  salesCount: integer("sales_count").default(0).notNull(),

  // Performance monitoring
  performanceAvgMs: real("performance_avg_ms"),
  performanceP95Ms: real("performance_p95_ms"),
  performanceErrorRate: real("performance_error_rate"),
  performanceTestedAt: timestamp("performance_tested_at"),
  performancePass: boolean("performance_pass"),

  // Suspension
  suspendedAt: timestamp("suspended_at"),
  suspensionReason: text("suspension_reason"),

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
});

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

  stripeSessionId: text("stripe_session_id").unique().notNull(),
  amountPaid: integer("amount_paid").notNull(),   // cents
  platformFee: integer("platform_fee").notNull(),  // 15%
  sellerPayout: integer("seller_payout").notNull(), // 85%

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

  stars: integer("stars").notNull(), // 1–5
  comment: text("comment"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reviewsRelations = relations(reviews, ({ one }) => ({
  buyer: one(users, {
    fields: [reviews.buyerId],
    references: [users.id],
  }),
  agent: one(agents, {
    fields: [reviews.agentId],
    references: [agents.id],
  }),
}));

