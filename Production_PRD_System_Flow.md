# AI Genius Marketplace — Production PRD & System Flow
**Classification:** Internal Engineering — Top Secret  
**Version:** 1.0 | **Date:** 2026  
**Author:** Principal Systems Architect  
**Stack:** Next.js 16 · Supabase · Drizzle ORM · Stripe (Platform Only) · Cloudflare Workers · Coolify

> **Design & UX Guidelines:** Ensure all UI implementations draw inspiration from modern, premium designs. Use rich aesthetics, dynamic micro-animations, and seamless layouts. Reference sites like [https://getdesign.md/](https://getdesign.md/) for inspiration.

> This document defines the complete production-grade system for AI Genius Marketplace.  
> Every flow, every edge case, every system decision is grounded in real execution constraints.  
> No theory. No fluff. Build-ready.

---

## Table of Contents

- [Section 1 — User Journey (Agent Buyer)](#section-1--user-journey-agent-buyer)
- [Section 2 — Seller Journey (Agent Creator)](#section-2--seller-journey-agent-creator)
- [Section 3 — Admin Journey (Platform Owner)](#section-3--admin-journey-platform-owner)
- [Section 4 — System Architecture](#section-4--system-architecture)
- [Section 5 — Database Schema](#section-5--database-schema)
- [Section 6 — API Contracts](#section-6--api-contracts)
- [Section 7 — Edge Cases & Failure Handling](#section-7--edge-cases--failure-handling)
- [Section 8 — Observability & Monitoring](#section-8--observability--monitoring)

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
       EXISTS? → skip
       NEW?    → INSERT INTO users {
                   supabase_id, email, name,
                   avatar_url, role: 'buyer',
                   is_first_login: true,
                   created_at: NOW()
                 }
  3. Check callbackUrl param → same-origin validate
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

SELECT a.id, a.name, a.description, a.category,
       a.monthly_price_paise, a.avg_rating, a.review_count,
       COUNT(DISTINCT s.id) as active_subscribers
FROM agents a
LEFT JOIN subscriptions s ON a.id = s.agent_id AND s.status = 'active'
WHERE a.status = 'approved'
  AND ($category IS NULL OR a.category = $category)
  AND ($q IS NULL OR 
       to_tsvector('english', a.name || ' ' || a.description) 
       @@ plainto_tsquery($q))
GROUP BY a.id
ORDER BY 
  CASE WHEN $sort = 'rating'      THEN a.avg_rating END DESC,
  CASE WHEN $sort = 'popular'     THEN COUNT(s.id) END DESC,
  CASE WHEN $sort = 'newest'      THEN a.created_at END DESC,
  CASE WHEN $sort = 'price_low'   THEN a.monthly_price_paise END ASC
LIMIT 20

Cache: Cloudflare, TTL = 5 min
Invalidation: On agent approval or update
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
User clicks "Subscribe Now" or "Start Free Trial"
        ↓
Check: already subscribed?
  YES → "You already have access." + [Open Tool]
  NO  → Continue
        ↓
POST /api/checkout
Body: { agentId, planType: 'monthly' | 'annual' | 'trial' }
        ↓
Server executes:

1. Validate session + ownership check
2. Idempotency check:
   SELECT * FROM checkout_attempts 
   WHERE user_id = :uid AND agent_id = :aid 
   AND created_at > NOW() - INTERVAL '10 minutes'
   AND status = 'pending'
   → EXISTS? Return existing checkoutUrl
   → NOT EXISTS? Create new
   
3. Ensure Stripe Customer:
   SELECT stripe_customer_id FROM users WHERE id = :userId
   NULL? → stripe.customers.create({
     email, name,
     metadata: { userId, platform: 'aigenius' }
   }) → UPDATE users SET stripe_customer_id

4. Get Stripe Price ID:
   SELECT stripe_price_id_monthly FROM agents WHERE id = :agentId

5. Create Checkout Session:
   stripe.checkout.sessions.create({
     customer: stripeCustomerId,
     mode: 'subscription',
     line_items: [{ price: stripePriceId, quantity: 1 }],
     subscription_data: {
       trial_period_days: planType === 'trial' ? 7 : undefined,
       metadata: { userId, agentId, platform: 'aigenius' }
     },
     payment_intent_data: {
       // All funds settle to platform Stripe account. Platform handles manual payouts to sellers.
     },
     success_url: `${APP_URL}/tools/${agentId}?checkout=success`,
     cancel_url: `${APP_URL}/marketplace/${agentId}?checkout=cancelled`,
     expires_at: Math.floor(Date.now() / 1000) + 1800  // 30 min
   })

6. INSERT INTO checkout_attempts:
   { userId, agentId, sessionId, status: 'pending', checkoutUrl }
   
7. Return { checkoutUrl }
        ↓
Frontend redirects to Stripe-hosted checkout
        ↓
Payment completes → Stripe webhook fires
```

### Webhook Handler — Critical Path

```
POST /api/webhooks (raw body + Stripe-Signature header)

1. stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET)
   INVALID → 400 immediately
   
2. Event routing:
   checkout.session.completed:
     → INSERT INTO subscriptions {
         buyer_id, agent_id,
         stripe_subscription_id,
         stripe_customer_id,
         plan_type, status: 'active',
         current_period_start,
         current_period_end
       }
     → UPDATE checkout_attempts SET status = 'completed'
     → INSERT INTO purchases { amount, platform_fee, seller_payout }
     → Send confirmation email to buyer
     
   customer.subscription.deleted:
     → UPDATE subscriptions SET status = 'cancelled', cancelled_at
     → Send cancellation email
     
   invoice.payment_failed:
     → UPDATE subscriptions SET status = 'past_due'
     → Send payment failure email with update link
     → Schedule retry notification (Day 1, 3, 7)
     
   invoice.payment_succeeded (renewal):
     → UPDATE subscriptions SET 
         current_period_start, current_period_end, status: 'active'
     → INSERT INTO purchases (renewal record)

3. Return 200 within 30s (Stripe timeout)
   Use background jobs for heavy processing
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

```
User clicks "Open Tool" from dashboard
        ↓
/tools/[agentId] page loads
        ↓
Server-side subscription check (BEFORE page render):
  SELECT s.id, s.status, s.current_period_end
  FROM subscriptions s
  WHERE s.buyer_id = :userId 
    AND s.agent_id = :agentId
    AND s.status = 'active'
    AND s.current_period_end > NOW()
        ↓
NOT FOUND? → redirect /marketplace/:agentId
FOUND? → Generate embed token + render tool page
```

### Token Generation & Embed Flow

```
POST /api/tools/:agentId/token

Server:
  1. Verify subscription (same check as above)
  2. Generate signed JWT:
     {
       sub: userId,
       agentId,
       plan: subscriptions.plan_type,
       iat: now,
       exp: now + 300,  // 5 min
       jti: uuid()      // unique token ID (prevent replay)
     }
     signed with PLATFORM_SECRET (HS256)
  3. Store token ID in Redis/KV with TTL 5 min
     (for revocation capability)
  4. Return { token, expiresAt }
        ↓
Frontend loads ToolEmbed component:

<iframe
  ref={iframeRef}
  src={`${agent.embedUrl}?origin=${encodeURIComponent(APP_URL)}`}
  sandbox="allow-scripts allow-forms allow-same-origin"
  allow="clipboard-write"
  style={{ width: '100%', height: '100%', border: 'none' }}
  onLoad={handleIframeLoad}
/>

const handleIframeLoad = () => {
  iframeRef.current.contentWindow.postMessage(
    { 
      type: 'AI_GENIUS_AUTH',
      token,
      userId,
      agentId,
      platform: 'aigenius'
    },
    agent.allowedOrigin  // NEVER '*'
  );
};

// Auto-refresh every 4 minutes
useEffect(() => {
  const interval = setInterval(async () => {
    const { token } = await fetch(`/api/tools/${agentId}/token`, {
      method: 'POST'
    }).then(r => r.json());
    
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'AI_GENIUS_TOKEN_REFRESH', token },
      agent.allowedOrigin
    );
  }, 4 * 60 * 1000);
  
  return () => clearInterval(interval);
}, [agentId]);
```

### Cloudflare Worker — Branding Strip

```javascript
// Worker runs on every request to embedded tool

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const agentId = request.headers.get('X-Agent-ID');

    // 1. Suspension check (KV — O(1), no DB hit)
    const suspension = await env.AGENT_STATUS_KV.get(
      `agent:${agentId}:suspended`, 'json'
    );
    if (suspension?.suspended) {
      return maintenancePage(env);
    }

    // 2. Cache check for static assets
    const cache = caches.default;
    if (isStaticAsset(url)) {
      const cached = await cache.match(request);
      if (cached) return applyBrandingStrip(cached, env);
    }

    // 3. Fetch from seller origin
    const startTime = Date.now();
    let response;
    try {
      response = await fetch(request, { 
        signal: AbortSignal.timeout(8000)  // 8s hard timeout
      });
    } catch (e) {
      // Log failure, return 503
      await logPerformanceEvent(env, agentId, 8000, 503);
      return maintenancePage(env);
    }
    
    const responseTime = Date.now() - startTime;

    // 4. Log performance
    env.ANALYTICS.writeDataPoint({
      indexes: [agentId],
      doubles: [responseTime],
      blobs: [String(response.status)]
    });

    // 5. Cache static assets (7 days for CSS/JS)
    if (isStaticAsset(url) && response.ok) {
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', 'public, max-age=604800, immutable');
      const toCache = new Response(response.clone().body, { headers });
      event.waitUntil(cache.put(request, toCache));
    }

    // 6. Strip branding and return
    return applyBrandingStrip(response, env);
  }
};

function applyBrandingStrip(response, env) {
  return new HTMLRewriter()
    .on('title', {
      element: el => el.setInnerContent('AI Genius')
    })
    .on('link[rel="icon"]', {
      element: el => el.setAttribute('href', env.PLATFORM_FAVICON_URL)
    })
    .on('[class*="powered-by"], [id*="powered-by"]', {
      element: el => el.remove()
    })
    .on('footer', {
      element: el => el.remove()
    })
    .on('a[href]', {
      element: el => {
        const href = el.getAttribute('href');
        // Block external links to seller domain
        if (href && isExternalSellerLink(href, env)) {
          el.setAttribute('href', 'javascript:void(0)');
          el.setAttribute('data-blocked', 'true');
        }
      }
    })
    .transform(response);
}

function maintenancePage(env) {
  return new Response(
    `<!DOCTYPE html>
    <html>
      <head>
        <title>AI Genius</title>
        <link rel="icon" href="${env.PLATFORM_FAVICON_URL}">
        <style>
          body { 
            font-family: system-ui; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            height: 100vh; 
            margin: 0;
            background: #f9fafb;
          }
          .card {
            text-align: center;
            padding: 48px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          h2 { color: #111827; }
          p { color: #6b7280; }
          a { 
            color: #4f46e5; 
            text-decoration: none;
            font-weight: 500;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div style="font-size:40px">🔧</div>
          <h2>Tool temporarily unavailable</h2>
          <p>Our team is looking into it. Try again in a few minutes.</p>
          <a href="/dashboard">← Back to Dashboard</a>
        </div>
      </body>
    </html>`,
    { 
      status: 503,
      headers: { 'Content-Type': 'text/html' }
    }
  );
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
  [ ] Add Bank Account Details (for manual payouts)
  [ ] Accept Seller Terms of Service
  [ ] Complete profile (business name, contact)
```

### Settlement Setup — Bank Details

```
/dashboard/seller/onboarding/settlement

POST /api/sellers/settlement-details
Body: { accountHolderName, accountNumber, ifscCode, bankName }
        ↓
Server:
  1. Validate fields
  2. Encrypt sensitive details (or store securely)
  3. UPDATE seller_profiles SET bank_details = :details, settlement_setup_complete = true
        ↓
Seller can now receive payouts. Platform will process batch settlements to these accounts based on the billing cycle.
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
  // All funds settle to platform account. No automatic Stripe transfer.
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
  → Freeze all pending payouts to seller's bank account

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
│  Settlement: ✅ Bank Added  KYC: ✅ Complete  History: ✅ Clean  │
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
    → Seller payout clawed back automatically by Stripe

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

# SECTION 4 — SYSTEM ARCHITECTURE

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
                                │  - Connect     │
                                │  - Webhooks    │
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
  bank_details          JSONB,
  settlement_setup_complete BOOLEAN DEFAULT FALSE,
  tos_accepted_at       TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(buyer_id, agent_id, status)  -- prevent duplicate active subs
);

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

-- Indexes for performance
CREATE INDEX idx_subscriptions_buyer ON subscriptions(buyer_id);
CREATE INDEX idx_subscriptions_agent ON subscriptions(agent_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_agents_status_category ON agents(status, category);
CREATE INDEX idx_agents_featured ON agents(is_featured) WHERE is_featured = true;
CREATE INDEX idx_purchases_seller ON purchases(seller_id, created_at);
CREATE INDEX idx_agents_search ON agents 
  USING GIN(to_tsvector('english', name || ' ' || description));
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
POST /api/sellers/settlement-details     Save seller bank details
POST /api/sellers/agents/hosted          List hosted agent
POST /api/sellers/agents/workflow        List workflow agent
PUT  /api/sellers/agents/:id             Update listing
POST /api/sellers/agents/:id/resubmit    Re-request review
GET  /api/seller/dashboard               Revenue + stats
GET  /api/seller/agents/:id/analytics   Agent analytics
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
