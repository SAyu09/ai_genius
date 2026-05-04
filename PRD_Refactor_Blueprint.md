# AI Genius Marketplace — PRD & Refactor Blueprint
**Version:** 1.0 | **Date:** 2026 | **Classification:** Internal Engineering & Product  
**Authors:** Senior PM + Systems Architect  
**Status:** Ready for Engineering Review

---

## Table of Contents

1. [Product Understanding](#1-product-understanding)
2. [Gap Analysis](#2-gap-analysis)
3. [Complete Refactor PRD](#3-complete-refactor-prd)
4. [Technical Refactor Architecture](#4-technical-refactor-architecture)
5. [State Management Refactor](#5-state-management-refactor)
6. [API Refactor Plan](#6-api-refactor-plan)
7. [Database / Data Model Impact](#7-database--data-model-impact)
8. [Routing Logic](#8-routing-logic)
9. [Edge Cases](#9-edge-cases)
10. [Refactor Execution Plan](#10-refactor-execution-plan)
11. [Engineering Checklist](#11-engineering-checklist)
12. [Success Metrics](#12-success-metrics)

---

## 1. Product Understanding

### 1.1 Current Product State (from ARCHITECTURE.md)

**Platform Name (internal):** Getsell  
**Target Name (user-facing):** AI Genius Marketplace  
**Tech Stack:** Next.js 16+ App Router · Tailwind CSS v4 · Drizzle ORM · PostgreSQL (Supabase) · Supabase SSR Auth · Stripe Connect · S3/Supabase Storage

**Core Business Model:**  
A white-label AI tool marketplace where sellers list AI agents, buyers subscribe to them, and the platform takes a commission on every transaction. Seller identity is masked from buyers — the platform is the Merchant of Record.

---

### 1.2 What Is Already Completed

| Area | Status | Notes |
|---|---|---|
| Marketing pages (Hero, FAQ, layouts) | ✅ Done | Site components exist under `components/site/` |
| Dashboard base UI | ✅ Done | `/dashboard` route exists with basic layout |
| Auth pages UI | ✅ Done | `/sign-in` and `/sign-up` pages exist |
| Marketplace layout | ✅ Done | `/marketplace` route exists |
| Database schema (Drizzle ORM) | ✅ Done | `users`, `agents`, `purchases`, `reviews` tables defined |
| Middleware (route protection) | ✅ Done | Session check + redirect to `/sign-in` with `callbackUrl` |
| API folder skeletons | ✅ Done | agents, auth, checkout, purchases, sellers, upload, webhooks exist |
| Stripe checkout session creation | ✅ Done | `POST /api/checkout` implemented |
| Stripe webhook handler | ✅ Done | `POST /api/webhooks` implemented |
| Seller agent listing UI | ✅ Done | `/dashboard/list-agent` exists |
| Seller agent listing API | ✅ Done | `POST /api/sellers/agents` saves to DB |

---

### 1.3 Partially Completed Features

| Feature | What Works | What Is Missing |
|---|---|---|
| Auth flow | Supabase sign-in/sign-up exists | OTP email verification flow not explicitly implemented; Google OAuth not confirmed; post-auth redirect logic unclear |
| Buyer purchase flow | Stripe session creation + webhook exists | Post-payment tool unlock logic not confirmed; access gating on tools not implemented |
| File uploads | AWS SDK installed, API skeleton exists | `POST /api/upload` actual upload logic described as "bypassing real file uploads for demo" |
| Dashboard | Base UI exists | No "My Tools" section, no "Recommended for You", no category browsing, no tool detail page |
| Marketplace | Layout exists | No category grid, no tool detail pages, no ratings/reviews display |
| Reviews | `reviews` table exists in schema | No UI or API to submit/display reviews |

---

### 1.4 Missing Features (vs. New User Flow Document)

| Missing Feature | Priority | Notes |
|---|---|---|
| OTP email verification on signup | P0 | Required by new flow doc — 6-digit code |
| Google OAuth sign-in | P0 | Required by new flow doc |
| Post-auth redirect to dashboard (not homepage) | P0 | New users → dashboard, not marketing page |
| "My Tools" dashboard section | P0 | Core dashboard experience |
| "Explore" / category browsing on dashboard | P0 | Core discovery flow |
| Tool detail page | P0 | Pre-purchase decision screen |
| Subscription plan selector (monthly/annual) | P0 | Required before Stripe checkout |
| Post-payment tool unlock + access gate | P0 | Tool must be inaccessible without active subscription |
| Embedded tool viewer (iframe + token pass) | P0 | Core marketplace mechanic — tools load inside platform |
| Silent token handshake to seller tool | P0 | postMessage-based auth for embedded tools |
| Seller server performance auto-test on submit | P1 | Prevent slow tools from going live |
| Seller approval workflow (admin review) | P1 | Manual review before tool goes live |
| Branded "tool unavailable" fallback page | P1 | User-facing error when seller server is down |
| Subscription management (cancel, upgrade) | P1 | Billing settings page |
| Invoice download | P1 | Billing history |
| In-platform help chat widget | P2 | Support experience |
| "Recommended for You" personalisation | P2 | Based on usage history |
| Free trial activation + expiry logic | P2 | Trial access gating |
| Renewal failure notification email | P2 | Stripe webhook event handling |
| Offline detection banner | P2 | UX polish |
| Admin dashboard | P1 | To approve sellers and monitor platform |

---

### 1.5 Flow Mismatches: Current vs. New User Flow

| Area | Current Behaviour | Expected Behaviour |
|---|---|---|
| Post-signup redirect | Unclear / likely homepage | Must redirect to personalised dashboard |
| OTP verification | Not explicitly implemented | 6-digit OTP required for email signup; 60s resend cooldown |
| Google signup | Not confirmed | Required; no OTP needed for Google path |
| Dashboard content | Seller-centric (list-agent) | Buyer-centric: My Tools, Explore, Recommended |
| Tool access | No gating after purchase | Tools must be locked by default; unlocked on active subscription |
| Tool rendering | No embedded tool viewer | Tools open inside platform via iframe; seller branding stripped |
| Tool auth | No token handshake | postMessage token must be passed to seller iframe silently |
| Error states | Not implemented | Every error path needs defined UI and copy |
| Subscription billing | One-time purchase model | Recurring subscription model (monthly/annual) |
| Support | No in-platform support | Help chat widget on every screen |

---

## 2. Gap Analysis

### 2.1 Auth Flow

| Dimension | Current | Expected | Gap | Required Changes | Priority |
|---|---|---|---|---|---|
| Signup method | Email/password only (Supabase) | Email + Google OAuth | No Google OAuth | Add Supabase Google OAuth provider | P0 |
| Email verification | Not confirmed | 6-digit OTP, 10-min expiry | OTP flow missing | Implement OTP screen + resend + expiry logic | P0 |
| Post-signup redirect | Unknown | → Dashboard | Missing redirect | Set redirect to `/dashboard` after auth | P0 |
| Post-login redirect | Unknown | → Dashboard | Missing redirect | Honour `callbackUrl` if present, else `/dashboard` | P0 |
| Session persistence | Supabase SSR (working) | Same, must handle expiry gracefully | Expiry UX missing | Add session-expired modal/prompt | P1 |
| Forgot password | Not confirmed | Required | Likely missing UI | Add forgot-password flow (Supabase reset email) | P1 |

---

### 2.2 Signup / Login Flow

| Dimension | Current | Expected | Gap | Required Changes | Priority |
|---|---|---|---|---|---|
| Signup screen design | Basic form | Two-option screen (Google / Email) | Design mismatch | Redesign to show both options prominently | P0 |
| OTP input screen | Missing | 6-digit OTP screen after email signup | Screen missing | New OTP page/component | P0 |
| OTP resend | Missing | Allowed after 60 seconds | Not implemented | Add 60s countdown + resend trigger | P0 |
| Wrong credential error message | Likely generic | Specific copy per error type | Generic errors | Implement per-error copy (wrong password, no account, etc.) | P1 |
| Google account already linked error | Missing | Specific error message | Not handled | Handle Supabase OAuth conflict error | P1 |

---

### 2.3 New User Onboarding

| Dimension | Current | Expected | Gap | Required Changes | Priority |
|---|---|---|---|---|---|
| First-login experience | Lands on dashboard (basic) | Welcome state in dashboard, tool browsing | No onboarding state | Add `isFirstLogin` flag; show welcome UI | P1 |
| Category browsing | Missing | Category grid on dashboard | Not implemented | Build category grid + filter | P0 |
| Tool detail page | Missing | Full detail page before purchase | Not implemented | New route `/marketplace/[agentId]` | P0 |
| Trial vs. paid choice | Missing | Clear plan selector | Not implemented | Plan selection component pre-checkout | P0 |

---

### 2.4 Returning User Flow

| Dimension | Current | Expected | Gap | Required Changes | Priority |
|---|---|---|---|---|---|
| "My Tools" section | Missing | Shows subscribed tools | Not built | My Tools component querying `purchases` table | P0 |
| Tool access gate | Missing | Locked if no active subscription | Not built | Subscription check before tool load | P0 |
| Subscription status display | Missing | Shows active/expired per tool | Not built | Subscription status badge on tool cards | P1 |

---

### 2.5 Dashboard Entry Logic

| Dimension | Current | Expected | Gap | Required Changes | Priority |
|---|---|---|---|---|---|
| Dashboard routing | Single `/dashboard` | Role-aware: buyer dashboard vs. seller dashboard | No role split | Add `userRole` check; route to correct dashboard | P1 |
| Buyer dashboard content | Not built | My Tools + Explore + Recommended | Missing entirely | Build buyer dashboard layout | P0 |
| Seller dashboard content | Partially built | List agents + revenue stats | Partially built | Extend with revenue data, approval status | P1 |

---

### 2.6 Session Persistence

| Dimension | Current | Expected | Gap | Required Changes | Priority |
|---|---|---|---|---|---|
| Session refresh | Middleware handles it (working) | Same | No gap for basic case | Keep existing middleware | — |
| Expired session UX | No user-facing message | Prompt: "Session expired. Log in again." | UX missing | Add session-expired toast/modal | P1 |
| Multi-device logout | Not handled | Should invalidate other sessions | Not implemented | Use Supabase `signOut({ scope: 'global' })` option | P2 |

---

### 2.7 Feature Access Permissions

| Dimension | Current | Expected | Gap | Required Changes | Priority |
|---|---|---|---|---|---|
| Tool access check | No gating | Must verify active subscription | Not built | `checkSubscription(userId, agentId)` utility | P0 |
| Free trial access | Not built | Limited usage granted on trial activation | Not built | `subscriptions` table with `status: trial` | P1 |
| Expired subscription handling | Not built | Tool locked, renewal prompt shown | Not built | Subscription status check on tool open | P0 |

---

### 2.8 Error States

| Error | Current | Expected | Gap |
|---|---|---|---|
| Wrong password | Generic / none | Specific inline message | Needs copy + inline error component |
| Invalid OTP | Not built | Inline message + retry | OTP screen not built |
| Network failure | No handling | Offline banner + retry button | Not implemented |
| Tool unavailable | No fallback | Branded maintenance page | Not implemented |
| Payment declined | Stripe default | Custom in-platform error screen | Needs custom UI |
| API timeout | No handling | "Something went wrong" + retry | Not implemented |

---

### 2.9 API Dependencies

| API | Status | Depends On |
|---|---|---|
| `POST /api/auth/signup` | Supabase handles | OTP flow to be added |
| `POST /api/checkout` | Working | Subscription table (to be created) |
| `POST /api/webhooks` | Working | `subscriptions` table update on payment success |
| `GET /api/marketplace/agents` | Likely missing | `agents` table |
| `GET /api/marketplace/agents/[id]` | Missing | `agents` table |
| `GET /api/user/subscriptions` | Missing | `subscriptions` table (new) |
| `POST /api/tools/[agentId]/token` | Missing | Token generation + postMessage system |
| `POST /api/sellers/agents` | Working | `agents` table |
| `GET /api/seller/dashboard` | Missing | Revenue aggregation from `purchases` |
| `POST /api/admin/agents/approve` | Missing | Admin role + `agents.status` field |

---

## 3. Complete Refactor PRD

### 3.1 Problem Statement

The current Getsell codebase has a working foundation — auth middleware, database schema, Stripe integration, and UI skeletons — but it is misaligned with the product vision defined in the AI Genius User Flow Document in the following critical ways:

1. **No embedded tool experience:** The core marketplace mechanic (tools opening inside the platform, seller branding stripped, token passed silently) is entirely unbuilt.
2. **No subscription gating:** Tools are not locked behind active subscriptions. Any authenticated user could theoretically access any tool.
3. **Buyer dashboard is absent:** The dashboard is seller-centric. The buyer has no "My Tools" view, no category browsing, and no discovery experience.
4. **Auth flow is incomplete:** OTP verification and Google OAuth are not confirmed to be implemented.
5. **Error states are undefined:** No user-facing error handling for any common failure scenario.
6. **No seller approval workflow:** Sellers can list tools without any review or performance check, which risks poor user experience going live.

Without these components, the platform cannot be used by end users as described in the product vision.

---

### 3.2 Goals

- **G1:** Align all user-facing flows with the AI Genius User Flow Document
- **G2:** Implement subscription-based tool access gating
- **G3:** Build the embedded tool experience (iframe + token handshake)
- **G4:** Complete auth flows (OTP, Google OAuth, forgot password)
- **G5:** Build a complete buyer dashboard (My Tools, Explore, Recommendations)
- **G6:** Implement seller approval workflow with performance pre-check
- **G7:** Define and implement all error states
- **G8:** Refactor code structure for modularity and 1M+ user scale
- **G9:** Ensure zero regression on currently working components

---

### 3.3 Non-Goals

- Do NOT replace Supabase with another auth provider
- Do NOT replace Drizzle ORM with Prisma or any other ORM
- Do NOT change the PostgreSQL database engine
- Do NOT replace Stripe — only extend its usage
- Do NOT rebuild the marketing pages (Hero, FAQ) — they are complete
- Do NOT change the core Next.js App Router structure
- Do NOT build mobile apps in this phase

---

### 3.4 User Personas

#### Persona 1: New User (Buyer)
- Arrives via Google search or referral
- Has never created an account
- Wants to find and try an AI writing or HR tool
- Expects a simple, trustworthy signup
- Will be confused by any seller brand leaking through

#### Persona 2: Returning User (Buyer)
- Has an account and at least one active subscription
- Opens the platform to use a tool they use regularly
- Expects their tool to be right there, no re-login needed
- Will be frustrated if subscription status is wrong

#### Persona 3: Seller
- Has a working AI web app
- Wants new customers without building a marketing engine
- Needs a simple onboarding and clear revenue dashboard
- Concerned about their code being exposed

#### Persona 4: Logged-Out User
- May have an account but is not logged in
- Can browse the homepage and marketplace listings
- Cannot access tools or proceed to checkout without logging in
- Must be redirected cleanly to login with `callbackUrl`

---

### 3.5 Detailed User Journey (All Decision Branches)

```
ENTRY
│
├── Landing on homepage (public)
│   ├── New user → clicks "Sign Up"
│   │   ├── Chooses Google
│   │   │   ├── Google auth succeeds → redirect to /dashboard
│   │   │   └── Google account already linked → show error → redirect to /sign-in
│   │   └── Chooses Email
│   │       ├── Enters name + email + password
│   │       ├── Form validates → OTP sent → OTP screen shown
│   │       │   ├── Correct OTP → account created → redirect to /dashboard
│   │       │   ├── Wrong OTP → inline error → retry (max 3 attempts)
│   │       │   ├── OTP expired → auto-resend → new OTP screen
│   │       │   └── User exits → no account created → treated as new user next visit
│   │       └── Form invalid → inline validation errors shown
│   │
│   └── Returning user → clicks "Log In"
│       ├── Chooses Google → auth succeeds → redirect to /dashboard
│       └── Chooses Email
│           ├── Correct credentials → redirect to /dashboard (or callbackUrl)
│           ├── Wrong password → inline error + "Forgot Password" highlighted
│           ├── Email not registered → error + "Sign Up" link shown
│           └── Network error → retry button shown
│
DASHBOARD (authenticated)
│
├── Buyer Dashboard
│   ├── "My Tools" section
│   │   ├── Has active subscriptions → shows tool cards with status
│   │   └── No subscriptions yet → shows "Explore tools" CTA
│   │
│   ├── "Explore" section
│   │   ├── Category grid → user selects category → filtered tool list
│   │   └── Tool card → click → Tool Detail Page
│   │       ├── Free Trial available → "Try for Free" → trial activated → tool unlocked
│   │       └── Paid plan → "Subscribe" → Plan selector → Checkout
│   │           ├── Payment success → tool unlocked → redirect to tool
│   │           ├── Payment failed → error message → retry
│   │           └── User exits payment → tool stays locked
│   │
│   └── Tool Usage (subscribed tool)
│       ├── Tool available → opens embedded inside platform → token passed silently
│       │   ├── Task completed → output delivered
│       │   ├── Task abandoned → auto-save if possible
│       │   └── Session expires → prompt to re-login → work saved if possible
│       └── Tool unavailable → branded maintenance page shown
│
└── Account Management
    ├── Profile → update name/photo/email(OTP)/password
    ├── Billing → view subscriptions, cancel, update card, download invoices
    └── Support → help chat, FAQs, email ticket
```

---

## 4. Technical Refactor Architecture

### 4.1 Frontend Folder Structure

```
src/
├── app/                          # Next.js App Router — pages and API routes
│   ├── (marketing)/              # Route group: public marketing pages
│   │   ├── page.tsx              # Homepage
│   │   ├── pricing/page.tsx
│   │   └── sell/page.tsx
│   │
│   ├── (auth)/                   # Route group: unauthenticated auth flows
│   │   ├── sign-in/page.tsx
│   │   ├── sign-up/page.tsx
│   │   ├── verify-otp/page.tsx   # NEW — OTP verification screen
│   │   └── forgot-password/page.tsx  # NEW
│   │
│   ├── (dashboard)/              # Route group: authenticated area
│   │   ├── layout.tsx            # Shared dashboard layout (nav, sidebar)
│   │   ├── dashboard/
│   │   │   ├── page.tsx          # Buyer dashboard (My Tools + Explore)
│   │   │   └── seller/
│   │   │       └── page.tsx      # Seller dashboard (listings + revenue)
│   │   ├── marketplace/
│   │   │   ├── page.tsx          # Full marketplace browse
│   │   │   └── [agentId]/
│   │   │       └── page.tsx      # Tool detail page — NEW
│   │   ├── tools/
│   │   │   └── [agentId]/
│   │   │       └── page.tsx      # Embedded tool viewer — NEW
│   │   ├── billing/
│   │   │   └── page.tsx          # Subscription management — NEW
│   │   └── settings/
│   │       └── page.tsx          # Profile settings — NEW
│   │
│   └── api/                      # Backend API routes
│       ├── auth/                 # Auth helpers (OTP send, verify)
│       ├── agents/               # Public agent listing endpoints
│       ├── checkout/             # Stripe checkout session
│       ├── webhooks/             # Stripe webhook handler
│       ├── sellers/              # Seller-only endpoints
│       ├── subscriptions/        # NEW — subscription management
│       ├── tools/                # NEW — token generation for embedded tools
│       ├── admin/                # NEW — approval workflow
│       └── uploads/              # File upload
│
├── features/                     # Feature-scoped modules (business logic + UI)
│   ├── auth/
│   │   ├── components/           # SignInForm, SignUpForm, OTPInput, GoogleButton
│   │   ├── hooks/                # useAuth, useOTP, useSession
│   │   └── services/             # authService.ts — wraps Supabase auth calls
│   │
│   ├── marketplace/
│   │   ├── components/           # AgentCard, CategoryGrid, AgentDetailPanel
│   │   ├── hooks/                # useAgents, useAgentDetail, useCategories
│   │   └── services/             # marketplaceService.ts
│   │
│   ├── tools/
│   │   ├── components/           # ToolEmbed, ToolUnavailable, TokenBridge
│   │   ├── hooks/                # useToolAccess, useTokenHandshake
│   │   └── services/             # toolService.ts — access check + token
│   │
│   ├── subscriptions/
│   │   ├── components/           # PlanSelector, SubscriptionCard, BillingHistory
│   │   ├── hooks/                # useSubscriptions, useCheckout
│   │   └── services/             # subscriptionService.ts
│   │
│   ├── seller/
│   │   ├── components/           # AgentForm, RevenueCard, ApprovalStatus
│   │   ├── hooks/                # useSellerAgents, useRevenue
│   │   └── services/             # sellerService.ts
│   │
│   └── dashboard/
│       ├── components/           # MyTools, ExploreSection, RecommendedTools
│       ├── hooks/                # useDashboard
│       └── services/             # dashboardService.ts
│
├── components/
│   ├── ui/                       # shadcn/ui primitives (keep as-is)
│   ├── site/                     # Marketing components (keep as-is)
│   ├── layout/                   # NEW — AppShell, DashboardNav, Footer
│   └── shared/                   # NEW — ErrorBoundary, OfflineBanner, LoadingSpinner, Toast
│
├── hooks/                        # Global reusable hooks
│   ├── useUser.ts                # Current authenticated user
│   ├── useSubscription.ts        # Check subscription status
│   └── useToast.ts               # Toast notifications
│
├── services/                     # Pure API call wrappers (no UI concerns)
│   ├── api.ts                    # Axios/fetch base client with error handling
│   ├── stripe.ts                 # Stripe client helpers (keep + extend)
│   ├── storage.ts                # File upload (keep + extend)
│   └── supabase.ts               # Supabase client (rename from supabase-client.ts)
│
├── store/                        # Global state (Zustand or React Context)
│   ├── authStore.ts              # Auth state
│   ├── onboardingStore.ts        # Onboarding progress
│   └── uiStore.ts                # Modal open/close, loading states
│
├── lib/                          # Keep existing — utils.ts, auth.ts, stripe.ts
│
├── types/                        # TypeScript type definitions
│   ├── auth.types.ts
│   ├── agent.types.ts
│   ├── subscription.types.ts
│   └── seller.types.ts
│
├── utils/                        # Pure utility functions
│   ├── formatCurrency.ts
│   ├── formatDate.ts
│   └── cn.ts                     # Tailwind class merge (already in lib/utils.ts — move here)
│
├── middleware.ts                  # Keep existing + extend with role checks
├── db/                           # Keep as-is (schema.ts + index.ts)
└── assets/                       # Keep as-is
```

**Folder Responsibilities:**

- `app/` — Routing and page-level components only. No business logic.
- `features/` — Self-contained modules. Each feature owns its components, hooks, and service layer.
- `components/ui/` — Unstyled primitives from shadcn. Never modify these directly.
- `components/shared/` — Cross-feature UI components (error states, banners, loaders).
- `services/` — All external API calls. Never call `fetch` directly from a component.
- `store/` — Global state that needs to persist across routes.
- `types/` — Shared TypeScript interfaces. Keep types co-located with features for feature-specific types.

---

### 4.2 Backend Structure (API Routes)

```
src/app/api/
│
├── auth/
│   ├── send-otp/route.ts         # POST — send OTP to email
│   └── verify-otp/route.ts       # POST — verify OTP, complete signup
│
├── agents/
│   ├── route.ts                  # GET — list all approved agents (public)
│   └── [agentId]/
│       └── route.ts              # GET — single agent detail (public)
│
├── checkout/
│   └── route.ts                  # POST — create Stripe checkout session (keep + extend for subscriptions)
│
├── webhooks/
│   └── route.ts                  # POST — Stripe webhook (keep + extend for subscription events)
│
├── subscriptions/
│   ├── route.ts                  # GET — user's active subscriptions
│   └── [subscriptionId]/
│       └── route.ts              # DELETE — cancel subscription
│
├── tools/
│   └── [agentId]/
│       └── token/route.ts        # POST — generate short-lived access token for embedded tool
│
├── sellers/
│   ├── agents/
│   │   ├── route.ts              # POST — create agent listing (keep)
│   │   └── [agentId]/route.ts    # PUT/DELETE — update or remove listing
│   └── dashboard/route.ts        # GET — seller revenue + listing stats
│
├── admin/
│   └── agents/
│       ├── pending/route.ts      # GET — list agents awaiting approval
│       └── [agentId]/
│           └── approve/route.ts  # POST — approve or reject agent
│
└── uploads/
    └── route.ts                  # POST — file upload (complete implementation)
```

**Backend Separation of Concerns:**

Every `route.ts` file should follow this pattern:

```typescript
// route.ts — only handles HTTP concerns
export async function POST(req: Request) {
  const body = await req.json();
  const validated = validateSchema(body);           // validation layer
  const result = await agentService.create(validated); // service layer
  return NextResponse.json(result);
}
```

Business logic lives in `features/[feature]/services/`, not in route files. Route files should be under 30 lines.

---

## 5. State Management Refactor

### 5.1 Auth State

**Where:** Global — Zustand store (`authStore.ts`) + Supabase session listener

```typescript
interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: 'buyer' | 'seller' | 'admin' | null;

  // actions
  setUser: (user: User) => void;
  clearAuth: () => void;
  refreshSession: () => Promise<void>;
}
```

**Source of truth:** Supabase SSR session. Store is a mirror — never mutate directly without Supabase confirming.

---

### 5.2 Onboarding State

**Where:** Local to auth feature — can be `localStorage` or Supabase user metadata

```typescript
interface OnboardingState {
  hasCompletedSignup: boolean;
  isFirstLogin: boolean;
  emailVerified: boolean;
  otpAttempts: number;
  otpLastSentAt: Date | null;
}
```

`isFirstLogin` drives the welcome UI on the buyer dashboard. Set to `false` after first dashboard load.

---

### 5.3 User Profile State

**Where:** React Query / SWR cache — not global store (server state)

```typescript
interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  stripeCustomerId: string | null;
  role: 'buyer' | 'seller' | 'admin';
  createdAt: Date;
}
```

Fetched on dashboard load. Cached and refetched on profile update.

---

### 5.4 Dashboard State

**Where:** Local component state + React Query

```typescript
// Buyer dashboard
interface BuyerDashboardState {
  activeTab: 'my-tools' | 'explore' | 'recommended';
  selectedCategory: string | null;
  searchQuery: string;
}

// These are SERVER state — use React Query/SWR:
// - mySubscriptions: Subscription[]
// - exploreAgents: Agent[]
// - recommendedAgents: Agent[]
```

---

### 5.5 Feature Flags

**Where:** Environment variables + Supabase remote config (future)

```typescript
interface FeatureFlags {
  enableFreeTrials: boolean;         // false initially
  enableGoogleOAuth: boolean;        // true from Phase 1
  enableRecommendations: boolean;    // false initially (P2)
  enableCollaboration: boolean;      // false initially (P2)
  enableManagedHosting: boolean;     // false initially
}
```

---

### 5.6 Loading / Error States

**Rule:** Every async operation must have three states: `idle | loading | error | success`

```typescript
interface AsyncState<T> {
  data: T | null;
  status: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
}
```

Use React Query `status` + `error` fields. Do NOT use ad-hoc `isLoading: boolean` booleans scattered across components.

**Global vs. Local:**
- Global state: auth, user role, feature flags
- Local state: form state, pagination, search query, active tab
- Server state (React Query): subscriptions, agent listings, seller revenue

---

## 6. API Refactor Plan

### 6.1 Existing APIs

| API | Action | Request Schema | Response Schema | Error Handling |
|---|---|---|---|---|
| `POST /api/checkout` | **Keep + Extend** | `{ agentId, planType: 'monthly'|'annual'|'trial' }` | `{ checkoutUrl: string }` | 400 if no agentId; 401 if unauthenticated; 403 if already subscribed |
| `POST /api/webhooks` | **Keep + Extend** | Stripe raw body + signature header | `{ received: true }` | 400 if invalid signature; handle `payment_intent.succeeded`, `customer.subscription.deleted` |
| `POST /api/sellers/agents` | **Keep** | `{ name, description, tag, price, embedUrl, category }` | `{ agent: Agent }` | 401 unauthenticated; 403 if not seller role; 422 validation |
| `POST /api/upload` | **Complete implementation** | multipart/form-data | `{ url: string }` | 400 if no file; 413 if too large; 401 unauthenticated |

---

### 6.2 New APIs Required

| API | Purpose | Request | Response | Validation |
|---|---|---|---|---|
| `POST /api/auth/send-otp` | Send 6-digit OTP to email | `{ email: string }` | `{ sent: true, expiresAt: ISO }` | Valid email format; rate limit 1/min per email |
| `POST /api/auth/verify-otp` | Verify OTP and complete signup | `{ email, otp: string }` | `{ session: Session }` | 6 digits; not expired; max 3 attempts |
| `GET /api/agents` | List all approved agents | `?category=&search=&page=` | `{ agents: Agent[], total, page }` | Public route |
| `GET /api/agents/[agentId]` | Single agent detail | — | `{ agent: AgentDetail }` | Public route; 404 if not found |
| `GET /api/subscriptions` | User's active subscriptions | — | `{ subscriptions: Subscription[] }` | Requires auth |
| `DELETE /api/subscriptions/[id]` | Cancel subscription | — | `{ cancelledAt: ISO }` | Requires auth; must own subscription |
| `POST /api/tools/[agentId]/token` | Generate short-lived embed token | — | `{ token: string, expiresAt: ISO }` | Requires auth + active subscription for agentId |
| `GET /api/seller/dashboard` | Seller revenue + listing stats | — | `{ totalRevenue, listings: [], payouts: [] }` | Requires seller role |
| `GET /api/admin/agents/pending` | Agents awaiting approval | — | `{ agents: Agent[] }` | Requires admin role |
| `POST /api/admin/agents/[id]/approve` | Approve or reject listing | `{ approved: boolean, reason?: string }` | `{ agent: Agent }` | Requires admin role |

---

### 6.3 Missing API: Token for Embedded Tools

This is the most critical missing API. It powers the silent auth handshake.

**Flow:**
1. User opens `/tools/[agentId]`
2. Frontend calls `POST /api/tools/[agentId]/token`
3. Server verifies active subscription → generates signed JWT (5-min expiry)
4. Frontend loads seller iframe
5. On iframe load, frontend sends token via `postMessage` with `targetOrigin` = seller's domain
6. Seller tool receives token → calls `GET /api/auth/verify-token?token=xyz` → gets user info
7. Seller tool grants access

```typescript
// Token payload (signed with PLATFORM_SECRET)
interface EmbedToken {
  userId: string;
  agentId: string;
  plan: 'trial' | 'monthly' | 'annual';
  iat: number;
  exp: number; // iat + 300 (5 minutes)
}
```

---

## 7. Database / Data Model Impact

### 7.1 Schema Changes Required

#### New Table: `subscriptions`

```sql
CREATE TABLE subscriptions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id      UUID NOT NULL REFERENCES users(id),
  agent_id      UUID NOT NULL REFERENCES agents(id),
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_customer_id     VARCHAR(255),
  plan_type     VARCHAR(50)  NOT NULL, -- 'monthly' | 'annual' | 'trial'
  status        VARCHAR(50)  NOT NULL, -- 'active' | 'cancelled' | 'expired' | 'trial'
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  cancelled_at  TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### Modify Table: `agents`

Add columns:
```sql
ALTER TABLE agents ADD COLUMN embed_url    VARCHAR(500);  -- URL for iframe embed
ALTER TABLE agents ADD COLUMN category     VARCHAR(100);
ALTER TABLE agents ADD COLUMN status       VARCHAR(50) NOT NULL DEFAULT 'pending'; -- pending | approved | suspended
ALTER TABLE agents ADD COLUMN avg_rating   DECIMAL(3,2);
ALTER TABLE agents ADD COLUMN review_count INTEGER DEFAULT 0;
ALTER TABLE agents ADD COLUMN approved_at  TIMESTAMPTZ;
ALTER TABLE agents ADD COLUMN approved_by  UUID REFERENCES users(id);
```

#### Modify Table: `users`

Add columns:
```sql
ALTER TABLE users ADD COLUMN role         VARCHAR(50) NOT NULL DEFAULT 'buyer'; -- buyer | seller | admin
ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR(255); -- for buyers
ALTER TABLE users ADD COLUMN is_first_login BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN avatar_url   VARCHAR(500);
```

#### Deprecate / Replace: `purchases` table

The `purchases` table covers one-time purchases. For the subscription model, `subscriptions` is the primary table. Keep `purchases` for backward compatibility but new logic should write to `subscriptions`.

---

### 7.2 Migration Requirements

1. Generate migration: `npx drizzle-kit generate`
2. Add `status = 'approved'` to all existing `agents` records to avoid breaking current listings
3. Add `role = 'seller'` to existing seller users
4. Add `role = 'buyer'` to existing buyer users
5. Migrate existing `purchases` records to `subscriptions` with `plan_type = 'one_time'`, `status = 'active'`

---

### 7.3 Backward Compatibility

- `purchases` table must NOT be deleted — existing data is preserved
- All existing `agents` records default to `status = 'approved'` so they remain visible
- `stripeAccountId` on `users` table (for sellers) is unchanged
- Drizzle `relations` block must be updated to include `subscriptions` relations

---

## 8. Routing Logic

### 8.1 Route Map

| Route | Type | Access | Notes |
|---|---|---|---|
| `/` | Public | Everyone | Homepage / marketing |
| `/pricing` | Public | Everyone | Pricing page |
| `/sell` | Public | Everyone | Seller landing |
| `/marketplace` | Public | Everyone | Browse agents (read-only without auth) |
| `/marketplace/[agentId]` | Public | Everyone | Tool detail page |
| `/sign-in` | Auth | Unauthenticated only | Redirect to dashboard if already logged in |
| `/sign-up` | Auth | Unauthenticated only | Redirect to dashboard if already logged in |
| `/verify-otp` | Auth | Email signup flow only | Redirect if already verified |
| `/forgot-password` | Auth | Unauthenticated only | — |
| `/dashboard` | Protected | Authenticated | Role-aware content |
| `/dashboard/seller` | Protected | Seller role only | Redirect buyers to `/dashboard` |
| `/tools/[agentId]` | Protected | Active subscriber only | Redirect to tool detail if not subscribed |
| `/billing` | Protected | Authenticated | Subscription management |
| `/settings` | Protected | Authenticated | Profile settings |
| `/admin` | Protected | Admin role only | Approval dashboard |

---

### 8.2 Middleware Redirect Logic

```typescript
// middleware.ts — extended logic

export async function middleware(request: NextRequest) {
  const session = await getSession(request);
  const pathname = request.nextUrl.pathname;

  // 1. Protected routes — redirect unauthenticated to sign-in
  if (isProtectedRoute(pathname) && !session) {
    return NextResponse.redirect(
      new URL(`/sign-in?callbackUrl=${pathname}`, request.url)
    );
  }

  // 2. Auth routes — redirect authenticated users to dashboard
  if (isAuthRoute(pathname) && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 3. Seller routes — redirect buyers to their dashboard
  if (pathname.startsWith('/dashboard/seller') && session?.user.role !== 'seller') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 4. Admin routes — strict role check
  if (pathname.startsWith('/admin') && session?.user.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 5. Tool access — check subscription (done at page level, not middleware)
  // Middleware only checks authentication; subscription check is in the page

  return NextResponse.next();
}
```

---

### 8.3 Post-Auth Redirect Logic

```
Login/Signup success
        ↓
Does `callbackUrl` param exist?
   Yes → redirect to callbackUrl (validate it's same-origin)
   No  → check user role
          buyer  → /dashboard
          seller → /dashboard/seller
          admin  → /admin
```

---

## 9. Edge Cases

### 9.1 Interrupted Signup

**Scenario:** User completes sign-up form but closes browser before OTP entry.  
**Current:** Supabase may have created an unverified account.  
**Solution:** On next visit to `/sign-up` with the same email, check if an unverified account exists → resume OTP flow instead of showing error.  
**Implementation:** `POST /api/auth/send-otp` checks for existing unverified account before creating a new one.

---

### 9.2 OTP Expired

**Scenario:** User waits more than 10 minutes to enter OTP.  
**Solution:** Server returns `410 Gone` on verify call. Frontend auto-triggers resend and shows: "Your code expired. We've sent a new one."  
**Implementation:** Store `otp_expires_at` in a temporary `otp_requests` table or Supabase metadata.

---

### 9.3 Onboarding Incomplete

**Scenario:** User signs up, verifies email, but never subscribes to a tool.  
**Solution:** This is a valid state. User is on the dashboard with `isFirstLogin = true`. Show welcome prompt with "Explore Tools" CTA. Not an error state.

---

### 9.4 Token Expired During Tool Use

**Scenario:** User is using an embedded tool. The 5-minute embed token expires mid-session.  
**Solution:** Frontend proactively refreshes the token every 4 minutes (before expiry) by calling `POST /api/tools/[agentId]/token` silently. Pass new token via postMessage. User never sees interruption.

---

### 9.5 Refresh Token Failure

**Scenario:** Supabase refresh token fails (e.g., revoked from another device).  
**Solution:** Middleware catches the error → clears session cookie → redirects to `/sign-in` with message "Your session has expired. Please log in again."

---

### 9.6 API Failure During Checkout

**Scenario:** Stripe checkout session creation fails.  
**Solution:** `POST /api/checkout` returns 503. Frontend shows: "We couldn't start your checkout. Please try again." with retry button. Do NOT redirect away from tool detail page.

---

### 9.7 Duplicate Account

**Scenario:** User tries to sign up with email already linked to a Google account.  
**Solution:** Supabase will return an identity conflict error. Frontend maps this to: "An account with this email already exists. Try signing in with Google."

---

### 9.8 Logout from Multiple Devices

**Scenario:** User logs in on phone and laptop. Logs out on phone — should laptop session also end?  
**Default:** No. Sessions are independent.  
**Power user option (P2):** Add "Log out all devices" button in settings that calls `supabase.auth.signOut({ scope: 'global' })`.

---

### 9.9 Seller Server Goes Down After Approval

**Scenario:** Seller was approved, tool is live, then their server goes down.  
**Solution:** Cloudflare Worker detects failed requests → returns branded `503` → platform shows "Tool temporarily unavailable. Explore other tools." Seller is auto-alerted after 3 consecutive failures.

---

### 9.10 Subscription Webhook Missed

**Scenario:** Stripe fires `invoice.payment_failed` but webhook fails to process.  
**Solution:** Implement Stripe webhook retry tolerance. Subscription status should be checked freshly from Stripe on each tool access (not just rely on local DB) for mission-critical access decisions.

---

## 10. Refactor Execution Plan

### Phase 1: Auth Cleanup 

**Goal:** Complete and harden the auth flow end-to-end.

**Tasks:**
- [ ] Add OTP send/verify API endpoints (`/api/auth/send-otp`, `/api/auth/verify-otp`)
- [ ] Build `/verify-otp` page with 6-digit input, 60s resend timer, 3-attempt limit
- [ ] Enable Google OAuth in Supabase dashboard + frontend
- [ ] Add `/forgot-password` page + Supabase password reset flow
- [ ] Implement per-error copy on sign-in/sign-up pages (wrong password, no account, etc.)
- [ ] Add `role` column to `users` table (migration)
- [ ] Update middleware to redirect authenticated users away from auth routes
- [ ] Update post-auth redirect: honour `callbackUrl`, else role-based default

**Dependencies:** Supabase project access, email provider configured  
**Risk:** OTP delivery reliability — test with multiple email providers  
**Output:** Complete, tested auth flow with all error states handled

---

### Phase 2: Onboarding & Dashboard Refactor

**Goal:** Build the complete buyer dashboard experience.

**Tasks:**
- [ ] Add `is_first_login` column to `users` table
- [ ] Build buyer dashboard layout (My Tools + Explore sections)
- [ ] Build `CategoryGrid` component
- [ ] Build `AgentCard` component (name, description, rating, price, CTA)
- [ ] Build Tool Detail Page (`/marketplace/[agentId]`)
- [ ] Add `category`, `status`, `embed_url`, `avg_rating` columns to `agents` (migration)
- [ ] Build `GET /api/agents` endpoint with category filter + search + pagination
- [ ] Build `GET /api/agents/[agentId]` endpoint
- [ ] Add welcome state to dashboard for `isFirstLogin = true`

**Dependencies:** Phase 1 complete  
**Risk:** Performance of agent listing query — add indexes on `category` and `status`  
**Output:** Buyer can discover and explore tools after login

---

### Phase 3: Subscription & Payment Flow 

**Goal:** Implement subscription model end-to-end.

**Tasks:**
- [ ] Create `subscriptions` table (migration)
- [ ] Build `PlanSelector` component (monthly/annual/trial)
- [ ] Update `POST /api/checkout` to create Stripe Subscription (not one-time charge)
- [ ] Update `POST /api/webhooks` to handle `customer.subscription.created`, `customer.subscription.deleted`, `invoice.payment_failed`
- [ ] Build `GET /api/subscriptions` endpoint
- [ ] Build `DELETE /api/subscriptions/[id]` endpoint (cancel)
- [ ] Build Billing page (`/billing`) — active subscriptions + cancel + invoice download
- [ ] Implement access gate on tool open: check active subscription before loading

**Dependencies:** Phase 2 complete (tool detail page exists for plan selector)  
**Risk:** Stripe Subscription vs. Payment Intent — ensure webhook handles both  
**Output:** Users can subscribe, tools are gated, billing is manageable

---

### Phase 4: Embedded Tool Experience

**Goal:** Build the core iframe embed + token handshake system.

**Tasks:**
- [ ] Build `POST /api/tools/[agentId]/token` endpoint (signed JWT, 5-min expiry)
- [ ] Build `ToolEmbed` component (iframe wrapper + postMessage handler)
- [ ] Build `/tools/[agentId]` page (checks subscription → loads embed)
- [ ] Implement proactive token refresh (every 4 min)
- [ ] Build `ToolUnavailable` component (branded fallback)
- [ ] Build `GET /api/auth/verify-token` endpoint (for seller tools to verify tokens)
- [ ] Document token integration for sellers (SDK documentation)
- [ ] Add Cloudflare Worker basic branding injection (strip seller title/footer tags)

**Dependencies:** Phase 3 complete (subscription check required)  
**Risk:** postMessage origin validation — must be strict; CORS configuration on seller tools  
**Output:** Users can open subscribed tools inside the platform, silently authenticated

---

### Phase 5: Seller Approval & Admin

**Goal:** Add seller review workflow and admin dashboard.

**Tasks:**
- [ ] Build Admin dashboard (`/admin`) — list pending agents
- [ ] Build `POST /api/admin/agents/[id]/approve` endpoint
- [ ] Add performance pre-check on agent submission (ping embed URL, check response time)
- [ ] Update seller dashboard with approval status display
- [ ] Build seller revenue dashboard (`GET /api/seller/dashboard`)
- [ ] Add `approved_at`, `approved_by`, `status` fields to `agents` (included in Phase 2 migration)
- [ ] Set up admin role for platform owner in Supabase

**Dependencies:** Phase 4 complete  
**Risk:** Performance pre-check may be blocked by CORS on seller URLs — use server-side ping  
**Output:** Sellers can submit tools; admin approves; only approved tools show in marketplace

---

### Phase 6: QA + Regression Testing

**Goal:** Validate all flows, harden edge cases, fix regressions.

**Tasks:**
- [ ] Write E2E tests for: signup → OTP → dashboard → subscribe → tool open
- [ ] Write E2E tests for: all error scenarios (wrong OTP, failed payment, tool unavailable)
- [ ] Test all Stripe webhook events in Stripe test mode
- [ ] Test session expiry + refresh on all routes
- [ ] Test role-based routing (buyer, seller, admin)
- [ ] Load test tool embedding with 50 concurrent users
- [ ] Review and fix any remaining TypeScript errors
- [ ] Verify no seller branding leaks through in any tool embed

**Dependencies:** All phases complete  
**Risk:** Stripe webhook testing requires proper local tunnel setup (use Stripe CLI)  
**Output:** Production-ready system with documented test results

---

## 11. Engineering Checklist

### Auth
- [ ] Google OAuth enabled in Supabase project settings
- [ ] OTP table / metadata configured for 10-min expiry
- [ ] `/verify-otp` page built with 60s resend timer
- [ ] Per-error messages implemented on sign-in and sign-up
- [ ] Post-auth redirect honours `callbackUrl` param
- [ ] Middleware updated to handle role-based routing
- [ ] `forgot-password` flow implemented

### Database
- [ ] `subscriptions` table created and migrated
- [ ] `users.role` column added and populated
- [ ] `users.is_first_login` column added
- [ ] `agents.embed_url` column added
- [ ] `agents.status` column added (default: `pending`)
- [ ] `agents.category` column added
- [ ] All existing agents set to `status = 'approved'`
- [ ] Drizzle `relations` updated for all new tables
- [ ] Indexes added: `subscriptions(buyer_id)`, `subscriptions(agent_id)`, `agents(category)`, `agents(status)`

### API
- [ ] `POST /api/auth/send-otp` implemented + rate limited
- [ ] `POST /api/auth/verify-otp` implemented + attempt limited
- [ ] `GET /api/agents` implemented with pagination
- [ ] `GET /api/agents/[agentId]` implemented
- [ ] `GET /api/subscriptions` implemented
- [ ] `DELETE /api/subscriptions/[id]` implemented
- [ ] `POST /api/checkout` updated for Stripe Subscriptions
- [ ] `POST /api/webhooks` handles subscription events
- [ ] `POST /api/tools/[agentId]/token` implemented
- [ ] `GET /api/auth/verify-token` implemented (for sellers)
- [ ] `GET /api/seller/dashboard` implemented
- [ ] `GET /api/admin/agents/pending` implemented
- [ ] `POST /api/admin/agents/[id]/approve` implemented

### Frontend
- [ ] Buyer dashboard (My Tools + Explore) built
- [ ] Tool Detail page built
- [ ] `ToolEmbed` component with iframe + postMessage built
- [ ] `ToolUnavailable` fallback component built
- [ ] `PlanSelector` component built
- [ ] Billing page built
- [ ] Settings page built
- [ ] Admin dashboard built
- [ ] `OfflineBanner` component implemented
- [ ] All error states have defined UI and copy
- [ ] `isFirstLogin` welcome state implemented on dashboard

### Security
- [ ] postMessage `targetOrigin` strictly validated (not `*`)
- [ ] Embed tokens signed with `PLATFORM_SECRET` env variable
- [ ] Embed tokens expire in 5 minutes
- [ ] Token refresh runs every 4 minutes proactively
- [ ] Subscription check runs server-side before token is issued
- [ ] All admin routes protected with role middleware
- [ ] Stripe webhook signature verified on every call
- [ ] `callbackUrl` validated to be same-origin before redirect

### Seller Experience
- [ ] Seller submission form includes `embed_url` and `category` fields
- [ ] Performance pre-check runs on embed URL before approval
- [ ] Approval status visible in seller dashboard
- [ ] Seller revenue dashboard shows transaction history

---

## 12. Success Metrics

### 12.1 User Journey Metrics

| Metric | Baseline (Pre-refactor) | Target (Post-refactor) | How to Measure |
|---|---|---|---|
| Signup completion rate | Unknown | >70% | (Accounts created / Signup page visits) |
| OTP verification success rate | N/A | >90% | (OTP verified / OTP sent) |
| Auth failure rate | Unknown | <5% | (Failed login attempts / Total login attempts) |
| Post-login dashboard load success | Unknown | >99% | Dashboard 200 responses / Total auth completions |
| Tool subscription conversion | Unknown | >15% | (Subscriptions / Tool detail page views) |
| Tool embed load success rate | N/A | >99.5% | (Successful iframe loads / Attempted opens) |

---

### 12.2 Performance Metrics

| Metric | Target | Notes |
|---|---|---|
| OTP delivery time | <10 seconds | P95 |
| Dashboard initial load | <1.5 seconds | LCP |
| Tool embed load | <2 seconds | From click to iframe ready |
| API response time (p95) | <300ms | For all non-AI endpoints |
| Stripe webhook processing | <2 seconds | From event received to DB updated |

---

### 12.3 Code Quality Metrics

| Metric | Target | Notes |
|---|---|---|
| TypeScript coverage | 100% | No `any` types in new code |
| API route file length | <30 lines | Business logic in service layer |
| Test coverage (critical paths) | >80% | Auth, checkout, tool access flows |
| Zero regressions on existing flows | 100% | Marketing pages, seller listing, Stripe webhook |
| Reduction in duplicated code | >40% | Measured by shared service usage |

---

### 12.4 Business Metrics 

| Metric | Target |
|---|---|
| Sellers onboarded | 5–10 approved sellers |
| Active buyer accounts | 50+ |
| Successful tool sessions | 200+ |
| Subscription conversion rate | >10% of registered users |
| Zero seller brand leaks reported | 100% brand integrity |

