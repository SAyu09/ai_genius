import {
  pgTable,
  text,
  timestamp,
  integer,
  uuid,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─────────────────────────────────────────────────────────────
// 1. USERS — Buyers, Sellers, Admins
// ─────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash"), // null for OAuth users
  image: text("image"),
  role: text("role", { enum: ["buyer", "seller", "admin"] })
    .default("buyer")
    .notNull(),

  // Stripe Connect (for sellers receiving payouts)
  stripeAccountId: text("stripe_account_id"),
  stripeOnboarded: boolean("stripe_onboarded").default(false),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  listedAgents: many(agents),
  purchases: many(purchases),
  reviews: many(reviews),
}));

// ─────────────────────────────────────────────────────────────
// 2. AGENTS — The digital assets sellers upload
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

  features: text("features").array(),
  integrations: text("integrations").array(),
  useCases: text("use_cases").array(),

  // Aggregated stats
  rating: integer("rating").default(0).notNull(),     // sum of stars
  reviewCount: integer("review_count").default(0).notNull(),
  salesCount: integer("sales_count").default(0).notNull(),

  isApproved: boolean("is_approved").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const agentsRelations = relations(agents, ({ one, many }) => ({
  seller: one(users, {
    fields: [agents.sellerId],
    references: [users.id],
  }),
  purchases: many(purchases),
  reviews: many(reviews),
}));

// ─────────────────────────────────────────────────────────────
// 3. PURCHASES — Access control & financial ledger
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
// 4. REVIEWS — Buyers can review purchased agents
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
