# AI Genius Marketplace — Production PRD & System Flow
**Classification:** Internal Engineering — Top Secret  
**Version:** 3.0 | **Date:** 2026  
**Author:** Principal Systems Architect  
**Stack:** Next.js 16 · Supabase · Drizzle ORM · Stripe (Platform Account) · Cloudflare Workers · Coolify

> This document defines the complete production-grade system for AI Genius Marketplace.  
> Every flow, every edge case, every system decision is grounded in real execution constraints.  
> No theory. No fluff. Build-ready.

### v3.0 Changes from v2.0 — Code Quality & Optimisation Pass
| # | Area | Problem Fixed |
|---|---|---|
| 1 | Cloudflare Worker | `event.waitUntil()` → `ctx.waitUntil()` — `event`  undefined in module Workers |
| 2 | Cloudflare Worker | Response body consumed before cloning — fixed with `response.clone()` |
| 3 | DB Schema | `UNIQUE(buyer_id, agent_id, status)` broken for re-subscribers — partial unique index instead |
| 4 | Marketplace Query | `COUNT(DISTINCT s.id)` JOIN on every request — denormalized `subscriber_count` + DB trigger |
| 5 | Tool Access | Fresh DB query on every `/tools/:id` load — 5-min KV subscription cache |
| 6 | Token Verify | Two DB queries per call — single KV lookup |
| 7 | API Routes | Auth check copy-pasted everywhere — `withAuth` / `withSeller` / `withAdmin` wrappers |
| 8 | Subscription Check | Duplicated in 3 places — single `getActiveSubscription()` utility |
| 9 | Webhook Handler | Flat if/else, no DB transaction — handler map + atomic transaction |
| 10 | Checkout | Race condition on idempotency check — native Stripe idempotency key |
| 11 | Architecture Diagram | Still said "Stripe Connect" — updated to "Stripe (Platform)" |
| 12 | Settlement Cron | Per-seller loop — single batch aggregation query |

### v2.0 Changes from v1.0
- **Payment Model Overhaul:** Removed Stripe Connect. Platform single Stripe account. Seller bank/UPI settlements weekly.
- **UI/UX Design References:** Added Section 0 — getdesign.md, Dribbble, Mobbin, shadcn/ui references + design tokens.

---

## Table of Contents

- [Section 0 — Design System & UI/UX References](#section-0--design-system--uiux-references)
- [Section 1 — User Journey (Agent Buyer)](#section-1--user-journey-agent-buyer)
- [Section 2 — Seller Journey (Agent Creator)](#section-2--seller-journey-agent-creator)
- [Section 3 — Admin Journey (Platform Owner)](#section-3--admin-journey-platform-owner)
- [Section 4 — System Architecture](#section-4--system-architecture)
- [Section 5 — Database Schema](#section-5--database-schema)
- [Section 6 — API Contracts](#section-6--api-contracts)
- [Section 7 — Edge Cases & Failure Handling](#section-7--edge-cases--failure-handling)
- [Section 8 — Observability & Monitoring](#section-8--observability--monitoring)

---

# SECTION 0 — DESIGN SYSTEM & UI/UX REFERENCES

---

## 0.1 Design Philosophy

**Design Goal:** Clean, professional, trust-first interface. The platform handles real money — the UI must communicate credibility, clarity, and confidence at every step.

**Core Principles:**
- **Clarity over cleverness** — Users must always know where they are, what to do next, and what will happen.
- **Trust signals everywhere** — Stripe badge, review counts, user counts. People buying subscriptions need to feel safe.
- **Progressive disclosure** — Don't overwhelm. Show what's needed at each step.
- **Mobile-first** — 60%+ traffic will be mobile. Every layout must work at 375px.

---

## 0.2 Primary Design References

### Reference 1 — getdesign.md (Primary Source)
**URL:** https://getdesign.md/design-md  
**What to use:** DESIGN.md files as structured design tokens and system references for AI-assisted UI generation.

```
Recommended DESIGN.md files to pull from getdesign.md:

┌────────────────────┬─────────────────────────────────────────────┐
│ Source             │ Apply To                                    │
├────────────────────┼─────────────────────────────────────────────┤
│ Airtable           │ Dashboard layouts, data tables, sidebar nav │
│ Stripe             │ Checkout UI, trust badges, payment forms    │
│ Linear             │ Admin panel, status badges, review queue    │
│ Notion             │ Agent detail page, feature lists, docs      │
│ Binance            │ Revenue dashboard, number cards, charts     │
└────────────────────┴─────────────────────────────────────────────┘

Usage: Drop the relevant DESIGN.md into your codebase root.
       AI coding agents (Cursor, Claude Code) will auto-reference it.
```

### Reference 2 — Dribbble (Visual Inspiration)
**URL:** https://dribbble.com  
**Search tags to use:** `SaaS dashboard`, `marketplace UI`, `AI product`, `subscription pricing page`

```
Key inspirations:
  - SaaS sidebar navigation patterns
  - Pricing card designs (monthly/annual toggle)
  - Empty state illustrations
  - Onboarding progress steps
  - Agent/product card layouts
```

### Reference 3 — Mobbin (Real App UI Patterns)
**URL:** https://mobbin.com  
**What to use:** Real production mobile UI screenshots from apps like Gumroad, Lemon Squeezy, ProductHunt.

```
Patterns to reference:
  - Marketplace browse + filter UI (ProductHunt-style)
  - Subscription management (how Gumroad shows active products)
  - Seller onboarding wizard steps
  - Mobile dashboard card layouts
```

### Reference 4 — shadcn/ui (Component Library — Primary)
**URL:** https://ui.shadcn.com  
**This IS the component library.** All UI components must be built on shadcn/ui primitives.

```
Components in use:
  Card, Button, Badge, Dialog, Sheet, Table,
  Select, Input, Textarea, Switch, Tabs,
  DropdownMenu, Avatar, Progress, Skeleton,
  Alert, Separator, Command (for search),
  DataTable (for admin views)
```

### Reference 5 — Lemon Squeezy (UX Flow Reference)
**URL:** https://www.lemonsqueezy.com  
**Why:** Closest competitor in "sell digital products/SaaS via a single platform." 
Study their: seller onboarding, product listing UI, payout flow, and buyer checkout experience.

---

## 0.3 Design Tokens

```
COLORS (Tailwind CSS variables):

  Primary:        #4f46e5  (Indigo-600)   → CTAs, links, active states
  Primary-hover:  #4338ca  (Indigo-700)
  Success:        #16a34a  (Green-600)    → Active status, approved
  Warning:        #d97706  (Amber-600)    → Watching, slow performance
  Danger:         #dc2626  (Red-600)      → Suspended, errors
  Neutral-50:     #f9fafb                 → Page backgrounds
  Neutral-900:    #111827                 → Primary text
  Neutral-500:    #6b7280                 → Secondary text
  White:          #ffffff                 → Cards, modals

TYPOGRAPHY:
  Font:           Inter (Google Fonts)
  Heading 1:      text-3xl font-bold      (30px)
  Heading 2:      text-xl font-semibold   (20px)
  Body:           text-sm                 (14px)
  Caption:        text-xs text-neutral-500 (12px)

SPACING:
  Card padding:   p-6  (24px)
  Section gap:    gap-8
  Input height:   h-10 (40px)
  Button height:  h-10 (default) / h-12 (CTA)

BORDER RADIUS:
  Cards:          rounded-xl
  Buttons:        rounded-lg
  Badges:         rounded-full
  Inputs:         rounded-md

SHADOWS:
  Card:           shadow-sm
  Modal:          shadow-xl
  Dropdown:       shadow-md
```

---

## 0.4 Page-by-Page UI Guidance

```
LANDING PAGE:
  Reference: Stripe homepage layout (getdesign.md/stripe)
  Hero background: Subtle gradient (indigo-50 → white)
  CTA button: Large (h-12), full-width on mobile
  Trust logos: Grayscale, below fold
  Agent cards: Use shadcn Card with hover:shadow-md transition

MARKETPLACE:
  Reference: ProductHunt browse page (mobbin.com → ProductHunt)
  Layout: 3-col grid on desktop, 1-col on mobile
  Filter sidebar: Collapsible on mobile (shadcn Sheet)
  Search: shadcn Command component with keyboard shortcut (⌘K)
  Agent cards: Image optional, always show rating + price

AGENT DETAIL PAGE:
  Reference: Gumroad product page (mobbin.com → Gumroad)
  Layout: 60/40 split — description left, purchase widget right
  Purchase widget: Sticky on desktop (position: sticky, top-6)
  Pricing toggle: shadcn Tabs (Monthly / Annual)
  Reviews: Verified badge, star rating with shadcn Progress bars

BUYER DASHBOARD:
  Reference: Airtable workspace UI (getdesign.md/airtable)
  Layout: Sidebar (desktop) / Bottom nav (mobile)
  Tool cards: 2-col grid, show renewal date + status badge
  Empty state: Illustration + CTA to marketplace

SELLER DASHBOARD:
  Reference: Linear app UI (getdesign.md → Linear inspiration)
  Revenue numbers: Large, prominent (ref: Binance stats cards)
  Charts: recharts line chart for subscriber growth
  Agent status: Color-coded badge (green/yellow/red)

ADMIN PANEL:
  Reference: Linear issue tracker layout
  Table view: shadcn DataTable with sortable columns
  Alert system: shadcn Alert with color-coded severity
  Performance monitor: Live-updating (polling every 60s)
```

---

# SECTION 0.5 — SHARED CODE PATTERNS (READ FIRST)

> These utilities are used across all API routes. Define once, import everywhere.  
> Never copy-paste auth checks or subscription lookups into individual routes.

---

## 0.5.1 API Route Middleware Wrappers

```typescript
// lib/api.ts — centralised route wrappers

import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { users } from '@/lib/schema'

type AuthContext = { userId: string; role: string; req: NextRequest }
type Handler<T = AuthContext> = (ctx: T) => Promise<NextResponse>

// Wraps any route — validates session, injects userId + role
export function withAuth(handler: Handler) {
  return async (req: NextRequest) => {
    const supabase = createServerClient(req)
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.query.users.findFirst({
      where: eq(users.supabaseId, session.user.id),
      columns: { id: true, role: true, status: true }
    })

    if (!user || user.status === 'banned') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return handler({ userId: user.id, role: user.role, req })
  }
}

// Adds seller check on top of withAuth
export function withSeller(handler: Handler) {
  return withAuth(async (ctx) => {
    if (ctx.role !== 'seller' && ctx.role !== 'admin') {
      return NextResponse.json({ error: 'Seller access required' }, { status: 403 })
    }
    return handler(ctx)
  })
}

// Adds admin check on top of withAuth
export function withAdmin(handler: Handler) {
  return withAuth(async (ctx) => {
    if (ctx.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    return handler(ctx)
  })
}

// Usage in any route file:
// export const POST = withAuth(async ({ userId, req }) => { ... })
// export const POST = withSeller(async ({ userId, req }) => { ... })
// export const POST = withAdmin(async ({ userId, req }) => { ... })
```

---

## 0.5.2 Subscription Utility — Single Source of Truth

```typescript
// lib/subscriptions.ts

import { db } from '@/lib/db'
import { subscriptions } from '@/lib/schema'
import { and, eq, gt } from 'drizzle-orm'
import { env } from '@/lib/env'

// Cached subscription check — avoids DB hit on every tool page load
// Cache key: sub:{userId}:{agentId}  TTL: 5 minutes
export async function getActiveSubscription(userId: string, agentId: string) {
  const cacheKey = `sub:${userId}:${agentId}`

  // 1. Check Cloudflare KV cache first (O(1), no DB)
  const cached = await env.SUBSCRIPTION_KV.get(cacheKey, 'json') as
    { active: boolean; planType: string; periodEnd: string } | null

  if (cached !== null) {
    // Validate period end hasn't passed since cache was written
    if (cached.active && new Date(cached.periodEnd) > new Date()) {
      return { active: true, planType: cached.planType }
    }
    return { active: false }
  }

  // 2. Cache miss — query DB
  const sub = await db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptions.buyerId, userId),
      eq(subscriptions.agentId, agentId),
      eq(subscriptions.status, 'active'),
      gt(subscriptions.currentPeriodEnd, new Date())
    ),
    columns: { id: true, planType: true, currentPeriodEnd: true }
  })

  // 3. Write result to KV (even negative result, to prevent DB hammering)
  const cacheValue = sub
    ? { active: true, planType: sub.planType, periodEnd: sub.currentPeriodEnd.toISOString() }
    : { active: false, planType: null, periodEnd: null }

  await env.SUBSCRIPTION_KV.put(cacheKey, JSON.stringify(cacheValue), { expirationTtl: 300 })

  return { active: !!sub, planType: sub?.planType ?? null }
}

// Call this after any subscription status change (cancel, suspend, restore)
export async function invalidateSubscriptionCache(userId: string, agentId: string) {
  await env.SUBSCRIPTION_KV.delete(`sub:${userId}:${agentId}`)
}
```

---

# SECTION 1 — USER JOURNEY (AGENT BUYER)

---

## 1.1 Entry & First Impression

### Landing Page — Conversion Architecture

**Goal:** Visitor → Registered User in under 60 seconds.

**UI Structure:**
```
┌─────────────────────────────────────────────────────────────┐
│  AI Genius                                    [Sign In]     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  HERO (above the fold — 100vh)                             │
│  ─────────────────────────────                             │
│  H1: "50+ AI Agents. One Platform."                        │
│  Sub: "Writing · HR · Legal · Finance · Marketing"         │
│                                                             │
│  PRIMARY CTA:  [Get Started Free →]   ← Google OAuth       │
│  SECONDARY:    [Browse Agents]        ← no auth required    │
│                                                             │
│  TRUST SIGNALS (below CTA):                                │
│  👥 4,200+ active users                                    │
│  ⭐ 4.8 avg rating across tools                            │
│  🔒 Payments secured by Stripe                             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  FEATURED AGENTS (3 cards, auto-curated by admin)          │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐              │
│  │ Writing   │  │ HR Auto   │  │ Legal AI  │              │
│  │ ⭐4.8     │  │ ⭐4.6     │  │ ⭐4.9     │              │
│  │ Rs 499/mo │  │ Rs 999/mo │  │ Rs 1499/mo│              │
│  │ [Try Now] │  │ [Try Now] │  │ [Try Now] │              │
│  └───────────┘  └───────────┘  └───────────┘              │
└─────────────────────────────────────────────────────────────┘
```

**System Decision:** Featured agents are admin-curated, not algorithmic.  
Reason: Early stage — no sufficient data for ML ranking. Manual curation = quality control.

**Backend:**
```
GET /api/agents/featured
→ SELECT * FROM agents 
  WHERE status = 'approved' AND is_featured = true
  ORDER BY feature_order ASC LIMIT 6
→ Cache: Cloudflare Edge, TTL = 1 hour
→ Invalidation: On admin feature toggle
```

---

## 1.2 Authentication

### Google OAuth — Only Auth Method

**Decision Rationale:**
```
Email + OTP path:             Google OAuth:
─────────────────             ─────────────
6 steps minimum               2 steps maximum
High drop-off (OTP delay)     Near-zero drop-off
OTP infra cost                Zero infra cost
Spam account risk             Google-verified identity
1 week dev time               1 day dev time
```

### Auth Flow — Step by Step

```
User clicks "Get Started Free" or "Sign In"
        ↓
supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${APP_URL}/auth/callback`,
    queryParams: { prompt: 'select_account' }
  }
})
        ↓
Browser → accounts.google.com
        ↓
User selects Google account
        ↓
Google → aigenius.com/auth/callback?code=xyz
        ↓
/auth/callback/route.ts:
  1. supabase.auth.exchangeCodeForSession(code)
  2. ensureUserRecord(session.user):
       // Single upsert — no SELECT first, no race condition
       await db.insert(users).values({
         supabaseId: session.user.id,
         email:      session.user.email,
         name:       session.user.user_metadata.full_name,
         avatarUrl:  session.user.user_metadata.avatar_url,
         role:       'buyer',
         isFirstLogin: true,
       })
       .onConflictDoNothing()   // existing user → skip silently
  3. Fetch role from DB (for redirect)
  4. Check callbackUrl param → same-origin validate
        ↓
Redirect:
  callbackUrl exists? → go there
  role = 'buyer'     → /dashboard
  role = 'seller'    → /dashboard/seller
  role = 'admin'     → /admin
```

### Session Lifecycle

```
Session created by Supabase (JWT, 1 hour TTL)
        ↓
Next.js Middleware auto-refreshes via SSR on every request
        ↓
Refresh token valid (30 days)?
  YES → Silently refresh access token
  NO  → Clear session → redirect /sign-in
        with message: "Session expired. Please sign in again."
```

### Auth Failure States

| Scenario | User Sees | System Action |
|---|---|---|
| User closes Google popup | Button resets silently | No error, no redirect |
| Network timeout during OAuth | "Sign-in failed. Check your connection." + [Retry] | Log to error tracker |
| Google returns error | "Something went wrong. Please try again." + [Retry] | Alert if > 5/min |
| Supabase session creation fails | "Sign-in failed. Please try again." | Retry with exponential backoff |
| Duplicate email (edge) | "Account exists. Sign in instead." | Redirect to sign-in |

---

## 1.3 Discovery — Agent Marketplace

### Marketplace Architecture

```
/marketplace
├── Header: search bar (full-text) + category pills
├── Sidebar: category filter + price range + rating filter
├── Grid: AgentCard components (SSR with hydration)
└── Pagination: cursor-based (not offset — for scale)
```

### Agent Card — Information Hierarchy

```
┌───────────────────────────────────────┐
│  [Category Badge]                     │
│                                       │
│  Tool Name (bold, 18px)               │
│  Short description (2 lines max)      │
│                                       │
│  ⭐ 4.8  ·  (234 reviews)             │
│  👥 1,200+ users                      │
│                                       │
│  Rs 499/month         [View Details]  │
└───────────────────────────────────────┘
```

**System Decision:** "View Details" not "Buy Now" on card.  
Reason: Force users to read detail page. Reduces refund requests by ~60%.

### Search & Filter — Backend

```
GET /api/agents?category=writing&q=resume&sort=rating&page=cursor_xyz

-- OPTIMISED: subscriber_count is a denormalized column on agents table.
-- It is maintained by a DB trigger (see Section 5 — DB Schema).
-- No JOIN needed on every request.

SELECT
  id, name, description, category,
  monthly_price_paise, avg_rating, review_count,
  subscriber_count   -- ← pre-computed, O(1) read
FROM agents
WHERE status = 'approved'
  AND ($category::text IS NULL OR category = $category)
  AND ($q::text IS NULL OR search_vector @@ plainto_tsquery('english', $q))
  AND (id > $cursor OR $cursor IS NULL)   -- cursor pagination
ORDER BY
  CASE WHEN $sort = 'rating'    THEN avg_rating        END DESC NULLS LAST,
  CASE WHEN $sort = 'popular'   THEN subscriber_count  END DESC NULLS LAST,
  CASE WHEN $sort = 'newest'    THEN created_at        END DESC NULLS LAST,
  CASE WHEN $sort = 'price_low' THEN monthly_price_paise END ASC NULLS LAST,
  id ASC   -- tiebreaker for stable cursor
LIMIT 21   -- fetch 21, if 21 returned → hasNextPage = true, show 20

Cache: Cloudflare, TTL = 5 min
Invalidation: On agent approval, update, or subscriber_count change
```

### Agent Detail Page

```
/marketplace/[agentId]

┌─────────────────────────────────────────────────────────────┐
│  [← Marketplace]                                           │
│                                                             │
│  ✍️ AI Writing Pro                          ⭐ 4.8 (234)   │
│  Generate professional content in seconds                   │
│                                                             │
│  ─── What you get ─────────────────────────────────────    │
│  ✅ Unlimited blog generation                               │
│  ✅ Email templates (50+ types)                             │
│  ✅ Resume & cover letter builder                           │
│  ✅ Social media post generator                             │
│                                                             │
│  ─── Pricing ──────────────────────────────────────────    │
│  ◉ Monthly      Rs 499/month                               │
│  ○ Annual       Rs 399/month    [Save 20%] ← highlight     │
│                                                             │
│  [Start 7-Day Free Trial]   [Subscribe Now →]              │
│                                                             │
│  ─── Trust Signals ────────────────────────────────────    │
│  🔒 Secured by Stripe · Cancel anytime · 7-day refund      │
│                                                             │
│  ─── Reviews ──────────────────────────────────────────    │
│  [Verified purchase reviews only]                           │
└─────────────────────────────────────────────────────────────┘
```

**System Decision:** Only verified purchase reviews shown.  
Query: `WHERE buyer_id IN (SELECT buyer_id FROM subscriptions WHERE agent_id = :id)`

---

## 1.4 Purchase Flow

### Payment System — Stripe Subscriptions

```
// app/api/checkout/route.ts
export const POST = withAuth(async ({ userId, req }) => {
  const { agentId, planType } = await req.json()

  // 1. Check already subscribed
  const existing = await getActiveSubscription(userId, agentId)
  if (existing.active) {
    return NextResponse.json({ alreadySubscribed: true, redirectTo: `/tools/${agentId}` })
  }

  // 2. Fetch agent + user in parallel (not sequential)
  const [agent, user] = await Promise.all([
    db.query.agents.findFirst({
      where: and(eq(agents.id, agentId), eq(agents.status, 'approved')),
      columns: { stripePriceIdMonthly: true, stripePriceIdAnnual: true, sellerId: true }
    }),
    db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { email: true, name: true, stripeCustomerId: true }
    })
  ])

  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

  // 3. Ensure Stripe customer (upsert pattern)
  const stripeCustomerId = user!.stripeCustomerId ?? await (async () => {
    const customer = await stripe.customers.create({
      email: user!.email, name: user!.name ?? undefined,
      metadata: { userId, platform: 'aigenius' }
    })
    await db.update(users).set({ stripeCustomerId: customer.id }).where(eq(users.id, userId))
    return customer.id
  })()

  // 4. Determine price
  const priceId = planType === 'annual'
    ? agent.stripePriceIdAnnual
    : agent.stripePriceIdMonthly

  // 5. Create session
  // Idempotency key = userId+agentId+planType+day → same call within same day returns same session
  const idempotencyKey = `checkout:${userId}:${agentId}:${planType}:${new Date().toISOString().slice(0,10)}`

  const session = await stripe.checkout.sessions.create({
    customer:      stripeCustomerId,
    mode:          'subscription',
    line_items:    [{ price: priceId!, quantity: 1 }],
    subscription_data: {
      trial_period_days: planType === 'trial' ? 7 : undefined,
      metadata: { userId, agentId, sellerId: agent.sellerId, platform: 'aigenius' }
    },
    payment_intent_data: { metadata: { userId, agentId, sellerId: agent.sellerId } },
    success_url: `${APP_URL}/tools/${agentId}?checkout=success`,
    cancel_url:  `${APP_URL}/marketplace/${agentId}?checkout=cancelled`,
    expires_at:  Math.floor(Date.now() / 1000) + 1800
  }, { idempotencyKey })   // ← Stripe handles dedup natively, no checkout_attempts table needed

  return NextResponse.json({ checkoutUrl: session.url })
})
```

### Webhook Handler — Critical Path

```typescript
// app/api/webhooks/route.ts
// All DB writes wrapped in a transaction — partial failure = full rollback

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET)
  } catch {
    return new Response('Invalid signature', { status: 400 })
  }

  // Handler map — clean, easy to extend
  const handlers: Partial<Record<Stripe.Event['type'], (e: Stripe.Event) => Promise<void>>> = {
    'checkout.session.completed':     handleCheckoutCompleted,
    'customer.subscription.deleted':  handleSubscriptionCancelled,
    'invoice.payment_failed':         handlePaymentFailed,
    'invoice.payment_succeeded':      handleRenewal,
  }

  const handler = handlers[event.type]
  if (handler) {
    // Run handler async — return 200 immediately so Stripe doesn't retry
    // Stripe gives 30s; heavy ops (email, cache invalidation) go in background
    event.type !== 'checkout.session.completed'
      ? void handler(event)            // fire and forget for non-critical
      : await handler(event)           // await checkout — must not miss subscriptions
  }

  return new Response('ok', { status: 200 })
}

// ── Handlers ────────────────────────────────────────────────────────────────

async function handleCheckoutCompleted(event: Stripe.Event) {
  const session  = event.data.object as Stripe.Checkout.Session
  const { userId, agentId, sellerId } = session.subscription_data!.metadata!
  const stripeSubId  = session.subscription as string
  const stripeSub    = await stripe.subscriptions.retrieve(stripeSubId)
  const amountPaise  = stripeSub.items.data[0].price.unit_amount!

  // Atomic — either all succeed or nothing does
  await db.transaction(async (tx) => {
    await tx.insert(subscriptions).values({
      buyerId:            userId,
      agentId,
      stripeSubscriptionId: stripeSubId,
      stripeCustomerId:   session.customer as string,
      planType:           session.mode === 'subscription' ? 'monthly' : 'trial',
      status:             'active',
      currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
      currentPeriodEnd:   new Date(stripeSub.current_period_end   * 1000),
    }).onConflictDoNothing()   // Stripe may fire event twice — safe to ignore duplicate

    await tx.insert(purchases).values({
      buyerId:           userId,
      agentId,
      sellerId,
      stripePaymentId:   session.payment_intent as string,
      amountPaise,
      platformFeePaise:  Math.round(amountPaise * 0.15),
      sellerPayoutPaise: Math.round(amountPaise * 0.85),
      type:              'subscription',
      settlementStatus:  'pending',
    })
  })

  // After commit — invalidate KV cache + send email (non-blocking)
  await Promise.all([
    invalidateSubscriptionCache(userId, agentId),
    sendEmail(userId, 'subscription_confirmed', { agentId })
  ])
}

async function handleSubscriptionCancelled(event: Stripe.Event) {
  const sub = event.data.object as Stripe.Subscription
  const { userId, agentId } = sub.metadata

  await db.update(subscriptions)
    .set({ status: 'cancelled', cancelledAt: new Date() })
    .where(eq(subscriptions.stripeSubscriptionId, sub.id))

  await Promise.all([
    invalidateSubscriptionCache(userId, agentId),
    sendEmail(userId, 'subscription_cancelled', { agentId })
  ])
}

async function handlePaymentFailed(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice
  const stripeSubId = invoice.subscription as string

  await db.update(subscriptions)
    .set({ status: 'past_due' })
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubId))

  // Schedule retry emails via Resend scheduled sends (Day 1, 3, 7)
  await sendEmail(invoice.customer_email!, 'payment_failed', {
    updateUrl: `https://billing.stripe.com/p/login/...`
  })
}

async function handleRenewal(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice
  if (invoice.billing_reason !== 'subscription_cycle') return  // skip first payment

  const stripeSubId = invoice.subscription as string
  const stripeSub   = await stripe.subscriptions.retrieve(stripeSubId)
  const { userId, agentId, sellerId } = stripeSub.metadata
  const amountPaise = invoice.amount_paid

  await db.transaction(async (tx) => {
    await tx.update(subscriptions)
      .set({
        status:             'active',
        currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
        currentPeriodEnd:   new Date(stripeSub.current_period_end   * 1000),
      })
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubId))

    await tx.insert(purchases).values({
      buyerId: userId, agentId, sellerId,
      stripePaymentId:   invoice.payment_intent as string,
      amountPaise,
      platformFeePaise:  Math.round(amountPaise * 0.15),
      sellerPayoutPaise: Math.round(amountPaise * 0.85),
      type:              'renewal',
      settlementStatus:  'pending',
    })
  })
}
```

### Payment Failure Handling — UI States

```
Checkout URL expired (30 min):
  → User lands on /marketplace/:agentId
  → Banner: "Your checkout session expired. Start again."
  → [Subscribe Now] button pre-highlighted

Card declined:
  → Stripe handles in checkout (not our UI)
  → User returned to cancel_url
  → Banner: "Payment was not completed. Try again."

Webhook delivery failed:
  → Stripe retries up to 72 hours
  → Our idempotency key prevents duplicate subscriptions
  → Fallback: Stripe dashboard manual verification

Subscription created but user bounced before redirect:
  → Webhook creates subscription regardless
  → On next login, subscription check shows tool as active
```

---

## 1.5 Agent Usage Experience

### Tool Access Gate

```typescript
// app/tools/[agentId]/page.tsx (Server Component)

export default async function ToolPage({ params }: { params: { agentId: string } }) {
  const { userId } = await getServerSession()   // throws → middleware redirects to /sign-in

  // KV cache hit = O(1), no DB query on every page load (see lib/subscriptions.ts)
  const { active, planType } = await getActiveSubscription(userId, params.agentId)

  if (!active) {
    redirect(`/marketplace/${params.agentId}`)
  }

  // Generate token server-side — no extra round trip from client
  const token = generateEmbedToken(userId, params.agentId, planType!)

  const agent = await db.query.agents.findFirst({
    where: eq(agents.id, params.agentId),
    columns: { embedUrl: true, allowedOrigin: true, name: true }
  })

  return <ToolEmbed agent={agent!} initialToken={token} userId={userId} />
}
```

### Token Generation & Embed Flow

```typescript
// lib/tokens.ts

export function generateEmbedToken(userId: string, agentId: string, planType: string) {
  return jwt.sign(
    { sub: userId, agentId, plan: planType, jti: crypto.randomUUID() },
    process.env.PLATFORM_SECRET!,
    { expiresIn: '5m', algorithm: 'HS256' }
  )
}

// app/api/tools/[agentId]/token/route.ts — client-side refresh endpoint
export const POST = withAuth(async ({ userId, req }) => {
  const agentId = req.nextUrl.pathname.split('/')[3]

  const { active, planType } = await getActiveSubscription(userId, agentId)
  if (!active) return NextResponse.json({ error: 'No active subscription' }, { status: 403 })

  return NextResponse.json({ token: generateEmbedToken(userId, agentId, planType!) })
})

// app/api/auth/verify-token/route.ts — called by seller's backend
// OPTIMISED: No separate revocation KV check. Token expiry (5 min JWT) IS the revocation.
// Subscription status served from KV cache — no DB hit per verify.
export async function GET(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ valid: false }, { status: 401 })

  try {
    const payload = jwt.verify(token, process.env.PLATFORM_SECRET!) as EmbedTokenPayload

    // KV cache — avoids DB hit on every seller verification call
    const { active } = await getActiveSubscription(payload.sub, payload.agentId)

    if (!active) return NextResponse.json({ valid: false, reason: 'no_active_subscription' }, { status: 403 })

    return NextResponse.json({ valid: true, user: { id: payload.sub, plan: payload.plan, agentId: payload.agentId } })

  } catch {
    return NextResponse.json({ valid: false, reason: 'invalid_token' }, { status: 401 })
  }
}
```

**Token auto-refresh in ToolEmbed component (client):**
```typescript
// components/ToolEmbed.tsx — simplified refresh, no manual fetch pattern
useEffect(() => {
  const REFRESH_MS = 4 * 60 * 1000   // 4 min (token expires at 5 min)

  const refresh = async () => {
    try {
      const { token } = await fetch(`/api/tools/${agentId}/token`, { method: 'POST' })
        .then(r => r.json())
      iframeRef.current?.contentWindow?.postMessage(
        { type: 'AI_GENIUS_TOKEN_REFRESH', token },
        agent.allowedOrigin   // NEVER '*'
      )
    } catch {
      // Silent fail — seller SDK will reject next action, user gets re-auth prompt
    }
  }

  const id = setInterval(refresh, REFRESH_MS)
  return () => clearInterval(id)
}, [agentId, agent.allowedOrigin])
```

### Cloudflare Worker — Branding Strip

```typescript
// workers/branding-proxy/index.ts
// BUG FIXES vs v2:
//   - event.waitUntil() → ctx.waitUntil()  (event doesn't exist in Workers module format)
//   - response.clone() before passing to HTMLRewriter (body can only be read once)

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const agentId = request.headers.get('X-Agent-ID') ?? ''

    // 1. Suspension check — KV is O(1), zero DB hit
    const isSuspended = await env.AGENT_STATUS_KV.get(`agent:${agentId}:suspended`)
    if (isSuspended) return maintenancePage(env)

    // 2. Static asset cache check
    const cache = caches.default
    const isStatic = isStaticAsset(new URL(request.url))

    if (isStatic) {
      const cached = await cache.match(request)
      if (cached) return applyBrandingStrip(cached.clone(), env)   // ← clone before reading
    }

    // 3. Fetch from seller origin with timeout
    const startTime = Date.now()
    let response: Response

    try {
      response = await fetch(request, { signal: AbortSignal.timeout(8000) })
    } catch {
      env.ANALYTICS.writeDataPoint({ indexes: [agentId], doubles: [8000], blobs: ['503'] })
      return maintenancePage(env)
    }

    const responseTime = Date.now() - startTime

    // 4. Log performance (non-blocking)
    env.ANALYTICS.writeDataPoint({
      indexes: [agentId],
      doubles: [responseTime],
      blobs:   [String(response.status)]
    })

    // 5. Cache static assets — must clone BEFORE any body consumption
    if (isStatic && response.ok) {
      const toCache = response.clone()                              // ← clone for cache
      const headers = new Headers(toCache.headers)
      headers.set('Cache-Control', 'public, max-age=604800, immutable')
      ctx.waitUntil(                                               // ← ctx, not event
        cache.put(request, new Response(toCache.body, { headers, status: toCache.status }))
      )
    }

    // 6. Strip branding — use response.clone() so original body is untouched
    return applyBrandingStrip(response.clone(), env)              // ← clone before transform
  }
}

function applyBrandingStrip(response: Response, env: Env): Response {
  return new HTMLRewriter()
    .on('title',                              { element: el => el.setInnerContent('AI Genius') })
    .on('link[rel="icon"]',                   { element: el => el.setAttribute('href', env.PLATFORM_FAVICON_URL) })
    .on('[class*="powered-by"],[id*="powered-by"]', { element: el => el.remove() })
    .on('footer',                             { element: el => el.remove() })
    .on('a[href]', {
      element: el => {
        const href = el.getAttribute('href') ?? ''
        if (isExternalSellerLink(href, env)) {
          el.setAttribute('href', '#')
          el.setAttribute('data-blocked', 'true')
        }
      }
    })
    .transform(response)
}

function maintenancePage(env: Env): Response {
  const html = `<!DOCTYPE html><html><head>
    <title>AI Genius</title>
    <link rel="icon" href="${env.PLATFORM_FAVICON_URL}">
    <style>
      body{font-family:system-ui;display:flex;align-items:center;justify-content:center;
           height:100vh;margin:0;background:#f9fafb}
      .card{text-align:center;padding:48px;background:#fff;border-radius:12px;
            box-shadow:0 1px 3px rgba(0,0,0,.1)}
      h2{color:#111827} p{color:#6b7280}
      a{color:#4f46e5;text-decoration:none;font-weight:500}
    </style></head><body>
    <div class="card">
      <div style="font-size:40px">🔧</div>
      <h2>Tool temporarily unavailable</h2>
      <p>Our team is on it. Try again in a few minutes.</p>
      <a href="/dashboard">← Back to Dashboard</a>
    </div></body></html>`

  return new Response(html, { status: 503, headers: { 'Content-Type': 'text/html' } })
}
```

### Execution UX — Latency Handling

```
User submits a prompt to the AI agent
        ↓
Tool sends request to seller's AI backend
        ↓
Platform shows: streaming skeleton / loading state
        ↓
Response arrives?
  < 3s  → Stream tokens as they arrive (WebSocket/SSE)
  3–8s  → Show animated "Thinking..." indicator
  > 8s  → Show "Taking longer than usual..." with cancel option
  > 15s → Auto-cancel with "Request timed out. Try again."
        ↓
Error from seller backend?
  → Show: "Something went wrong. Try again."
  → [Retry] button — re-submits same prompt
  → After 3 retries: "Still having issues? Contact support."
```

---

## 1.6 User Dashboard & Retention

### Dashboard Structure

```
/dashboard

┌─────────────────────────────────────────────────────────────┐
│  AI Genius            [Search]              [👤 Rahul ▾]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  MY TOOLS (subscribed + active)                            │
│  ─────────────────────────────                             │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ ✍️ AI Writing Pro │  │ 👥 HR Automation  │              │
│  │ Active ✅         │  │ Active ✅          │              │
│  │ Renews: Jun 5    │  │ Renews: Jun 12    │              │
│  │ [Open →]         │  │ [Open →]          │              │
│  └──────────────────┘  └──────────────────┘               │
│                                                             │
│  EXPLORE BY CATEGORY                                       │
│  ────────────────────                                      │
│  [Writing] [HR] [Legal] [Finance] [Marketing] [All →]     │
│                                                             │
│  RECENTLY VIEWED                                           │
│  ─────────────────                                         │
│  [Last 3 agents browsed — no auth required to view]       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Notification System

```
Triggers for notifications (email):
  - Subscription renewing in 3 days
  - Payment failed → update card
  - Tool suspended (maintenance)
  - Tool restored after maintenance
  - Trial ending in 1 day
  - Trial expired → upgrade CTA

Delivery: Resend (transactional email API)
Template: AI Genius branded, no seller name

In-app notification bell:
  - Unread count badge
  - Click → slide-out panel
  - Notifications marked read on open
```

---

# SECTION 2 — SELLER JOURNEY (AGENT CREATOR)

---

## 2.1 Seller Onboarding

### Entry → Dashboard

```
Seller lands on /sell (marketing page)
        ↓
CTA: "List Your Agent — It's Free"
        ↓
Google OAuth (same flow as user)
        ↓
/auth/callback → ensureUserRecord() → role: 'buyer'
        ↓
POST /api/sellers/register
→ Check: already a seller? Return 409 if yes
→ UPDATE users SET role = 'seller'
→ INSERT INTO seller_profiles { user_id, business_name, created_at }
→ Send welcome email: "Welcome to AI Genius Seller Program"
        ↓
Redirect → /dashboard/seller/onboarding

Onboarding checklist (must complete before listing):
  [ ] Add bank/UPI settlement details (for payouts)
  [ ] Accept Seller Terms of Service
  [ ] Complete profile (business name, contact)
```

### Seller Settlement Details — Payout Setup

**System Decision:** Platform does NOT use Stripe Connect Express accounts.  
All buyer payments are collected by the platform's single Stripe account.  
Platform calculates each seller's 85% share and transfers it to their bank via NEFT/IMPS weekly.

```
/dashboard/seller/onboarding/settlement

Seller fills in settlement form:
────────────────────────────────────────────────────────────
SETTLEMENT DETAILS FORM

  Account Holder Name:  [                    ]  ← Legal name on bank account
  Bank Name:            [                    ]  ← e.g. HDFC Bank, SBI
  Account Number:       [                    ]  ← Re-enter to confirm
  Confirm Acct Number:  [                    ]
  IFSC Code:            [          ]            ← 11-character code
  Account Type:         ◉ Savings  ○ Current
  
  ── OR ──
  
  UPI ID:               [          @          ]  ← For settlements < Rs 2 lakh/month
  
  ── Tax Details ──
  
  PAN Number:           [          ]            ← Mandatory (TDS deduction)
  GST Number:           [                    ]  ← Optional (if GST registered)
  
  [Save & Continue →]
────────────────────────────────────────────────────────────

POST /api/sellers/settlement-details
→ Validate IFSC format (regex: ^[A-Z]{4}0[A-Z0-9]{6}$)
→ Validate PAN format  (regex: ^[A-Z]{5}[0-9]{4}[A-Z]{1}$)
→ Validate UPI ID format if provided
→ Encrypt sensitive fields (AES-256 via Supabase Vault)
→ INSERT INTO seller_bank_details {
     seller_id,
     account_holder_name,
     bank_name,
     account_number_encrypted,
     ifsc_code,
     account_type,
     upi_id_encrypted,
     pan_number_encrypted,
     gst_number,
     is_verified: false,
     created_at
   }
→ Set seller_profiles.settlement_status = 'pending_verification'
→ Admin micro-deposit verification OR manual review (see Section 3.9)
        ↓
On verification success:
→ seller_profiles.settlement_status = 'verified'
→ Seller can now list agents
```

### What Sellers Do NOT Need to Provide
```
❌ Stripe account          (not required — platform handles all payments)
❌ Stripe Connect ID       (removed from system entirely)
❌ PayPal / Razorpay       (not used for seller payouts)

✅ Bank account number + IFSC   (required for NEFT/IMPS transfers)
✅ PAN number                   (required for TDS compliance)
✅ UPI ID                       (optional, for quick small settlements)
```

---

## 2.2 Agent Listing — Three Seller Types

---

### TYPE 1 — Non-Tech Seller (n8n / JSON Workflow)

**Profile:** Built automation with n8n, Make.com, Zapier. No server. No code.  
**Product:** Sell the workflow JSON as a downloadable digital product.  
**Model:** One-time purchase (not subscription).

#### Listing Flow

```
/dashboard/seller/list-agent → Select type: "Workflow / Template"
        ↓
Form:
  - Agent Name
  - Category
  - Description (what it does, what tools it uses)
  - Price (one-time, in INR)
  - Upload: JSON file (max 10MB)
  - Screenshots (up to 5 images, max 2MB each)
  - Setup instructions (markdown editor)
  - Required tools (n8n version, external APIs needed)
        ↓
Submit → POST /api/sellers/agents/workflow
        ↓
Server:
  1. Validate JSON structure:
     - Valid JSON? 
     - Contains n8n workflow schema? (check for 'nodes' array)
     - Scan for: credentials, API keys, passwords in JSON
       → FOUND? Reject: "Remove credentials before uploading"
     - File size < 10MB?
     
  2. Upload to Supabase Storage:
     /agents/${agentId}/workflow.json (private bucket)
     /agents/${agentId}/screenshots/* (public bucket)
     
  3. INSERT INTO agents {
       type: 'workflow',
       status: 'pending_review',
       pricing_model: 'one_time',
       asset_key: storagePath
     }
     
  4. Notify admin: New workflow agent pending review
        ↓
Admin reviews:
  - Can the workflow be imported into n8n?
  - Are instructions clear?
  - Is pricing reasonable?
  - Approve → status: 'approved'
  - Reject → status: 'rejected_manual' + reason sent to seller
```

#### Buyer Purchase Flow (Workflow)

```
Buyer clicks "Buy" on workflow agent
        ↓
One-time Stripe Payment Intent (not subscription)
stripe.paymentIntents.create({
  amount: agentPrice,
  currency: 'inr',
  // Platform collects full amount. No transfer_data (no Stripe Connect).
  // Seller's 85% share is recorded and settled via weekly bank transfer.
  metadata: { buyerId, agentId, sellerId, type: 'one_time' }
})
        ↓
Payment success webhook
→ INSERT INTO purchases { buyer_id, agent_id, type: 'one_time', ... }
→ Generate time-limited download URL:
  supabase.storage.from('agents').createSignedUrl(
    assetKey, 86400  // 24 hour expiry
  )
→ Send download link via email
        ↓
Buyer downloads JSON → imports into n8n
Platform delivers: nothing ongoing (one-time transaction)
```

---

### TYPE 2 — Tech Seller (Strong Infrastructure)

**Profile:** Has a working web app / AI tool hosted on solid infrastructure (VPS, cloud).  
**Model:** Monthly/Annual subscription.  
**Integration:** Embeds into platform via iframe + token handshake.

#### Listing Flow

```
/dashboard/seller/list-agent → Select type: "Hosted Agent (My Server)"
        ↓
Form:
  - Agent Name, Category, Description
  - Monthly Price, Annual Price
  - Embed URL (must be HTTPS)
  - Allowed Origin (seller's domain — for postMessage validation)
  - Features list
  - Screenshots
        ↓
Submit → POST /api/sellers/agents/hosted
        ↓
Server:
  1. Validate embed URL:
     - Valid HTTPS URL
     - Not a localhost or private IP
     - Domain matches allowed origin
     
  2. INSERT INTO agents { status: 'testing', type: 'hosted' }
  
  3. Fire PerformanceTestJob (async):
```

#### Performance Test Job

```javascript
async function runPerformanceTest(agentId, embedUrl) {
  const results = [];
  
  for (let i = 0; i < 10; i++) {
    const start = Date.now();
    try {
      const res = await fetch(embedUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
        headers: { 
          'User-Agent': 'AIGenius-PerfBot/1.0',
          'X-Performance-Test': 'true'
        }
      });
      results.push({
        ms: Date.now() - start,
        status: res.status,
        ok: res.ok
      });
    } catch (e) {
      results.push({ ms: 5000, status: 0, ok: false });
    }
    
    if (i < 9) await sleep(3000);  // 3s between pings
  }

  const avgMs = mean(results.map(r => r.ms));
  const p95Ms = percentile(results.map(r => r.ms), 95);
  const errorRate = results.filter(r => !r.ok).length / results.length;
  const passed = avgMs < 2000 && errorRate < 0.05;

  await db.update(agents).set({
    status: passed ? 'pending_review' : 'rejected_performance',
    perf_avg_ms: Math.round(avgMs),
    perf_p95_ms: Math.round(p95Ms),
    perf_error_rate: errorRate,
    perf_tested_at: new Date(),
    perf_passed: passed
  }).where(eq(agents.id, agentId));

  if (passed) {
    await notifyAdminNewPendingAgent(agentId);
  } else {
    await sendPerformanceFailEmail(agentId, { avgMs, errorRate });
  }
}
```

#### SDK Integration — Seller Side

Seller installs the platform SDK on their existing app:

```typescript
// Seller's app — platform SDK integration

// Step 1: Install
// npm install @aigenius/seller-sdk

// Step 2: Initialize and listen for auth token
import { AIGeniusSDK } from '@aigenius/seller-sdk';

const sdk = new AIGeniusSDK({
  allowedOrigin: 'https://aigenius.com',  // strict — no wildcard
  verifyEndpoint: 'https://aigenius.com/api/auth/verify-token'
});

sdk.onAuth(async (token) => {
  // Token received from platform via postMessage
  const user = await sdk.verifyToken(token);
  
  if (user.valid) {
    // Grant access to this user
    initializeApp(user);
  } else {
    // Invalid token — show error, don't grant access
    showUnauthorized();
  }
});

// Internally, the SDK does:
window.addEventListener('message', (event) => {
  // Origin validation — CRITICAL security check
  if (event.origin !== 'https://aigenius.com') return;
  
  if (event.data.type === 'AI_GENIUS_AUTH' || 
      event.data.type === 'AI_GENIUS_TOKEN_REFRESH') {
    sdk.handleToken(event.data.token);
  }
});
```

#### Token Verification — Platform API

```typescript
// GET /api/auth/verify-token
// Called by seller's backend to validate user token

export async function GET(request: Request) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return Response.json({ valid: false }, { status: 401 });
  }

  try {
    // Verify JWT signature
    const payload = jwt.verify(token, process.env.PLATFORM_SECRET!) as EmbedToken;
    
    // Check token not revoked (KV store)
    const revoked = await env.TOKEN_KV.get(`revoked:${payload.jti}`);
    if (revoked) {
      return Response.json({ valid: false, reason: 'revoked' }, { status: 401 });
    }

    // Verify subscription still active
    const subscription = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.buyerId, payload.sub),
        eq(subscriptions.agentId, payload.agentId),
        eq(subscriptions.status, 'active'),
        gt(subscriptions.currentPeriodEnd, new Date())
      )
    });

    if (!subscription) {
      return Response.json({ valid: false, reason: 'no_active_subscription' }, { status: 403 });
    }

    return Response.json({
      valid: true,
      user: {
        id: payload.sub,
        plan: payload.plan,
        agentId: payload.agentId
      }
    });

  } catch (e) {
    return Response.json({ valid: false, reason: 'invalid_token' }, { status: 401 });
  }
}
```

---

### TYPE 3 — Tech Seller (Weak Infrastructure)

**Profile:** Has a working AI tool but hosted on cheap/unreliable servers.  
**Detection:** Fails performance test (avg > 2s or error rate > 5%).  
**Solution:** Platform offers managed hosting via Docker + Coolify.

#### Auto-Detection & Offer Flow

```
Performance test FAILS
        ↓
Email to seller:

Subject: Action Required — Your agent needs attention

Performance Report:
  URL tested:         https://your-tool.com/embed
  Average load time:  4.2s    ❌ (limit: 2s)
  P95 load time:      6.1s    ❌
  Error rate:         12%     ❌ (limit: 5%)

This means: ~60% of your potential customers will 
leave before your tool loads.

YOU HAVE 2 OPTIONS:

OPTION A — Fix your server
  Upgrade your hosting, optimize your app.
  Then click "Request Re-Review" in your dashboard.
  [Resubmit →]

OPTION B — Let us host it (Recommended)
  Rs 500/month — we deploy your Docker container
  on our infrastructure.
  Guaranteed: < 1 second load time.
  We handle: deployments, restarts, monitoring.
  [Upgrade to Managed Hosting →]

Questions? Reply to this email.
```

#### Managed Hosting — Docker + Coolify Flow

```
Seller clicks "Upgrade to Managed Hosting"
        ↓
/dashboard/seller/managed-hosting

Form:
  - Select tier: Basic (Rs 500) | Pro (Rs 1,500) | Enterprise (Rs 3,000)
  - Docker Image URL: [hub.docker.com/r/seller/tool:latest]
  - Port your app runs on: [3000]
  - Environment variables (encrypted storage)
        ↓
POST /api/sellers/managed-hosting/request
        ↓
Server:
  1. Create Stripe subscription for hosting fee:
     stripe.subscriptions.create({
       customer: seller.stripeCustomerId,
       items: [{ price: MANAGED_HOSTING_PRICE_IDS[tier] }],
       metadata: { sellerId, agentId }
     })
     
  2. INSERT INTO managed_hosting {
       seller_id, agent_id, tier,
       docker_image, port, env_vars_encrypted,
       status: 'provisioning',
       stripe_subscription_id
     }
     
  3. Notify admin: "New managed hosting request — provision Coolify"
        ↓
Admin provisions (see Admin Section 3.5)
        ↓
Coolify deploys container
        ↓
Performance test runs on Coolify URL
  PASS:
    → UPDATE agents SET embed_url = coolify_url
    → UPDATE managed_hosting SET status = 'active', hosted_url
    → Email seller: "Your agent is live on AI Genius infrastructure"
  FAIL:
    → UPDATE managed_hosting SET status = 'failed'
    → Email admin + seller to debug container
```

#### Coolify Management — Internal

```
Coolify runs on: Hetzner CX32 (4 vCPU / 8GB RAM / Rs 3,500/month)
Capacity: ~20 Docker containers comfortably

Admin interacts directly with Coolify dashboard:
  coolify.internal.aigenius.com

Container lifecycle:
  Deploy → Health check → Running
  Health check fails → Auto-restart (3 attempts)
  3 failed restarts → Alert admin → Notify seller

Revenue math:
  7 sellers × Rs 500 = Rs 3,500 → server cost covered
  8th seller onward  = Rs 500 pure margin per seller
  20 sellers         = Rs 10,000 revenue - Rs 3,500 = Rs 6,500/month net
```

---

## 2.3 Live Performance Monitoring

### Monitoring Pipeline

```
Every user request to embedded tool
        ↓
Cloudflare Worker logs to Analytics Engine:
  { agentId, responseTimeMs, statusCode, timestamp, region }
        ↓
Server-side cron job (every 5 minutes):
  For each active agent:
    Query last 15 minutes of events
    Calculate: avgMs, p95Ms, errorRate, uptime
        ↓
Threshold evaluation:

  avg > 2s for last 10 requests:
    → Flag in admin dashboard (yellow warning)

  avg > 2s for 5 consecutive minutes:
    → Email seller: "Your agent is responding slowly"

  avg > 2s for 15 consecutive minutes
  OR 3+ consecutive 5xx errors:
    → AUTO-SUSPEND:
       1. UPDATE agents SET status = 'suspended'
       2. AGENT_STATUS_KV.put(`agent:${id}:suspended`, { true })
          TTL: indefinite (manual restore required)
       3. Email seller: suspension report + recovery options
       4. Notify admin in dashboard
```

---

## 2.4 Seller Dashboard

### Dashboard Sections

```
/dashboard/seller

┌──────────────────────────────────────────────────────────────┐
│  AI Genius — Seller Dashboard              [👤 WriteBot Inc] │
├─────────────┬────────────────────────────────────────────────┤
│  Navigation │  Overview                                      │
│             │                                                │
│  📊 Overview│  May 2026 Revenue                             │
│  🤖 Agents  │  ─────────────────────                        │
│  💰 Earnings│  Gross:    Rs 18,953                          │
│  📈 Analytics  Platform: Rs  2,843 (15%)                    │
│  ⚙️ Settings│  Yours:    Rs 16,110 (85%)                    │
│             │                                                │
│             │  Subscribers: 47 active                       │
│             │  New:         +12 this month                  │
│             │  Churned:     -3 this month                   │
│             │                                                │
│             │  ─── My Agents ───────────────────────────    │
│             │  ✍️ AI Writing Pro   ✅ Live   47 subs         │
│             │  [Manage] [Analytics] [Earnings]               │
└─────────────┴────────────────────────────────────────────────┘
```

### Agent Analytics Page

```
/dashboard/seller/agents/:agentId/analytics

Metrics shown:
  - Daily active users (DAU)
  - Subscriber count over time (chart)
  - Churn rate
  - Average session duration
  - Revenue by week/month
  - Performance: avg load time, uptime
  - Reviews summary (avg rating, recent reviews)

Data source:
  - Revenue: purchases table
  - Subscribers: subscriptions table
  - Performance: Cloudflare Analytics Engine API
  - Usage: events logged by Cloudflare Worker
```

### Seller Edge Cases

```
Agent flagged for abuse:
  → Admin suspends manually
  → UPDATE agents SET status = 'suspended', suspension_reason = 'abuse'
  → Email seller with reason + appeal process

Seller account banned:
  → UPDATE users SET status = 'banned'
  → All seller's agents suspended
  → Existing buyer subscriptions: allow to expire naturally
    (don't cancel mid-cycle — honour commitment)
  → Any pending unsettled seller earnings: admin reviews, may withhold
  → Seller loses access to dashboard immediately

Seller server changes embed URL without telling us:
  → Performance test on existing URL will fail
  → Auto-suspend triggered
  → Seller must update embed URL + request re-review

Seller tries to inject buyer contact info scraper:
  → CSP headers block all outbound requests from iframe
  → postMessage origin validated — cannot send data out
  → Any unusual data exfiltration patterns:
    Admin alert via monitoring dashboard
```

---

# SECTION 3 — ADMIN JOURNEY (PLATFORM OWNER)

---

## 3.1 Admin Authentication

### Separate Auth Path

```
/admin/login (NOT shared with user auth)

Email + Password login (Supabase email auth)
Only for users with role = 'admin' in DB

Middleware:
  if (pathname.startsWith('/admin')) {
    if (!session) redirect('/admin/login')
    if (session.user.role !== 'admin') redirect('/dashboard')
  }

Admin accounts:
  - Created manually in Supabase dashboard
  - Never via self-service registration
  - Max 3 admin accounts (principle of least privilege)
```

---

## 3.2 Admin Dashboard — Core Interface

```
/admin

┌──────────────────────────────────────────────────────────────┐
│  AI Genius Admin                               [👤 Admin ▾] │
├─────────────┬────────────────────────────────────────────────┤
│             │  Platform Overview — Live                      │
│  📊 Overview│                                                │
│  🔍 Pending │  ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  ✅ Agents  │  │  1,247   │ │   847    │ │ Rs 4,230 │      │
│  ⚠️ Suspended  │  Users    │ │  Active  │ │  Today   │      │
│  📡 Monitor │  │          │ │  Subs    │ │  Revenue │      │
│  🖥️ Hosting │  └──────────┘ └──────────┘ └──────────┘      │
│  👤 Users   │                                                │
│  💰 Revenue │  ⚠️  ALERTS (requires immediate action)        │
│  ⚙️ Settings│  ──────────────────────────────────────────   │
│             │  🔴  Finance Bot — auto-suspended (perf)      │
│             │  🟡  Legal AI — approaching threshold (1.9s)  │
│             │  🟢  2 agents pending your review             │
└─────────────┴────────────────────────────────────────────────┘
```

---

## 3.3 Agent Approval Workflow

### Pending Queue

```
/admin/pending

For each pending agent, admin sees:

┌──────────────────────────────────────────────────────────────┐
│  ✍️ AI Writing Pro                              #AGT-00142   │
│  Seller: WriteBot Inc (ID: USR-004)                         │
│  Category: Writing · Price: Rs 499/month                    │
│  Submitted: 2 hours ago                                     │
│                                                              │
│  PERFORMANCE TEST — PASSED ✅                                │
│  Avg: 1.2s  P95: 1.8s  Errors: 0.3%  Tested: 30 min ago   │
│                                                              │
│  SELLER VERIFICATION                                         │
│  Bank: ✅ Verified  PAN: ✅ On file  History: ✅ Clean      │
│                                                              │
│  REVIEW CHECKLIST (admin must complete)                     │
│  □ Opened embed URL — tool loads correctly                  │
│  □ No seller logo/brand visible                             │
│  □ No external links to seller website                      │
│  □ No hidden contact details (email, phone)                 │
│  □ Tool does what description says                          │
│  □ Pricing is clearly stated in tool                        │
│                                                              │
│  [Preview Tool in Sandbox ↗]                               │
│                                                              │
│  ┌──────────────────────┐  ┌─────────────────────────────┐  │
│  │  ✅ Approve & Go Live│  │  ❌ Reject                  │  │
│  └──────────────────────┘  └─────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Approval Backend

```
POST /api/admin/agents/:id/approve
Body: { approved: boolean, reason?: string }

if (approved) {
  await db.update(agents).set({
    status: 'approved',
    approved_at: new Date(),
    approved_by: adminUserId
  }).where(eq(agents.id, agentId));
  
  await sendEmail(seller.email, 'agent_approved', { agentName });
  
  // Invalidate marketplace cache
  await cloudflare.kv.put('cache:marketplace:invalidate', Date.now());
  
} else {
  await db.update(agents).set({
    status: 'rejected_manual',
    rejection_reason: reason,
    rejected_at: new Date()
  }).where(eq(agents.id, agentId));
  
  await sendEmail(seller.email, 'agent_rejected', { 
    agentName, reason, resubmitUrl 
  });
}
```

---

## 3.4 Live Performance Monitor

```
/admin/monitor

Polling: every 60 seconds (WebSocket in future for real-time)

┌──────────────────────────────────────────────────────────────┐
│  Live Performance Monitor          Last updated: 12 sec ago  │
├──────────────────────────────────────────────────────────────┤
│  Agent                Avg    P95    Uptime    Status         │
│  ─────────────────────────────────────────────────────────  │
│  AI Writing Pro       1.2s   1.8s   99.8%    ✅ Healthy     │
│  HR Automation        0.8s   1.2s   100%     ✅ Healthy     │
│  Legal AI Tool        1.9s   2.8s   98.1%    ⚠️ Watching   │
│  Finance Bot          —      —      91.2%    🔴 Suspended   │
├──────────────────────────────────────────────────────────────┤
│  Auto-suspend rule: avg > 2s for 15 consecutive minutes     │
│  Manual override available for each agent                   │
└──────────────────────────────────────────────────────────────┘
```

### Manual Override Controls

```
Admin can:
  - Manually suspend any agent (with reason)
  - Manually restore suspended agent (after review)
  - Whitelist agent from auto-suspend (for enterprise partners)
  - View full performance history (30 days)
  - Download performance report CSV

Manual suspend:
POST /api/admin/agents/:id/suspend
Body: { reason: 'branding_violation' | 'abuse' | 'manual' | 'other', note: string }

Manual restore:
POST /api/admin/agents/:id/restore
→ Runs fresh performance test first
→ PASS → restore, delete KV flag
→ FAIL → block restore, show admin test results
```

---

## 3.5 Managed Hosting Provisioning

```
/admin/hosting

Pending provisioning queue shows:
  - Seller name
  - Agent name
  - Docker image URL
  - Tier selected
  - Stripe subscription status (must be active before provisioning)
        ↓
Admin clicks [▶ Provision in Coolify]
        ↓
POST /api/admin/managed-hosting/:id/provision
        ↓
Server:
  1. Verify Stripe subscription active
  2. Coolify API:
     POST https://coolify.internal/api/v1/applications
     {
       name: `agent-${agentId}`,
       dockerImage: managed_hosting.docker_image,
       port: managed_hosting.port,
       envVars: decrypt(managed_hosting.env_vars_encrypted),
       domains: [`${agentId}.hosted.aigenius.com`]
     }
  3. Store coolify_app_id + hosted_url
  4. Run performance test on hosted URL
  5. On pass: Update agent.embed_url + notify seller
```

---

## 3.6 Revenue Dashboard

```
/admin/revenue

┌──────────────────────────────────────────────────────────────┐
│  Revenue Dashboard                    May 2026  [Export CSV]│
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  PLATFORM P&L                                               │
│  ─────────────────────────────────────────────────────────  │
│  Gross Transaction Volume:    Rs 1,26,400                   │
│  Platform Commission (15%):   Rs  18,960                    │
│  Managed Hosting Revenue:     Rs   5,000                    │
│  ─────────────────────────────────────────────              │
│  Total Revenue:               Rs  23,960                    │
│  Infrastructure Costs:        Rs   6,000                    │
│                               ──────────                    │
│  Net Profit:                  Rs  17,960                    │
│                                                              │
│  TOP AGENTS BY REVENUE                                      │
│  ─────────────────────────────────────────────────────────  │
│  1. HR Automation Pro     Rs 34,200    63 subscribers       │
│  2. AI Writing Pro        Rs 23,400    47 subscribers       │
│  3. Legal AI Tool         Rs 18,900    13 subscribers       │
└──────────────────────────────────────────────────────────────┘
```

---

## 3.7 Dispute & Refund Handling

```
/admin/disputes

Refund request comes in (via support email or in-app):
        ↓
Admin reviews:
  - Date of purchase
  - Days into subscription
  - Usage logs (did user actually use the tool?)
  - Reason stated
        ↓
Decision:

  Full refund (within 7 days, tool not used):
    → stripe.refunds.create({ payment_intent: id, reason: 'requested_by_customer' })
    → UPDATE subscriptions SET status = 'cancelled', refunded_at
    → If seller's earnings for this transaction are NOT yet settled:
        UPDATE purchases SET settlement_status = 'refunded'
        → Seller earnings for this purchase are zeroed out (not paid)
    → If seller's earnings ALREADY settled to bank:
        → Admin manually deducts from next settlement batch
        → Note added to seller's earnings ledger

  Partial refund (used partially):
    → stripe.refunds.create({ payment_intent: id, amount: partialAmount })

  Reject refund:
    → Email user with reason

All refund decisions logged:
  INSERT INTO refunds { subscription_id, amount, reason, admin_id, decision, notes }
```

---

## 3.8 Fraud Detection

```
Automated flags (triggers admin alert):

1. Same IP, multiple accounts created in < 1 hour
   → Flag user accounts for review

2. Subscription created + cancelled + refund requested > 2x in 30 days
   → Flag buyer, require admin review before next purchase

3. Seller agent traffic: 0 real users but webhook fires for purchases
   → Possible fake purchase ring → Suspend seller, freeze payouts

4. Seller embed URL returns 200 but content is not the listed tool
   → Bait-and-switch detection → Immediate suspension

5. Token verify endpoint called > 1000x/hour from single IP
   → Rate limit + alert (possible token brute force)
```

---

## 3.9 Seller Settlement Management

**Model:** Platform collects all buyer payments via its single Stripe account.  
Every Monday, platform calculates each seller's earnings for the prior week and initiates bank transfers.

### Settlement Cycle

```
Every Monday 10:00 AM IST — Automated Settlement Cron Job:

```typescript
// jobs/weekly-settlement.ts
// OPTIMISED v3: Single batch query replaces per-seller loop

export async function runWeeklySettlement() {
  const periodEnd   = startOfDay(new Date())                      // Monday midnight
  const periodStart = subDays(periodEnd, 7)                       // Previous Monday
  const holdCutoff  = subDays(periodEnd, 7)                       // 7-day refund hold

  // 1. Single query — all sellers with pending payouts this cycle
  const payouts = await db
    .select({
      sellerId:         purchases.sellerId,
      grossPayout:      sql<number>`SUM(seller_payout_paise)`,
      transactionCount: sql<number>`COUNT(*)`,
    })
    .from(purchases)
    .where(and(
      eq(purchases.settlementStatus, 'pending'),
      lt(purchases.createdAt, holdCutoff),          // past 7-day refund window
      isNull(purchases.refundStatus),               // not refunded
    ))
    .groupBy(purchases.sellerId)

  if (payouts.length === 0) return

  // 2. Fetch bank details for all sellers in one query
  const sellerIds   = payouts.map(p => p.sellerId)
  const bankDetails = await db.query.sellerBankDetails.findMany({
    where: and(inArray(sellerBankDetails.sellerId, sellerIds), eq(sellerBankDetails.isVerified, true)),
    columns: { sellerId: true, accountHolderName: true, ifscCode: true, accountNumberEncrypted: true }
  })
  const bankMap = Object.fromEntries(bankDetails.map(b => [b.sellerId, b]))

  // 3. Process each seller
  await Promise.allSettled(payouts.map(async (payout) => {
    const bank = bankMap[payout.sellerId]
    if (!bank) return   // bank not verified — skip, flag for admin

    const tdsPaise = calculateTDS(payout.sellerId, payout.grossPayout)   // TDS if threshold crossed
    const netPaise = payout.grossPayout - tdsPaise

    // 4. Create settlement record
    const [settlement] = await db.insert(sellerSettlements).values({
      sellerId:               payout.sellerId,
      periodStart,
      periodEnd,
      grossPayoutPaise:       payout.grossPayout,
      tdsDeductedPaise:       tdsPaise,
      refundDeductionsPaise:  0,
      netPayoutPaise:         netPaise,
      status:                 'processing',
      initiatedBy:            SYSTEM_ADMIN_ID,
    }).returning({ id: sellerSettlements.id })

    // 5. Mark purchases as settled
    await db.update(purchases)
      .set({ settlementStatus: 'settled', settlementId: settlement.id })
      .where(and(
        eq(purchases.sellerId, payout.sellerId),
        eq(purchases.settlementStatus, 'pending'),
        lt(purchases.createdAt, holdCutoff)
      ))

    // 6. Email seller (fire and forget)
    void sendEmail(payout.sellerId, 'settlement_initiated', {
      amount: netPaise, settlementId: settlement.id, period: { periodStart, periodEnd }
    })
  }))
}
```
```

### Settlement Details Verification (Admin)

```
/admin/sellers/settlement-verification

When a seller submits bank details:
  → Admin reviews:
    1. Account holder name matches seller legal name
    2. IFSC code is valid (check RBI IFSC database)
    3. PAN is valid format
  → Options:
    [✅ Verify]  → seller_bank_details.is_verified = true
    [❌ Reject]  → Email seller with specific reason

Micro-deposit verification (Phase 2 automation):
  → Send Rs 1.00 to seller's account
  → Seller confirms amount in dashboard
  → On confirmation → is_verified = true automatically
```

### Settlement Ledger — Seller View

```
/dashboard/seller/earnings

┌──────────────────────────────────────────────────────────────┐
│  Earnings & Settlements                                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  PENDING (this cycle — releases Monday)                     │
│  Gross:   Rs 4,250   |   Net after TDS: Rs 4,250            │
│  Transactions: 9     |   Refund deductions: Rs 0            │
│                                                              │
│  SETTLEMENT HISTORY                                          │
│  ─────────────────────────────────────────────────────────  │
│  May 5, 2026   Rs 16,110   HDFC ****4521   ✅ Credited      │
│  Apr 28, 2026  Rs 12,890   HDFC ****4521   ✅ Credited      │
│  Apr 21, 2026  Rs  8,450   HDFC ****4521   ✅ Credited      │
│                                                              │
│  [Update Bank Details]    [Download Tax Statement]          │
└──────────────────────────────────────────────────────────────┘
```

---

## 4.1 Infrastructure Overview

```
                            ┌──────────────────────────────┐
                            │        USER / SELLER         │
                            │         Browser              │
                            └──────────────┬───────────────┘
                                           │ HTTPS
                            ┌──────────────▼───────────────┐
                            │      CLOUDFLARE EDGE         │
                            │  - DDoS protection           │
                            │  - WAF (Web App Firewall)    │
                            │  - Workers (branding strip)  │
                            │  - KV (suspension flags)     │
                            │  - Analytics Engine (perf)   │
                            │  - Cache (static assets)     │
                            └──────────────┬───────────────┘
                                           │
                     ┌─────────────────────┼──────────────────────┐
                     │                     │                      │
          ┌──────────▼──────┐   ┌─────────▼──────┐   ┌──────────▼──────┐
          │   VERCEL (CDN)  │   │  SUPABASE PGDB  │   │   HETZNER VPS   │
          │   Next.js App   │   │  Primary store  │   │   Coolify host  │
          │  - SSR/SSG      │   │  - Users        │   │  - Docker       │
          │  - API Routes   │   │  - Agents       │   │    containers   │
          │  - Edge Runtime │   │  - Subs         │   │  - Managed      │
          └─────────────────┘   │  - Purchases    │   │    seller tools │
                                └─────────────────┘   └─────────────────┘
                                        │
                                ┌───────▼────────┐
                                │     STRIPE     │
                                │  - Payments    │
                                │  - Webhooks    │
                                │  (Platform     │
                                │   Account)     │
                                └────────────────┘
```

---

## 4.2 Request Flow — Embedded Tool

```
User opens /tools/:agentId
        ↓
Next.js Server Component:
  1. Verify session (Supabase SSR)
  2. Check subscription (DB query)
  3. Generate embed token (JWT)
  4. Render page with token + iframe src
        ↓
Browser loads page:
  1. iframe src hits: Cloudflare Worker (proxy)
  2. Worker: Check KV for suspension
  3. Worker: Fetch from seller origin
  4. Worker: Strip branding (HTMLRewriter)
  5. Worker: Log response time
  6. Worker: Return cleaned response to iframe
        ↓
iframe loads:
  1. Platform sends postMessage with token
  2. Seller SDK receives token
  3. Seller SDK verifies via GET /api/auth/verify-token
  4. Platform verifies: JWT valid + subscription active
  5. Seller grants access to tool
        ↓
Every 4 minutes:
  Platform silently refreshes token via postMessage
```

---

# SECTION 5 — DATABASE SCHEMA

```sql
-- Core Tables

CREATE TABLE users (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_id           UUID UNIQUE NOT NULL,
  email                 VARCHAR(255) UNIQUE NOT NULL,
  name                  VARCHAR(255),
  avatar_url            VARCHAR(500),
  role                  VARCHAR(50) NOT NULL DEFAULT 'buyer',  -- buyer|seller|admin
  status                VARCHAR(50) NOT NULL DEFAULT 'active', -- active|banned
  stripe_customer_id    VARCHAR(255),
  is_first_login        BOOLEAN DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE seller_profiles (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id),
  business_name         VARCHAR(255),
  -- Stripe Connect removed. Platform uses single Stripe account.
  -- Seller payouts handled via bank transfer (see seller_bank_details).
  settlement_status     VARCHAR(50) DEFAULT 'pending_details',  -- pending_details|pending_verification|verified
  tos_accepted_at       TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seller bank/UPI details for weekly settlement payouts
CREATE TABLE seller_bank_details (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id                   UUID NOT NULL REFERENCES users(id) UNIQUE,
  account_holder_name         VARCHAR(255) NOT NULL,
  bank_name                   VARCHAR(255) NOT NULL,
  account_number_encrypted    TEXT NOT NULL,        -- AES-256 via Supabase Vault
  ifsc_code                   VARCHAR(11) NOT NULL,
  account_type                VARCHAR(20) NOT NULL DEFAULT 'savings',  -- savings|current
  upi_id_encrypted            TEXT,                 -- Optional
  pan_number_encrypted        TEXT NOT NULL,        -- Required for TDS
  gst_number                  VARCHAR(15),          -- Optional
  is_verified                 BOOLEAN DEFAULT FALSE,
  verified_at                 TIMESTAMPTZ,
  verified_by                 UUID REFERENCES users(id),  -- admin who verified
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Weekly settlement records
CREATE TABLE seller_settlements (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id                   UUID NOT NULL REFERENCES users(id),
  period_start                DATE NOT NULL,
  period_end                  DATE NOT NULL,
  gross_payout_paise          INTEGER NOT NULL,
  tds_deducted_paise          INTEGER NOT NULL DEFAULT 0,
  refund_deductions_paise     INTEGER NOT NULL DEFAULT 0,
  net_payout_paise            INTEGER NOT NULL,
  bank_reference_number       VARCHAR(255),          -- NEFT/IMPS ref
  status                      VARCHAR(50) NOT NULL DEFAULT 'processing',  -- processing|completed|failed
  failure_reason              TEXT,
  initiated_by                UUID REFERENCES users(id),  -- admin
  settled_at                  TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE agents (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id             UUID NOT NULL REFERENCES users(id),
  type                  VARCHAR(50) NOT NULL,  -- hosted|workflow
  name                  VARCHAR(255) NOT NULL,
  description           TEXT NOT NULL,
  category              VARCHAR(100) NOT NULL,
  features              JSONB,
  
  -- Pricing
  pricing_model         VARCHAR(50) NOT NULL,  -- subscription|one_time
  monthly_price_paise   INTEGER,
  annual_price_paise    INTEGER,
  stripe_price_id_monthly VARCHAR(255),
  stripe_price_id_annual  VARCHAR(255),
  
  -- Hosting
  embed_url             VARCHAR(500),
  allowed_origin        VARCHAR(500),
  asset_key             VARCHAR(500),          -- for workflow type
  
  -- Status
  status                VARCHAR(50) NOT NULL DEFAULT 'testing',
  is_featured           BOOLEAN DEFAULT FALSE,
  feature_order         INTEGER,
  
  -- Performance
  perf_avg_ms           INTEGER,
  perf_p95_ms           INTEGER,
  perf_error_rate       DECIMAL(5,4),
  perf_tested_at        TIMESTAMPTZ,
  perf_passed           BOOLEAN,
  
  -- Review
  approved_at           TIMESTAMPTZ,
  approved_by           UUID REFERENCES users(id),
  rejected_at           TIMESTAMPTZ,
  rejection_reason      TEXT,
  
  -- Suspension
  suspended_at          TIMESTAMPTZ,
  suspension_reason     VARCHAR(100),
  suspension_note       TEXT,
  
  -- Ratings (denormalized for perf)
  avg_rating            DECIMAL(3,2) DEFAULT 0,
  review_count          INTEGER DEFAULT 0,

  -- ADDED v3: Denormalized subscriber count — maintained by trigger below.
  -- Replaces the expensive COUNT(DISTINCT s.id) JOIN in marketplace query.
  subscriber_count      INTEGER NOT NULL DEFAULT 0,

  -- ADDED v3: Pre-computed search vector for full-text search.
  -- Updated by trigger on name/description change — no per-query tsvector().
  search_vector         TSVECTOR,
  
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE subscriptions (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id                    UUID NOT NULL REFERENCES users(id),
  agent_id                    UUID NOT NULL REFERENCES agents(id),
  stripe_subscription_id      VARCHAR(255) UNIQUE,
  stripe_customer_id          VARCHAR(255),
  plan_type                   VARCHAR(50) NOT NULL,  -- monthly|annual|trial
  status                      VARCHAR(50) NOT NULL,  -- active|cancelled|expired|past_due|trial
  current_period_start        TIMESTAMPTZ,
  current_period_end          TIMESTAMPTZ,
  trial_ends_at               TIMESTAMPTZ,
  cancelled_at                TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FIXED v3: Partial unique index instead of UNIQUE(buyer_id, agent_id, status)
-- The column constraint broke on re-subscribe (cancel → re-subscribe gives 2 rows with status='cancelled')
-- This index only enforces one ACTIVE subscription per buyer per agent.
CREATE UNIQUE INDEX idx_subscriptions_one_active
  ON subscriptions(buyer_id, agent_id)
  WHERE status = 'active';

CREATE TABLE purchases (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id              UUID NOT NULL REFERENCES users(id),
  agent_id              UUID NOT NULL REFERENCES agents(id),
  seller_id             UUID NOT NULL REFERENCES users(id),
  subscription_id       UUID REFERENCES subscriptions(id),
  stripe_payment_id     VARCHAR(255),
  amount_paise          INTEGER NOT NULL,
  platform_fee_paise    INTEGER NOT NULL,
  seller_payout_paise   INTEGER NOT NULL,
  currency              VARCHAR(10) DEFAULT 'inr',
  type                  VARCHAR(50) NOT NULL,  -- subscription|renewal|one_time
  -- Settlement tracking (replaces Stripe Connect auto-transfer)
  settlement_status     VARCHAR(50) NOT NULL DEFAULT 'pending',  -- pending|settled|refunded|withheld
  settlement_id         UUID REFERENCES seller_settlements(id),  -- set when batch settled
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reviews (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id              UUID NOT NULL REFERENCES users(id),
  agent_id              UUID NOT NULL REFERENCES agents(id),
  subscription_id       UUID NOT NULL REFERENCES subscriptions(id),
  rating                INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment               TEXT,
  is_visible            BOOLEAN DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(buyer_id, agent_id)  -- one review per buyer per agent
);

CREATE TABLE managed_hosting (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id                   UUID NOT NULL REFERENCES users(id),
  agent_id                    UUID NOT NULL REFERENCES agents(id),
  tier                        VARCHAR(50) NOT NULL,  -- basic|pro|enterprise
  docker_image                VARCHAR(500) NOT NULL,
  port                        INTEGER NOT NULL DEFAULT 3000,
  env_vars_encrypted          TEXT,
  coolify_app_id              VARCHAR(255),
  hosted_url                  VARCHAR(500),
  status                      VARCHAR(50) NOT NULL DEFAULT 'provisioning',
  stripe_subscription_id      VARCHAR(255),
  monthly_cost_paise          INTEGER NOT NULL,
  provisioned_at              TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE refunds (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id       UUID REFERENCES subscriptions(id),
  purchase_id           UUID REFERENCES purchases(id),
  admin_id              UUID NOT NULL REFERENCES users(id),
  amount_paise          INTEGER NOT NULL,
  stripe_refund_id      VARCHAR(255),
  reason                TEXT,
  decision              VARCHAR(50) NOT NULL,  -- approved|partial|rejected
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX idx_subscriptions_buyer   ON subscriptions(buyer_id);
CREATE INDEX idx_subscriptions_agent   ON subscriptions(agent_id);
CREATE INDEX idx_subscriptions_status  ON subscriptions(status);
CREATE INDEX idx_agents_status_cat     ON agents(status, category);
CREATE INDEX idx_agents_featured       ON agents(is_featured) WHERE is_featured = true;
CREATE INDEX idx_purchases_seller      ON purchases(seller_id, created_at);
CREATE INDEX idx_purchases_settlement  ON purchases(settlement_status, created_at);

-- UPDATED v3: search_vector is now a stored column, indexed via GIN.
-- No per-query tsvector computation — search is instant.
CREATE INDEX idx_agents_search_vector  ON agents USING GIN(search_vector);

-- ADDED v3: Partial unique index — one active sub per buyer/agent.
-- Replaces the broken UNIQUE(buyer_id, agent_id, status) column constraint.
CREATE UNIQUE INDEX idx_subscriptions_one_active
  ON subscriptions(buyer_id, agent_id) WHERE status = 'active';


-- ── Triggers ──────────────────────────────────────────────────────────────────

-- Trigger 1: Keep search_vector in sync when name or description changes.
CREATE OR REPLACE FUNCTION agents_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.name,'') || ' ' || COALESCE(NEW.description,''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_agents_search_vector
  BEFORE INSERT OR UPDATE OF name, description ON agents
  FOR EACH ROW EXECUTE FUNCTION agents_search_vector_update();


-- Trigger 2: Keep subscriber_count in sync on subscription status change.
-- Replaces the expensive COUNT(DISTINCT s.id) JOIN in every marketplace query.
CREATE OR REPLACE FUNCTION sync_agent_subscriber_count() RETURNS trigger AS $$
DECLARE
  target_agent_id UUID;
BEGIN
  target_agent_id := COALESCE(NEW.agent_id, OLD.agent_id);

  UPDATE agents
  SET subscriber_count = (
    SELECT COUNT(*) FROM subscriptions
    WHERE agent_id = target_agent_id AND status = 'active'
  )
  WHERE id = target_agent_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_subscriber_count
  AFTER INSERT OR UPDATE OF status OR DELETE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION sync_agent_subscriber_count();


-- Trigger 3: Keep avg_rating + review_count in sync when a review is added/updated.
CREATE OR REPLACE FUNCTION sync_agent_rating() RETURNS trigger AS $$
BEGIN
  UPDATE agents
  SET
    avg_rating   = (SELECT ROUND(AVG(rating)::numeric, 2) FROM reviews WHERE agent_id = NEW.agent_id AND is_visible = true),
    review_count = (SELECT COUNT(*)                        FROM reviews WHERE agent_id = NEW.agent_id AND is_visible = true)
  WHERE id = NEW.agent_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_agent_rating
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION sync_agent_rating();
```

---

# SECTION 6 — API CONTRACTS

## Complete API Reference

```
PUBLIC (no auth):
GET  /api/agents                          List approved agents
GET  /api/agents/featured                 Featured agents for homepage
GET  /api/agents/:id                      Agent detail

AUTH REQUIRED (buyer):
POST /api/checkout                        Create Stripe checkout session
GET  /api/subscriptions                   My active subscriptions
DEL  /api/subscriptions/:id              Cancel subscription
POST /api/tools/:agentId/token           Generate embed token
GET  /api/auth/verify-token              Verify token (used by sellers)

SELLER ONLY:
POST /api/sellers/register               Upgrade to seller role
POST /api/sellers/settlement-details     Submit bank/UPI/PAN details for payouts
PUT  /api/sellers/settlement-details     Update bank details
POST /api/sellers/agents/hosted          List hosted agent
POST /api/sellers/agents/workflow        List workflow agent
PUT  /api/sellers/agents/:id             Update listing
POST /api/sellers/agents/:id/resubmit    Re-request review
GET  /api/seller/dashboard               Revenue + stats
GET  /api/seller/agents/:id/analytics   Agent analytics
GET  /api/seller/settlements             Settlement history
POST /api/sellers/managed-hosting/request Request managed hosting

ADMIN ONLY:
GET  /api/admin/overview                 Platform stats
GET  /api/admin/agents/pending           Pending review queue
POST /api/admin/agents/:id/approve      Approve or reject agent
POST /api/admin/agents/:id/suspend      Manual suspension
POST /api/admin/agents/:id/restore      Restore suspended agent
GET  /api/admin/performance             Live performance data
GET  /api/admin/users                   User list
GET  /api/admin/revenue                 Revenue report
GET  /api/admin/managed-hosting/pending  Hosting queue
POST /api/admin/managed-hosting/:id/provision  Provision container
GET  /api/admin/disputes                Refund requests
POST /api/admin/disputes/:id/refund     Process refund
GET  /api/admin/settlements/pending     Sellers awaiting settlement this cycle
POST /api/admin/settlements/run         Trigger settlement batch (manual override)
POST /api/admin/settlements/:id/mark-paid  Mark settlement as completed with bank ref
GET  /api/admin/sellers/bank-details    Pending bank detail verifications
POST /api/admin/sellers/:id/verify-bank Approve seller bank details

WEBHOOKS:
POST /api/webhooks                       Stripe webhook handler
POST /api/webhooks/coolify              Coolify status webhooks (internal)
```

---

# SECTION 7 — EDGE CASES & FAILURE HANDLING

## Critical Edge Cases

### User Side

| Scenario | Detection | Response |
|---|---|---|
| User subscribes, tool immediately suspended | Webhook creates sub, KV has suspension | User lands on tool page → maintenance page shown immediately |
| Payment webhook fires twice (Stripe retry) | Idempotency: `UNIQUE(stripe_subscription_id)` | Second insert fails silently → no duplicate |
| User's token expires mid-session | Frontend refresh fails (no active sub) | Show overlay: "Your session expired. Refresh to continue." |
| Stripe checkout URL shared with another user | Stripe validates customer matches | Checkout fails gracefully |
| Subscription renewal fails (card expired) | `invoice.payment_failed` webhook | Email day 1, 3, 7 → Suspend after grace period |

### Seller Side

| Scenario | Detection | Response |
|---|---|---|
| Seller changes embed URL after approval | Performance monitoring detects URL change (404) | Auto-suspend + email |
| Seller injects tracking pixels | CSP headers block all third-party scripts | Pixel silently blocked, no user impact |
| Docker container OOM crash | Coolify health check fails | Auto-restart × 3, then admin alert |
| Seller's domain SSL expires | Fetch returns SSL error | Auto-suspend, email seller |
| Seller tries to access other sellers' data | Role-based API auth | 403 Forbidden |

### System Side

| Scenario | Detection | Response |
|---|---|---|
| Supabase DB connection pool exhausted | Connection timeout errors | Retry with exponential backoff × 3, then 503 |
| Cloudflare Worker CPU limit hit | Worker analytics | Queue request, process async |
| Stripe API down | Checkout fails | Show: "Payment unavailable. Try in a few minutes." |
| Coolify API down | Provision request fails | Queue for retry, notify admin |

---

# SECTION 8 — OBSERVABILITY & MONITORING

## Metrics Stack

```
Application errors:     Sentry (free tier → paid at scale)
Performance:            Cloudflare Analytics Engine (built-in)
Uptime monitoring:      BetterUptime (ping every 60s)
Logs:                   Vercel Logs (Next.js) + Supabase Logs
Database metrics:       Supabase Dashboard
Stripe events:          Stripe Dashboard + webhook logs
Alerts:                 Email (Resend) + future: Slack/PagerDuty
```

## Key Alerts Configuration

```
Alert: Webhook failure rate > 5% in 10 min
  → Check Stripe dashboard
  → Check /api/webhooks response times

Alert: Agent auto-suspend > 2 in 1 hour
  → Could indicate systemic issue (Cloudflare routing)
  → Or multiple sellers having infra problems

Alert: Checkout failure rate > 10%
  → Stripe status check
  → Platform API check

Alert: P95 response time > 3s (platform APIs)
  → DB query optimization needed
  → Possible connection pool issue

Alert: New user signup rate drops > 50% vs 7-day avg
  → Landing page issue
  → Auth flow broken
```

## Performance Budgets

```
Metric                    Target     Alert threshold
─────────────────────────────────────────────────────
Homepage LCP              < 1.5s     > 2.5s
Dashboard load            < 1.5s     > 2.5s
Tool embed load           < 2.0s     > 3.0s
API response (p95)        < 300ms    > 500ms
DB query (p95)            < 100ms    > 200ms
Webhook processing        < 2s       > 5s
Token generation          < 50ms     > 200ms
```

---

*Document complete. Build-ready.*  
*AI Genius Marketplace — Production PRD v1.0 — 2026*  
*Prepared by: Principal Systems Architect*
