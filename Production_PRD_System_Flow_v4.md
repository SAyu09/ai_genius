# AI Genius Marketplace — Production PRD & System Flow
**Classification:** Internal Engineering — Top Secret  
**Version:** 4.0 | **Date:** 2026  
**Author:** Principal Systems Architect  
**Stack:** Next.js 16 · Supabase · Drizzle ORM · Stripe (Platform Account) · Cloudflare Workers · Coolify

> This document defines the complete production-grade system for AI Genius Marketplace.  
> Every flow, every edge case, every system decision is grounded in real execution constraints.  
> No theory. No fluff. Build-ready.

### v4.0 Changes from v3.0 — SDK Architecture Overhaul
| # | Area | What Changed | Why |
|---|---|---|---|
| 1 | Core Model | Removed iframe embed + HTMLRewriter branding strip | Iframe approach is uncontrollable — hidden branding, JS-injected contacts, footer links cannot be reliably stripped |
| 2 | New: SDK System | `@aigenius/sdk` NPM package for sellers | Platform owns the UI. Seller provides only the AI backend logic via a standard API contract |
| 3 | New: Agent Runtime | Platform renders its own Chat / Form / Workflow UI | No seller UI ever reaches the buyer. Clean, consistent UX across all agents |
| 4 | New: Agent Protocol | Standard request/response schema for all agent types | One SDK works for chat agents, form agents, workflow agents — any AI backend |
| 5 | New: Seller Setup Flow | 3-step SDK integration guide | Seller installs SDK → implements handler → registers endpoint. Done in under 1 hour |
| 6 | New: Cloudflare Worker | Repurposed as request authenticator + rate limiter | No longer strips HTML. Now signs and forwards platform requests to seller endpoints securely |
| 7 | DB Schema | Added `agent_config` JSONB column + `sdk_version` | Stores agent UI config (input schema, output type, system prompt placeholder) |
| 8 | Removed | `checkout_attempts` table (was already removed in v3) | Confirmed removed |
| 9 | Removed | Cloudflare Worker HTMLRewriter branding strip logic | Replaced by SDK model |

### v3.0 Changes from v2.0 — Code Quality & Optimisation Pass
All 12 fixes retained. See v3.0 changelog above.

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

# SECTION 0.6 — SDK ARCHITECTURE (CORE DESIGN DECISION)

---

## 0.6.1 The Problem with Iframe Embedding

```
OLD APPROACH (v1–v3):                      WHY IT FAILED:
─────────────────────                      ──────────────
Load seller's full website in iframe  →    Can't control what seller ships
HTMLRewriter strips branding          →    JS-injected elements bypass HTMLRewriter
CSS hides footer/logos                →    New elements added on next deploy = broken
Block external links                  →    Contact forms still reach seller directly
                                           Hidden mailto: links, WhatsApp buttons
                                           Seller logo in AI responses (text)
                                           "Powered by SellerBrand" in chat output
                                           IMPOSSIBLE to guarantee full de-branding
```

**Root cause:** We controlled the wrapper, not the content. Seller's entire UI — HTML, CSS, JS, assets — was still running inside the iframe. We were in a permanent cat-and-mouse game with their frontend.

---

## 0.6.2 The SDK Solution — Platform Owns the UI

```
NEW APPROACH (v4):

  PLATFORM SIDE                              SELLER SIDE
  ─────────────────────────────────          ──────────────────────────────
  Platform renders its OWN UI          ←→   Seller runs ONLY a backend API
  Chat UI / Form UI / Workflow UI            No HTML, no CSS, no frontend
  100% under our control                     Only: receive request → run AI → return JSON
                                    
  Buyer types prompt in platform UI
         ↓
  Platform sends signed request → Cloudflare Worker → Seller's SDK endpoint
         ↓
  Seller SDK: verify signature → run AI logic → return structured response
         ↓
  Platform receives JSON → renders in platform UI
  
  Result: Buyer NEVER sees anything from seller's server.
          No branding. No contacts. No hidden elements. Zero.
```

---

## 0.6.3 Agent Type System

The SDK supports three agent types. The seller declares which type their agent is. Platform renders the matching UI.

```
┌─────────────────┬────────────────────────────┬─────────────────────────────┐
│ Agent Type      │ Seller Implements           │ Platform Renders            │
├─────────────────┼────────────────────────────┼─────────────────────────────┤
│ CHAT            │ POST /agent → stream        │ ChatUI (like ChatGPT)       │
│                 │ Accepts: messages[]         │ Message bubbles, streaming  │
│                 │ Returns: SSE token stream   │ Copy, regenerate buttons    │
├─────────────────┼────────────────────────────┼─────────────────────────────┤
│ FORM            │ POST /agent → JSON          │ FormUI (input → output)     │
│                 │ Accepts: { fields: {} }     │ Dynamic form from schema    │
│                 │ Returns: { output: string } │ Submit → loading → result   │
├─────────────────┼────────────────────────────┼─────────────────────────────┤
│ WORKFLOW        │ POST /agent → JSON          │ WorkflowUI (multi-step)     │
│                 │ Accepts: { step, data }     │ Step progress indicator     │
│                 │ Returns: { steps: [] }      │ Each step shown as a card   │
└─────────────────┴────────────────────────────┴─────────────────────────────┘
```

---

## 0.6.4 SDK Package Design — `@aigenius/sdk`

```typescript
// What the seller installs:
//   npm install @aigenius/sdk

// The ENTIRE public API surface of the SDK:

import { createAgent } from '@aigenius/sdk'

const agent = createAgent({
  secret: process.env.AIGENIUS_SECRET!,   // From platform dashboard
  agentId: process.env.AIGENIUS_AGENT_ID! // From platform dashboard
})

// agent.verify(request)     → { userId, agentId, plan } | throws
// agent.handler(fn)         → Express/Next.js route handler (handles verify + response format)
// agent.stream(res, gen)    → Pipes an async generator as SSE to platform
// agent.error(code, msg)    → Returns a standard error response

// That's it. 4 methods. Seller doesn't need to understand JWT, SSE, or platform internals.
```

---

## 0.6.5 SDK Internals — What It Does Under the Hood

```typescript
// packages/sdk/src/index.ts  (what WE build and publish to npm)

import { createHmac, timingSafeEqual } from 'crypto'

export interface AgentContext {
  userId:   string
  agentId:  string
  plan:     'monthly' | 'annual' | 'trial'
  metadata: Record<string, string>
}

export interface AgentRequest {
  type:      'chat' | 'form' | 'workflow'
  messages?: { role: 'user' | 'assistant'; content: string }[]   // chat
  fields?:   Record<string, string | number | boolean>            // form
  step?:     string; data?: Record<string, unknown>               // workflow
}

export interface AgentResponse {
  type:    'text' | 'stream' | 'steps' | 'error'
  content?: string
  steps?:   { id: string; title: string; status: 'done' | 'error'; output: string }[]
  error?:   { code: string; message: string }
}

export function createAgent({ secret, agentId }: { secret: string; agentId: string }) {
  
  // ── Internal: Verify HMAC signature from platform ──────────────────────────
  function verify(req: Request): AgentContext {
    const sig       = req.headers.get('X-AIGenius-Signature') ?? ''
    const timestamp = req.headers.get('X-AIGenius-Timestamp') ?? ''
    const payload   = req.headers.get('X-AIGenius-Payload')   ?? ''

    // Replay attack prevention: reject requests older than 5 minutes
    if (Math.abs(Date.now() - Number(timestamp)) > 5 * 60 * 1000) {
      throw new SDKError('EXPIRED_REQUEST', 'Request timestamp expired')
    }

    // HMAC-SHA256: sig = HMAC(secret, `${timestamp}.${agentId}.${payload}`)
    const expected = createHmac('sha256', secret)
      .update(`${timestamp}.${agentId}.${payload}`)
      .digest('hex')

    // Timing-safe comparison prevents timing attacks
    const sigBuf = Buffer.from(sig,      'hex')
    const expBuf = Buffer.from(expected, 'hex')

    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      throw new SDKError('INVALID_SIGNATURE', 'Request signature mismatch')
    }

    return JSON.parse(Buffer.from(payload, 'base64').toString('utf-8')) as AgentContext
  }

  // ── handler(): wraps seller's function in verify + response formatting ─────
  function handler(fn: (ctx: AgentContext, req: AgentRequest) => Promise<AgentResponse>) {
    return async (request: Request): Promise<Response> => {
      try {
        const ctx        = verify(request)
        const body       = await request.json() as AgentRequest
        const result     = await fn(ctx, body)
        return Response.json(result, { status: 200 })
      } catch (e) {
        if (e instanceof SDKError) {
          return Response.json({ type: 'error', error: { code: e.code, message: e.message } }, { status: e.httpStatus })
        }
        console.error('[AIGenius SDK]', e)
        return Response.json({ type: 'error', error: { code: 'INTERNAL', message: 'Agent error' } }, { status: 500 })
      }
    }
  }

  // ── stream(): SSE helper for chat agents ───────────────────────────────────
  function stream(generator: AsyncGenerator<string>): Response {
    const encoder = new TextEncoder()
    const body = new ReadableStream({
      async start(controller) {
        try {
          for await (const token of generator) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`))
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        } finally {
          controller.close()
        }
      }
    })
    return new Response(body, {
      headers: {
        'Content-Type':  'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection':    'keep-alive',
      }
    })
  }

  return { verify, handler, stream }
}

class SDKError extends Error {
  constructor(public code: string, message: string, public httpStatus = 401) {
    super(message)
  }
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
// Same KV-cached subscription check from v3. No change.

export default async function ToolPage({ params }: { params: { agentId: string } }) {
  const { userId } = await getServerSession()

  const { active, planType } = await getActiveSubscription(userId, params.agentId)
  if (!active) redirect(`/marketplace/${params.agentId}`)

  // Fetch agent config — determines which UI to render
  const agent = await db.query.agents.findFirst({
    where: eq(agents.id, params.agentId),
    columns: {
      name: true, type: true,
      agentConfig: true,       // JSONB: { inputSchema?, systemPromptHint?, outputLabel? }
      endpointUrl: true,       // Seller's registered SDK endpoint
    }
  })

  // Platform renders its own UI — no iframe, no seller frontend, no branding risk
  return <AgentRuntime agent={agent!} userId={userId} planType={planType!} />
}
```

### AgentRuntime — Platform UI Router

```typescript
// components/AgentRuntime.tsx
// Picks the right platform UI based on agent type.
// Seller's backend is called server-side — buyer never gets the endpoint URL.

export function AgentRuntime({ agent, userId, planType }) {
  switch (agent.type) {
    case 'chat':     return <ChatUI     agent={agent} userId={userId} />
    case 'form':     return <FormUI     agent={agent} userId={userId} />
    case 'workflow': return <WorkflowUI agent={agent} userId={userId} />
    default:         return <div>Unsupported agent type</div>
  }
}
```

### Platform UI — ChatUI

```
/tools/[agentId] — Chat Agent Rendering (platform's own UI)

┌──────────────────────────────────────────────────────────────────┐
│  AI Genius                    ✍️ AI Writing Pro          [⚙️]    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                   Chat Area                                │  │
│  │                                                            │  │
│  │   [assistant]: Hi! I'm your AI writing assistant.         │  │
│  │                What would you like to create today?       │  │
│  │                                                            │  │
│  │   [user]:      Write a blog post about AI trends          │  │
│  │                                                            │  │
│  │   [assistant]: ▌ (streaming tokens...)                    │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────[Send ↑]────┐  │
│  │  Type your message...                                      │  │
│  └────────────────────────────────────────────────────────────┘  │
│  [New Chat]  [Copy Last]  [🔒 Secured by AI Genius]             │
└──────────────────────────────────────────────────────────────────┘

100% platform HTML. Zero seller UI. Zero seller branding.
```

### Platform UI — FormUI

```
/tools/[agentId] — Form Agent Rendering

┌──────────────────────────────────────────────────────────────────┐
│  AI Genius                  📝 Resume Builder            [⚙️]   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Fill in the details below to generate your output:             │
│                                                                  │
│  Job Title:        [                              ]             │
│  Years of Exp:     [   ]  years                                 │
│  Key Skills:       [                              ]             │
│  Target Company:   [                              ]             │
│                                                                  │
│                              [Generate →]                        │
│                                                                  │
│  ─── Output ──────────────────────────────────────────────────  │
│  [Result renders here after generation]                          │
│                                                                  │
│  [Copy]  [Download PDF]  [Regenerate]                           │
└──────────────────────────────────────────────────────────────────┘

Input schema comes from agent.agentConfig.inputSchema (JSONB)
Platform renders the form dynamically — seller doesn't send any HTML
```

### API Route — Platform → Seller SDK Bridge

```typescript
// app/api/tools/[agentId]/run/route.ts
// This is the ONLY communication channel to seller's backend.
// Buyer's browser never calls seller directly.

export const POST = withAuth(async ({ userId, req }) => {
  const agentId = req.nextUrl.pathname.split('/')[3]

  // 1. Verify subscription (KV cache — no DB hit)
  const { active, planType } = await getActiveSubscription(userId, agentId)
  if (!active) return NextResponse.json({ error: 'No active subscription' }, { status: 403 })

  // 2. Get seller's endpoint
  const agent = await db.query.agents.findFirst({
    where: and(eq(agents.id, agentId), eq(agents.status, 'approved')),
    columns: { endpointUrl: true, sellerId: true, sdkSecret: true }  // sdkSecret encrypted at rest
  })
  if (!agent?.endpointUrl) return NextResponse.json({ error: 'Agent unavailable' }, { status: 503 })

  const body = await req.json()   // { type, messages? | fields? | step? }

  // 3. Build signed payload — seller SDK will verify this
  const timestamp = String(Date.now())
  const context: AgentContext = { userId, agentId, plan: planType!, metadata: {} }
  const payload   = Buffer.from(JSON.stringify(context)).toString('base64')
  const signature = createHmac('sha256', agent.sdkSecret)
    .update(`${timestamp}.${agentId}.${payload}`)
    .digest('hex')

  // 4. Forward to seller's SDK endpoint via Cloudflare Worker (rate limiting + logging)
  //    Worker URL wraps seller endpoint — buyer never sees the real endpoint URL
  const workerUrl = `https://agent-proxy.aigenius.workers.dev/${agentId}`

  const sellerResponse = await fetch(workerUrl, {
    method:  'POST',
    headers: {
      'Content-Type':          'application/json',
      'X-AIGenius-Signature':  signature,
      'X-AIGenius-Timestamp':  timestamp,
      'X-AIGenius-Payload':    payload,
      'X-Forward-To':          agent.endpointUrl,  // Worker reads this, strips before forwarding
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000)
  })

  // 5. Handle streaming (chat) vs JSON (form/workflow)
  if (sellerResponse.headers.get('content-type')?.includes('text/event-stream')) {
    // Pass SSE stream directly back to browser — platform streams seller tokens in real time
    return new Response(sellerResponse.body, {
      headers: {
        'Content-Type':  'text/event-stream',
        'Cache-Control': 'no-cache',
      }
    })
  }

  // Non-streaming: return JSON
  const result = await sellerResponse.json()
  return NextResponse.json(result)
})
```

### Cloudflare Worker — Request Proxy (Repurposed from v3)

```typescript
// workers/agent-proxy/index.ts
// v4: No longer strips HTML branding (iframe is gone).
// New role: Authenticate + rate-limit + forward platform requests to seller endpoints.
// Seller endpoint URL is never exposed to the buyer's browser.

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const agentId     = request.url.split('/').pop() ?? ''
    const forwardTo   = request.headers.get('X-Forward-To')   // Platform sends target URL

    if (!forwardTo) return new Response('Missing forward target', { status: 400 })

    // 1. Verify the request came from OUR platform (not someone hitting the worker directly)
    const platformSig = request.headers.get('X-Platform-Worker-Secret')
    if (platformSig !== env.PLATFORM_WORKER_SECRET) {
      return new Response('Unauthorized', { status: 401 })
    }

    // 2. Suspension check (KV — O(1))
    const isSuspended = await env.AGENT_STATUS_KV.get(`agent:${agentId}:suspended`)
    if (isSuspended) {
      return Response.json({ type: 'error', error: { code: 'SUSPENDED', message: 'This agent is temporarily unavailable.' } }, { status: 503 })
    }

    // 3. Rate limit per userId (from payload header)
    const payload   = request.headers.get('X-AIGenius-Payload') ?? ''
    const { userId } = JSON.parse(Buffer.from(payload, 'base64').toString()) as AgentContext
    const rateLimitKey = `ratelimit:${userId}:${agentId}`
    const requests  = parseInt(await env.RATE_KV.get(rateLimitKey) ?? '0')

    if (requests >= 60) {  // 60 requests / minute per user per agent
      return Response.json({ type: 'error', error: { code: 'RATE_LIMITED', message: 'Too many requests. Slow down.' } }, { status: 429 })
    }

    ctx.waitUntil(
      env.RATE_KV.put(rateLimitKey, String(requests + 1), { expirationTtl: 60 })
    )

    // 4. Build clean forwarded request — strip platform-internal headers before sending to seller
    const forwardHeaders = new Headers(request.headers)
    forwardHeaders.delete('X-Forward-To')
    forwardHeaders.delete('X-Platform-Worker-Secret')

    // 5. Forward to seller's SDK endpoint
    const startTime = Date.now()
    let sellerResponse: Response

    try {
      sellerResponse = await fetch(forwardTo, {
        method:  'POST',
        headers: forwardHeaders,
        body:    request.body,
        signal:  AbortSignal.timeout(30_000)
      })
    } catch {
      env.ANALYTICS.writeDataPoint({ indexes: [agentId], doubles: [30000], blobs: ['timeout'] })
      return Response.json({ type: 'error', error: { code: 'TIMEOUT', message: 'Agent took too long to respond.' } }, { status: 504 })
    }

    // 6. Log performance
    ctx.waitUntil(
      env.ANALYTICS.writeDataPoint({
        indexes: [agentId],
        doubles: [Date.now() - startTime],
        blobs:   [String(sellerResponse.status), userId]
      })
    )

    return sellerResponse
  }
}
```

### Execution UX — Latency & Error Handling

```
CHAT AGENT (streaming):
  Buyer submits message
         ↓
  POST /api/tools/:agentId/run  { type: 'chat', messages: [...] }
         ↓
  Platform immediately shows "Thinking..." skeleton
         ↓
  SSE tokens arrive from seller SDK?
    First token < 3s   → Skeleton replaced with streaming text
    First token 3–10s  → "Still working..." indicator
    No response > 30s  → { type: 'error', code: 'TIMEOUT' } → "Took too long, try again"
    SDK error response → { type: 'error', code: '...', message: '...' } → show message + [Retry]
    Rate limited       → { type: 'error', code: 'RATE_LIMITED' } → "Too many requests. Wait a moment."

FORM / WORKFLOW AGENT (JSON):
  Buyer submits form
         ↓
  POST /api/tools/:agentId/run  { type: 'form', fields: { ... } }
         ↓
  Platform shows full-screen loading spinner
         ↓
  JSON response arrives?
    < 10s  → Render result immediately
    10–30s → "Complex task, still running..." progress indicator
    > 30s  → Timeout error → [Try again]
    Error  → Show error.message from SDK response + [Retry]

ERROR STATES (all types):
  SUSPENDED   → "This tool is temporarily paused. Check back soon."
  RATE_LIMITED → "You're going fast! Wait a moment and try again."
  TIMEOUT     → "The agent is taking too long. Our team has been notified."
  INTERNAL    → "Something went wrong. If this persists, contact support."
  
All errors logged to platform observability (Section 8).
Repeated TIMEOUT/INTERNAL errors trigger auto-suspension review (Section 3.7).
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

Onboarding checklist (must complete before listing):
  [ ] Add bank/UPI settlement details (for payouts)
  [ ] Accept Seller Terms of Service
  [ ] Complete profile (business name, contact)
  [ ] Integrate @aigenius/sdk and register endpoint URL (see Section 2.2)
  [ ] Pass platform endpoint test (automated ping + response validation)
```

---

## 2.2 SDK Integration — Seller Setup Guide

> **Goal:** Seller should be live in under 60 minutes, even without deep API knowledge.

### Step 1 — Get Credentials from Dashboard

```
/dashboard/seller/developer

Platform generates per-agent credentials:
┌─────────────────────────────────────────────────────────────────┐
│  SDK Credentials                          [Regenerate Keys]     │
│                                                                 │
│  Agent ID:    agt_a1b2c3d4e5f6                                 │
│  SDK Secret:  sk_live_••••••••••••••••   [👁 Show] [Copy]      │
│                                                                 │
│  ⚠️  Keep your SDK Secret private. Never commit it to Git.      │
│  Add to your environment: AIGENIUS_SECRET=sk_live_...           │
└─────────────────────────────────────────────────────────────────┘
```

### Step 2 — Install SDK

```bash
# Works with any Node.js backend: Express, Fastify, Next.js, Hono, Bun
npm install @aigenius/sdk

# Add to your .env:
AIGENIUS_SECRET=sk_live_your_secret_here
AIGENIUS_AGENT_ID=agt_a1b2c3d4e5f6
```

### Step 3 — Implement Your Agent Handler

**Option A — Chat Agent (most common)**

```typescript
// Your backend: agent/route.ts (Next.js) or agent.ts (Express/Hono)

import { createAgent } from '@aigenius/sdk'
import OpenAI from 'openai'   // or any AI SDK you use

const agent  = createAgent({
  secret:  process.env.AIGENIUS_SECRET!,
  agentId: process.env.AIGENIUS_AGENT_ID!
})

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

// agent.handler() does:
//   1. Verify the request came from AI Genius platform (HMAC)
//   2. Parse the request body
//   3. Call your function with (context, request)
//   4. Handle errors automatically

export const POST = agent.handler(async (ctx, req) => {
  // ctx = { userId, agentId, plan, metadata }
  // req = { type: 'chat', messages: [{role, content},...] }

  // Optional: use ctx.plan to gate features
  const maxTokens = ctx.plan === 'annual' ? 4000 : 2000

  // Run your AI — any model, any provider
  const stream = await openai.chat.completions.create({
    model:    'gpt-4o',
    messages: req.messages!,
    stream:   true,
    max_tokens: maxTokens
  })

  // agent.stream() converts OpenAI stream → SSE format platform expects
  return agent.stream(async function* () {
    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content
      if (token) yield token
    }
  }())
})
```

**Option B — Form Agent**

```typescript
export const POST = agent.handler(async (ctx, req) => {
  // req = { type: 'form', fields: { jobTitle, yearsExp, skills } }
  
  const prompt = buildPrompt(req.fields!)   // your logic

  const completion = await openai.chat.completions.create({
    model:    'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
  })

  // Return standard response — platform renders it
  return {
    type:    'text',
    content: completion.choices[0].message.content ?? ''
  }
})
```

**Option C — Workflow Agent (multi-step)**

```typescript
export const POST = agent.handler(async (ctx, req) => {
  // req = { type: 'workflow', step: 'analyze' | 'write' | 'review', data: {...} }

  const steps: AgentResponse['steps'] = []

  if (req.step === 'analyze') {
    const result = await analyzeInput(req.data!)
    steps.push({ id: 'analyze', title: 'Analysis', status: 'done', output: result })
  }

  // ... other steps

  return { type: 'steps', steps }
})
```

### Step 4 — Register Endpoint in Dashboard

```
/dashboard/seller/developer

Endpoint Registration:
┌─────────────────────────────────────────────────────────────────┐
│  Your Agent Endpoint URL                                        │
│  [https://your-backend.com/api/agent          ]  [Test →]      │
│                                                                 │
│  ✅ HTTPS required                                              │
│  ✅ Must respond to POST requests                               │
│  ✅ Must return valid AIGenius SDK response format              │
│                                                                 │
│  [Run Connection Test]                                          │
└─────────────────────────────────────────────────────────────────┘

Platform sends a test request:
  POST your-backend.com/api/agent
  Headers: X-AIGenius-Signature: ..., X-AIGenius-Timestamp: ..., X-AIGenius-Payload: ...
  Body: { type: 'chat', messages: [{ role: 'user', content: 'ping' }] }

Expected response:
  200 OK, Content-Type: text/event-stream OR application/json
  Body: valid AgentResponse (any content)

PASS → Endpoint saved, seller can proceed to listing
FAIL → Show specific error: timeout | bad status | invalid response format | signature rejected
```

### Step 5 — Configure Agent UI in Dashboard

```
/dashboard/seller/agents/new → Step: "Configure Experience"

Agent Type:   ◉ Chat   ○ Form   ○ Workflow

If FORM selected:
  Define input fields:
  [+ Add Field]
  
  Field 1:  Label [Job Title     ]  Type [Text   ▾]  Required ✅
  Field 2:  Label [Years of Exp  ]  Type [Number ▾]  Required ✅
  Field 3:  Label [Skills        ]  Type [Textarea▾] Required ✅
  
  Output Label: [Generated Resume]
  
→ Platform generates FormUI dynamically from this schema
→ Seller never writes any frontend code

If CHAT selected:
  Starter message: [Hi! I'm your AI writing assistant. What would you like to create?]
  Input placeholder: [Type your message...]
  
→ Platform renders full ChatUI with seller's starter message
```

### What Sellers NEVER Need to Build

```
❌ Frontend UI          (platform provides Chat / Form / Workflow UI)
❌ Auth system          (SDK handles HMAC verification)
❌ Rate limiting        (Cloudflare Worker handles it)
❌ Subscription checks  (platform verifies before forwarding request)
❌ Payment handling     (platform's Stripe account)
❌ Branding decisions   (platform owns all UI)

✅ Their AI logic       (the actual value they provide)
✅ Their API backend    (Express / Next.js / Hono / any Node.js)
✅ Their AI model calls (OpenAI / Anthropic / Gemini / local — their choice)
```

---

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

### TYPE 2 — Tech Seller (Has Their Own Backend)

**Profile:** Has a working AI backend they want to sell access to.  
**Model:** Monthly/Annual subscription.  
**Integration:** Installs `@aigenius/sdk`, registers endpoint URL. Platform handles all UI.

#### Listing Flow

```
/dashboard/seller/list-agent → Select type: "Chat Agent" | "Form Agent" | "Workflow Agent"
        ↓
Form:
  - Agent Name, Category, Description
  - Monthly Price, Annual Price
  - Endpoint URL (must be HTTPS, must pass connection test)
  - Agent UI Config (starter message for chat, input schema for form)
  - Features list, Screenshots
        ↓
Submit → POST /api/sellers/agents/hosted
        ↓
Server:
  1. Validate endpoint URL:
     - Valid HTTPS URL
     - Not a localhost or private IP
     
  2. Generate SDK secret for this agent (cryptographically random, 32 bytes)
     Store encrypted in agents.sdk_secret_encrypted (AES-256, Supabase Vault)
     
  3. INSERT INTO agents { status: 'testing', type: agent.type }
  
  4. Fire ConnectionTestJob (async):
```

#### Connection Test Job

```typescript
// Replaces the old performance test that fetched the embed URL.
// New test: send a real SDK-signed ping request to seller's endpoint.

async function runConnectionTest(agentId: string, endpointUrl: string, sdkSecret: string) {
  const timestamp = String(Date.now())
  const ctx = { userId: 'test_user', agentId, plan: 'monthly', metadata: {} }
  const payload = Buffer.from(JSON.stringify(ctx)).toString('base64')
  const signature = createHmac('sha256', sdkSecret)
    .update(`${timestamp}.${agentId}.${payload}`)
    .digest('hex')

  const results = []

  for (let i = 0; i < 5; i++) {   // 5 pings, 3s apart
    const start = Date.now()
    try {
      const res = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type':          'application/json',
          'X-AIGenius-Signature':  signature,
          'X-AIGenius-Timestamp':  timestamp,
          'X-AIGenius-Payload':    payload,
        },
        body:   JSON.stringify({ type: 'chat', messages: [{ role: 'user', content: 'ping' }] }),
        signal: AbortSignal.timeout(10_000)
      })

      // Validate response format
      const isStream = res.headers.get('content-type')?.includes('text/event-stream')
      const isJson   = res.headers.get('content-type')?.includes('application/json')
      const valid    = res.ok && (isStream || isJson)

      results.push({ ms: Date.now() - start, status: res.status, valid })
    } catch {
      results.push({ ms: 10_000, status: 0, valid: false })
    }

    if (i < 4) await sleep(3_000)
  }

  const avgMs     = mean(results.map(r => r.ms))
  const errorRate = results.filter(r => !r.valid).length / results.length
  const passed    = avgMs < 5_000 && errorRate < 0.2   // generous — connection test, not perf test

  await db.update(agents).set({
    status:        passed ? 'pending_review' : 'rejected_performance',
    perfAvgMs:     Math.round(avgMs),
    perfErrorRate: errorRate,
    perfTestedAt:  new Date(),
    perfPassed:    passed
  }).where(eq(agents.id, agentId))

  if (passed) {
    await notifyAdminNewPendingAgent(agentId)
    // Platform shows seller their SDK credentials now that endpoint is confirmed
  } else {
    await sendConnectionFailEmail(agentId, { avgMs, errorRate })
  }
}
```

#### After Test Passes — Seller Gets Credentials

```
/dashboard/seller/developer  (unlocked after connection test passes)

┌─────────────────────────────────────────────────────────────────┐
│  Your SDK Credentials                    [Regenerate Secret]    │
│                                                                 │
│  Agent ID:    agt_a1b2c3d4e5f6                  [Copy]         │
│  SDK Secret:  sk_live_••••••••••••••••          [Show] [Copy]  │
│                                                                 │
│  Add to your server's .env:                                     │
│  AIGENIUS_SECRET=sk_live_...                                    │
│  AIGENIUS_AGENT_ID=agt_a1b2c3d4e5f6                            │
│                                                                 │
│  Your agent is in review. Expected: 1–2 business days.         │
└─────────────────────────────────────────────────────────────────┘
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
Connection test runs on Coolify URL (same SDK ping as Section 2.2)
  PASS:
    → UPDATE agents SET endpoint_url = coolify_url   -- SDK endpoint, not embed URL
    → UPDATE managed_hosting SET status = 'active', hosted_url
    → Email seller: "Your agent is live on AI Genius infrastructure"
    → Seller receives SDK credentials via dashboard (same flow as Section 2.2)
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

Seller changes their endpoint URL without updating dashboard:
  → Connection test on registered URL will fail
  → Auto-suspend triggered (Section 3.7)
  → Seller must update endpoint URL in dashboard + pass re-test

Seller tries to exfiltrate buyer data via their backend:
  → Seller backend only receives: userId, agentId, plan, messages/fields
  → No PII (email, name, payment info) is ever sent to seller endpoint
  → Platform NEVER sends buyer email or name in SDK request context
  → Unusual patterns (high error rates, suspicious response payloads):
    Admin alert via monitoring dashboard
  → SDK response is JSON/SSE text — no ability to inject scripts into platform UI
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
  4. Run SDK connection test on hosted URL
  5. On pass: Update agent.endpoint_url + notify seller with SDK credentials
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
                            │  - Worker: request proxy     │
                            │    (auth + rate limit)       │
                            │  - KV (suspension flags,     │
                            │    rate limit counters)      │
                            │  - Analytics Engine (perf)   │
                            └──────────────┬───────────────┘
                                           │
                     ┌─────────────────────┼──────────────────────┐
                     │                     │                      │
          ┌──────────▼──────┐   ┌─────────▼──────┐   ┌──────────▼──────┐
          │   VERCEL (CDN)  │   │  SUPABASE PGDB  │   │  SELLER BACKEND │
          │   Next.js App   │   │  Primary store  │   │  (any hosting)  │
          │  - SSR/SSG      │   │  - Users        │   │  @aigenius/sdk  │
          │  - API Routes   │   │  - Agents       │   │  installed      │
          │  - Platform UI  │   │  - Subs         │   │  Chat/Form/     │
          │    Chat/Form/   │   │  - Purchases    │   │  Workflow logic  │
          │    Workflow     │   │  - Settlements  │   └─────────────────┘
          └─────────────────┘   └─────────────────┘
                 │                      │
         ┌───────▼──────┐      ┌────────▼───────┐
         │    STRIPE    │      │  SUPABASE KV   │
         │  - Payments  │      │  - Sub cache   │
         │  - Webhooks  │      │  - Rate limits │
         │  (Platform   │      │  - Suspension  │
         │   Account)   │      └────────────────┘
         └──────────────┘

REQUEST FLOW (buyer using a tool):
  Browser → Next.js (/api/tools/:id/run)
    → withAuth (session check)
    → getActiveSubscription (KV cache)
    → Cloudflare Worker (rate limit + sign request)
    → Seller Backend (@aigenius/sdk verifies + runs AI)
    → SSE stream / JSON back through Worker → API route → browser
    
  Buyer NEVER directly contacts seller backend.
  Seller endpoint URL is never exposed to browser.
```

---

## 4.2 Request Flow — Agent SDK Call

```
User opens /tools/:agentId
        ↓
Next.js Server Component:
  1. Verify session (Supabase SSR)
  2. getActiveSubscription (KV cache — no DB hit if cached)
  3. Fetch agent config from DB (type, agentConfig, endpointUrl)
  4. Render platform AgentRuntime (Chat / Form / Workflow UI)
        ↓
User submits input (message / form fields / workflow step)
        ↓
Browser → POST /api/tools/:agentId/run
  1. withAuth middleware (session check)
  2. getActiveSubscription (KV cache)
  3. Build HMAC-signed request context
  4. Forward to Cloudflare Worker proxy
        ↓
Cloudflare Worker:
  1. Verify request came from platform (X-Platform-Worker-Secret)
  2. Check agent suspension (KV)
  3. Rate limit check (KV, 60 req/min per user per agent)
  4. Strip internal headers
  5. Forward to seller's SDK endpoint
  6. Log response time to Analytics Engine
        ↓
Seller SDK endpoint:
  1. agent.handler() auto-verifies HMAC signature
  2. Calls seller's AI logic
  3. Returns SSE stream (chat) or JSON (form/workflow)
        ↓
Response flows back:
  Worker → API Route → Browser
  Browser renders in platform Chat/Form/Workflow UI
  Seller backend never touched by buyer's browser
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
  
  -- Hosting (SDK model — v4)
  endpoint_url          VARCHAR(500),           -- Seller's registered SDK endpoint
  sdk_secret_encrypted  TEXT,                   -- HMAC secret for request signing (AES-256, Supabase Vault)
  sdk_version           VARCHAR(20),            -- e.g. '1.0.0' — for SDK compatibility checks
  agent_config          JSONB,                  -- { inputSchema?, starterMessage?, inputPlaceholder?, outputLabel? }
  -- inputSchema example (form agents):
  --   [{ id: 'jobTitle', label: 'Job Title', type: 'text', required: true },
  --    { id: 'yearsExp', label: 'Years of Experience', type: 'number', required: true }]
  
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
GET  /api/tools/:id/run                   Execute agent (proxied to seller SDK)

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
