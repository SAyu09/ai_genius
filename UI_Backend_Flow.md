# AI Genius Marketplace — UI & Backend Flow
**Version:** 1.0 | **Date:** 2026  
**Document Type:** UI + Backend Flow Reference  
**Covers:** User · Seller · Admin (Platform Owner)

---

## How to Read This Document

Every section follows this pattern:

```
What user SEES on screen  →  What happens in BACKEND
```

Three perspectives, fully mapped:
- **Part 1 — User Flow** (buyer who uses AI tools)
- **Part 2 — Seller Flow** (company that lists their AI tool)
- **Part 3 — Admin Flow** (you — the platform owner)

---

# PART 1 — USER FLOW

---

## 1.1 Landing on the Platform

### UI (What User Sees)

```
┌──────────────────────────────────────────────────────┐
│  AI Genius                          [Sign In]         │
├──────────────────────────────────────────────────────┤
│                                                      │
│     One platform. 50+ AI tools.                      │
│     Writing · HR · Finance · Legal · Marketing       │
│                                                      │
│           [Get Started Free →]                       │
│                                                      │
├──────────────────────────────────────────────────────┤
│  Featured Tools                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ Writing  │  │ HR Auto  │  │ Legal AI │           │
│  │ ⭐ 4.8   │  │ ⭐ 4.6   │  │ ⭐ 4.9   │           │
│  │ Rs 499/m │  │ Rs 999/m │  │ Rs 1499/m│           │
│  └──────────┘  └──────────┘  └──────────┘           │
└──────────────────────────────────────────────────────┘
```

### Backend (What Happens)

```
User browser hits aigenius.com
        ↓
Next.js serves static homepage (no DB call)
        ↓
Cloudflare CDN serves cached page — fast globally
        ↓
Featured tools: GET /api/agents?featured=true&limit=6
        ↓
DB query: SELECT * FROM agents 
          WHERE status = 'approved' AND featured = true
          ORDER BY avg_rating DESC LIMIT 6
        ↓
Returned to page as props (Server Component)
```

---

## 1.2 Sign In / Sign Up

### UI (What User Sees)

```
┌──────────────────────────────────┐
│         AI Genius                │
│                                  │
│   Access 50+ AI tools in         │
│   one place                      │
│                                  │
│  ┌────────────────────────────┐  │
│  │  G  Continue with Google   │  │  ← Single button
│  └────────────────────────────┘  │
│                                  │
│  By continuing you agree to our  │
│  Terms & Privacy Policy          │
└──────────────────────────────────┘
```

No email field. No password. No OTP. One click.

### Backend (What Happens)

```
User clicks "Continue with Google"
        ↓
Frontend calls: supabase.auth.signInWithOAuth({ provider: 'google' })
        ↓
Browser redirects to: accounts.google.com
        ↓
User picks Google account
        ↓
Google sends auth code to: aigenius.com/auth/callback
        ↓
/auth/callback/route.ts runs:
  1. supabase.auth.exchangeCodeForSession(code)
  2. Session created in Supabase
  3. ensureUserRecord() runs:
       - Check if user exists in our DB
       - If new: INSERT INTO users (email, name, avatar, role='buyer', is_first_login=true)
       - If existing: skip insert
        ↓
Check: callbackUrl param exists?
  YES → redirect there (same-origin validated)
  NO  → redirect to /dashboard
```

### Error States — UI

| What Went Wrong | What User Sees |
|---|---|
| User closed Google popup | Nothing — button resets silently |
| Network error | "Sign-in failed. Check your connection." + Retry |
| Google auth error | "Something went wrong. Please try again." + Retry |

---

## 1.3 Buyer Dashboard (First Visit)

### UI (What User Sees)

```
┌──────────────────────────────────────────────────────┐
│  AI Genius    [Search tools...]       [👤 Rahul ▾]   │
├──────────────────────────────────────────────────────┤
│                                                      │
│  👋 Welcome to AI Genius, Rahul!                     │
│  Start by exploring tools below.                     │
│                                                      │
│  ─── Browse by Category ────────────────────────     │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │
│  │✍️ Write│ │👥 HR  │ │⚖️ Legal│ │💰 Finance│      │
│  └────────┘ └────────┘ └────────┘ └────────┘       │
│                                                      │
│  ─── My Tools ──────────────────────────────────    │
│  You haven't subscribed to any tools yet.            │
│  [Explore Tools →]                                   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Backend (What Happens)

```
Dashboard page loads (Server Component)
        ↓
Parallel DB queries:
  1. SELECT * FROM subscriptions 
     WHERE buyer_id = :userId AND status = 'active'
     → Empty for new user

  2. SELECT * FROM users WHERE id = :userId
     → is_first_login = true → show welcome banner

  3. SELECT DISTINCT category FROM agents
     WHERE status = 'approved'
     → Returns category list for grid

        ↓
After render: UPDATE users SET is_first_login = false
              WHERE id = :userId
              → Welcome banner won't show again
```

---

## 1.4 Buyer Dashboard (Returning User)

### UI (What User Sees)

```
┌──────────────────────────────────────────────────────┐
│  AI Genius    [Search tools...]       [👤 Rahul ▾]   │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ─── My Tools ─────────────────────────────────     │
│  ┌────────────────────────┐ ┌──────────────────┐    │
│  │ ✍️ AI Writing Tool      │ │ 👥 HR Automation  │   │
│  │ Active ✅  Rs 499/mo    │ │ Active ✅ Rs 999/mo│   │
│  │ [Open Tool →]          │ │ [Open Tool →]    │    │
│  └────────────────────────┘ └──────────────────┘    │
│                                                      │
│  ─── Explore More ──────────────────────────────    │
│  [Category grid below...]                            │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Backend (What Happens)

```
GET /api/subscriptions (authenticated)
        ↓
SELECT s.*, a.name, a.embed_url, a.category
FROM subscriptions s
JOIN agents a ON s.agent_id = a.id
WHERE s.buyer_id = :userId
  AND s.status = 'active'
  AND s.current_period_end > NOW()
        ↓
Returns active tool cards with status badges
```

---

## 1.5 Browsing the Marketplace

### UI (What User Sees)

```
┌──────────────────────────────────────────────────────┐
│  Category: Writing Tools                [← Back]     │
├──────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐ │
│  │ ✍️ AI Writing Pro                               │ │
│  │ Generate blogs, emails, and social posts        │ │
│  │ ⭐ 4.8 (234 reviews) · 1,200 users              │ │
│  │ Rs 499/month                [View Details →]   │ │
│  └─────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────┐ │
│  │ ✍️ Resume Builder AI                            │ │
│  │ ...                                             │ │
│  └─────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

### Backend (What Happens)

```
GET /api/agents?category=writing&page=1&limit=10
        ↓
SELECT a.*, 
       COUNT(DISTINCT s.id) as subscriber_count,
       AVG(r.rating) as avg_rating,
       COUNT(r.id) as review_count
FROM agents a
LEFT JOIN subscriptions s ON a.id = s.agent_id AND s.status = 'active'
LEFT JOIN reviews r ON a.id = r.agent_id
WHERE a.status = 'approved' AND a.category = 'writing'
GROUP BY a.id
ORDER BY avg_rating DESC, subscriber_count DESC
LIMIT 10 OFFSET 0
        ↓
Cloudflare caches this response for 5 minutes
(category listings don't change second-by-second)
```

---

## 1.6 Tool Detail Page

### UI (What User Sees)

```
┌──────────────────────────────────────────────────────┐
│  ✍️ AI Writing Pro                                   │
│  Generate blogs, emails, resumes and more            │
│                                                      │
│  ⭐ 4.8  ·  234 reviews  ·  1,200+ users             │
│                                                      │
│  ─── What you get ──────────────────────────────    │
│  ✅ Unlimited blog generation                        │
│  ✅ Email templates                                  │
│  ✅ Resume builder                                   │
│  ✅ Social media posts                               │
│                                                      │
│  ─── Choose a Plan ─────────────────────────────    │
│  ◉ Monthly     Rs 499/month                         │
│  ○ Annual      Rs 399/month  (Save 20%)             │
│                                                      │
│  [Start Free Trial]   [Subscribe Now →]             │
│                                                      │
│  ─── Reviews ───────────────────────────────────    │
│  ⭐⭐⭐⭐⭐  "Changed my content workflow"  - Priya  │
└──────────────────────────────────────────────────────┘
```

### Backend (What Happens)

```
GET /api/agents/:agentId
        ↓
SELECT a.*, 
       array_agg(r.*) as reviews
FROM agents a
LEFT JOIN reviews r ON a.id = r.agent_id
WHERE a.id = :agentId AND a.status = 'approved'
GROUP BY a.id
        ↓
Also check: Is user already subscribed?
SELECT * FROM subscriptions
WHERE buyer_id = :userId AND agent_id = :agentId
AND status = 'active'
→ If yes: show "Open Tool" button instead of subscribe
```

---

## 1.7 Payment & Subscription

### UI (What User Sees)

```
User clicks "Subscribe Now"
        ↓
┌──────────────────────────────────────────────────────┐
│  Stripe Checkout (embedded inside platform)          │
│                                                      │
│  AI Writing Pro — Monthly                           │
│  Rs 499.00 / month                                  │
│                                                      │
│  Card number:  [____ ____ ____ ____]                │
│  Expiry: [MM/YY]   CVV: [___]                       │
│                                                      │
│  [Pay Rs 499 →]                                     │
│                                                      │
│  🔒 Secured by Stripe · Billed by AI Genius         │
└──────────────────────────────────────────────────────┘

Payment Success:
┌──────────────────────────────────────────────────────┐
│  ✅ Payment Successful!                              │
│  AI Writing Pro is now unlocked.                     │
│  [Open Tool Now →]                                  │
└──────────────────────────────────────────────────────┘
```

### Backend (What Happens)

```
User clicks "Subscribe Now"
        ↓
POST /api/checkout
Body: { agentId, planType: 'monthly' }
        ↓
Server:
  1. Verify user is authenticated
  2. Check: not already subscribed?
  3. Create Stripe Customer if doesn't exist:
     stripe.customers.create({ email, metadata: { userId } })
  4. Create Stripe Checkout Session:
     stripe.checkout.sessions.create({
       customer: stripeCustomerId,
       mode: 'subscription',
       line_items: [{ price: stripePriceId, quantity: 1 }],
       payment_intent_data: {
         application_fee_amount: Math.round(amount * 0.15),
         transfer_data: { destination: seller.stripeAccountId }
       },
       success_url: '/tools/:agentId?success=true',
       cancel_url: '/marketplace/:agentId'
     })
  5. Return { checkoutUrl }
        ↓
User completes payment on Stripe
        ↓
Stripe fires webhook to: POST /api/webhooks
  Event: checkout.session.completed
        ↓
Webhook handler:
  1. Verify Stripe signature
  2. Extract: buyerId, agentId, stripeSubscriptionId, amount
  3. INSERT INTO subscriptions:
     { buyer_id, agent_id, stripe_subscription_id,
       plan_type: 'monthly', status: 'active',
       current_period_start, current_period_end }
  4. Split:
     platform_fee = amount * 0.15  → stays in platform Stripe
     seller_payout = amount * 0.85 → auto-transferred via Stripe Connect
  5. INSERT INTO purchases for audit trail
        ↓
User redirected to /tools/:agentId — tool now accessible
```

### Payment Error States — UI

| Situation | UI Message |
|---|---|
| Card declined | "Payment failed. Please try a different card." + retry |
| User exits checkout | Tool stays locked. No charge. No message. |
| Network error | "Checkout couldn't start. Please try again." + retry |
| Already subscribed | "You already have access. Open tool." |

---

## 1.8 Opening & Using a Tool

### UI (What User Sees)

```
User clicks "Open Tool"
        ↓
┌──────────────────────────────────────────────────────┐
│  AI Genius          ✍️ AI Writing Pro    [👤 Rahul]  │
│─────────────────────────────────────────────────────│
│                                                      │
│  [Tool loads here — fully inside our platform]       │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  What would you like to write today?          │   │
│  │                                               │   │
│  │  [Write a blog post about AI trends     ]     │   │
│  │  [Generate →]                                 │   │
│  │                                               │   │
│  │  Output:                                      │   │
│  │  The AI landscape in 2026 has seen...         │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ← AI Genius header always visible. Seller brand = 0 │
└──────────────────────────────────────────────────────┘
```

No redirect. No new tab. Tool runs inside our platform.

### Backend (What Happens)

```
User navigates to /tools/:agentId
        ↓
Server-side check (before page loads):
  SELECT * FROM subscriptions
  WHERE buyer_id = :userId AND agent_id = :agentId
  AND status = 'active' AND current_period_end > NOW()
  → Not found? Redirect to /marketplace/:agentId
  → Found? Proceed
        ↓
POST /api/tools/:agentId/token
        ↓
Server generates signed JWT:
  payload = {
    userId, agentId, plan: 'monthly',
    iat: now, exp: now + 300  ← 5 minute expiry
  }
  token = jwt.sign(payload, PLATFORM_SECRET)
        ↓
Frontend receives token
        ↓
ToolEmbed component loads iframe:
  <iframe
    src={agent.embedUrl}
    sandbox="allow-scripts allow-forms allow-same-origin"
  />
        ↓
On iframe 'load' event:
  iframe.contentWindow.postMessage(
    { type: 'AUTH_TOKEN', token },
    agent.allowedOrigin  ← strict origin, never '*'
  )
        ↓
Cloudflare Worker intercepts iframe request:
  1. Checks AGENT_STATUS_KV → suspended? → serve maintenance page
  2. Strips seller branding (HTMLRewriter)
  3. Injects platform CSS variables
  4. Serves cached static assets from edge
  5. Forwards AI calls to seller origin
  6. Logs response time to Analytics Engine
        ↓
Token auto-refresh every 4 minutes:
  setInterval(() => {
    POST /api/tools/:agentId/token → new token
    → postMessage new token to iframe
  }, 4 * 60 * 1000)
```

### Tool Unavailable State — UI

```
┌──────────────────────────────────────────────────────┐
│  AI Genius                              [👤 Rahul]   │
│─────────────────────────────────────────────────────│
│                                                      │
│         🔧                                           │
│                                                      │
│   This tool is temporarily unavailable.              │
│   Our team is looking into it.                       │
│                                                      │
│   [← Explore Other Tools]                           │
│                                                      │
└──────────────────────────────────────────────────────┘
```

No seller name. No technical error. Just our brand.

---

## 1.9 Billing & Account Management

### UI (What User Sees)

```
┌──────────────────────────────────────────────────────┐
│  My Subscriptions                                    │
├──────────────────────────────────────────────────────┤
│  ✍️ AI Writing Pro                                   │
│  Rs 499/month · Renews: June 5, 2026                │
│  [Cancel]  [Download Invoice]                        │
│                                                      │
│  👥 HR Automation Pro                                │
│  Rs 999/month · Renews: June 12, 2026               │
│  [Cancel]  [Download Invoice]                        │
└──────────────────────────────────────────────────────┘
```

### Backend (What Happens)

```
GET /api/subscriptions
→ SELECT + JOIN subscriptions + agents
→ Returns active subscriptions with renewal dates

Cancel subscription:
DELETE /api/subscriptions/:id
→ stripe.subscriptions.update(id, { cancel_at_period_end: true })
→ UPDATE subscriptions SET status = 'cancelling', cancelled_at = NOW()
→ User retains access until current_period_end
→ Stripe fires customer.subscription.deleted webhook
  → UPDATE subscriptions SET status = 'cancelled'

Download invoice:
→ stripe.invoices.list({ customer: stripeCustomerId })
→ Returns PDF URL from Stripe
→ Invoice shows "AI Genius" — not seller name
```

---

# PART 2 — SELLER FLOW

---

## 2.1 Seller Landing & Registration

### UI (What Seller Sees)

```
┌──────────────────────────────────────────────────────┐
│  AI Genius — Sell Your AI Tool                       │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Reach 10,000+ users without building               │
│  your own marketing engine.                          │
│                                                      │
│  ✅ Free listing — no upfront cost                   │
│  ✅ You keep 85% of every transaction                │
│  ✅ We handle payments, billing, support             │
│  ✅ Your code stays on your server                   │
│                                                      │
│  [Become a Seller →]  ← Google OAuth button         │
└──────────────────────────────────────────────────────┘
```

### Backend (What Happens)

```
Seller clicks "Become a Seller"
        ↓
Google OAuth flow (same as user)
        ↓
/auth/callback runs → ensureUserRecord() creates user with role: 'buyer'
        ↓
POST /api/sellers/register
→ UPDATE users SET role = 'seller' WHERE id = :userId
→ Send welcome email to seller
        ↓
Redirect to /dashboard/seller
```

---

## 2.2 Stripe Connect Setup

### UI (What Seller Sees)

```
┌──────────────────────────────────────────────────────┐
│  Setup Payouts                                       │
│                                                      │
│  Connect your Stripe account to receive payments.   │
│  You'll receive 85% of every transaction.           │
│                                                      │
│  [Connect Stripe Account →]                         │
│                                                      │
│  ℹ️ Your banking details are handled by Stripe.      │
└──────────────────────────────────────────────────────┘
```

### Backend (What Happens)

```
Seller clicks "Connect Stripe"
        ↓
POST /api/sellers/stripe-connect
→ stripe.accountLinks.create({
    type: 'account_onboarding',
    return_url: '/dashboard/seller?stripe=connected',
    refresh_url: '/dashboard/seller/stripe-connect'
  })
→ Returns Stripe hosted onboarding URL
        ↓
Seller completes Stripe onboarding
        ↓
Redirect back → UPDATE users SET stripe_account_id = :id,
                stripe_onboarding_complete = true
```

---

## 2.3 Listing a Tool

### UI (What Seller Sees)

```
┌──────────────────────────────────────────────────────┐
│  List Your Tool                                      │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Tool Name:        [AI Writing Pro              ]    │
│  Category:         [Writing ▾]                      │
│  Short Description:[Generate blogs, emails...   ]    │
│  Monthly Price:    [Rs 499                      ]    │
│  Annual Price:     [Rs 399/month                ]    │
│  Embed URL:        [https://mytool.com/embed    ]    │
│  Features:         [Unlimited blog generation   ]    │
│                    [+ Add feature]                   │
│                                                      │
│  ⚠️ We'll run an automatic performance test on your  │
│     server before going live. Ensure it responds     │
│     in under 2 seconds.                              │
│                                                      │
│  [Submit for Review →]                              │
└──────────────────────────────────────────────────────┘
```

### Backend (What Happens)

```
Seller clicks "Submit for Review"
        ↓
POST /api/sellers/agents
Body: { name, category, description, monthlyPrice,
        annualPrice, embedUrl, features[] }
        ↓
Validation runs:
  - embedUrl: valid HTTPS URL
  - prices: positive integers
  - category: from allowed list
        ↓
INSERT INTO agents { ...data, status: 'testing', seller_id: userId }
        ↓
Background job fires: runPerformanceTest(agentId, embedUrl)
  ↓
  10 HTTP pings to embedUrl over 30 seconds (3s spacing)
  Calculate: avgMs, p95Ms, errorRate
  ↓
  PASS? (avg < 2000ms AND errorRate < 5%)
    YES:
      UPDATE agents SET status = 'pending_review'
      → Email admin: "New tool pending review"
    NO:
      UPDATE agents SET status = 'rejected_performance'
      → Email seller: performance report + 2 options
        ↓
Seller dashboard shows real-time status update
```

### Performance Fail Email to Seller

```
Subject: Action Required — Your tool submission needs attention

Your tool did not pass our performance check:

  Avg Response Time:  4.2 seconds  ❌  (limit: 2 seconds)
  Error Rate:         12%          ❌  (limit: 5%)

OPTION 1 — Fix your server
  Upgrade your hosting, then resubmit from your dashboard.
  [Resubmit →]

OPTION 2 — Let us host it
  Rs 500/month — we guarantee < 1 second load time.
  [Upgrade to Managed Hosting →]
```

---

## 2.4 Seller Dashboard — Tool Status

### UI (What Seller Sees)

```
┌──────────────────────────────────────────────────────┐
│  My Listed Tools                                     │
├──────────────────────────────────────────────────────┤
│  ✍️ AI Writing Pro                                   │
│                                                      │
│  [Just submitted]                                    │
│  Status: 🔄 Performance Testing...                   │
│                                                      │
│  [After test passes]                                 │
│  Status: ⏳ Pending Admin Review                     │
│                                                      │
│  [After admin approves]                              │
│  Status: ✅ Live                                     │
│  Subscribers: 47  |  Revenue: Rs 18,953/month       │
└──────────────────────────────────────────────────────┘
```

---

## 2.5 Seller Revenue Dashboard

### UI (What Seller Sees)

```
┌──────────────────────────────────────────────────────┐
│  Revenue Overview                    [May 2026 ▾]   │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Total Revenue:      Rs 18,953                      │
│  Platform Fee (15%): Rs  2,843                      │
│  Your Earnings:      Rs 16,110    ← 85%             │
│                                                      │
│  Active Subscribers:  47                            │
│  New this month:      12                            │
│  Churned:              3                            │
│                                                      │
│  ─── Your Tool Performance ─────────────────────    │
│  Avg Load Time:   1.4s  ✅                          │
│  Uptime:         98.7%  ✅                          │
│  P95 Load Time:   2.1s  ⚠️  (limit: 3s)            │
│                                                      │
│  [View Payout History] [Upgrade to Managed Hosting] │
└──────────────────────────────────────────────────────┘
```

### Backend (What Happens)

```
GET /api/seller/dashboard?month=2026-05
        ↓
Parallel queries:

1. Revenue:
   SELECT SUM(amount), SUM(platform_fee), SUM(seller_payout)
   FROM purchases
   WHERE seller_id = :userId
   AND created_at BETWEEN month_start AND month_end

2. Subscribers:
   SELECT COUNT(*) FROM subscriptions
   WHERE agent_id IN (seller's agents) AND status = 'active'

3. Performance (Cloudflare Analytics Engine):
   avg_response_ms, uptime_pct, p95_ms for last 30 days
        ↓
Combined response returned to dashboard
```

---

## 2.6 Auto-Suspend — Seller Notification & Recovery

### What Seller Gets (Email)

```
Subject: Your tool has been auto-suspended — action required

Tool: AI Writing Pro
Reason: Performance degradation (avg 3.8s > 2s limit for 15 min)
Users affected: 23 (shown maintenance page)

OPTION 1 — Fix your server
  Once fixed, click "Request Re-Review" in your dashboard.

OPTION 2 — Managed Hosting
  Rs 500/month — we guarantee under 1 second.
  [Upgrade →]
```

### Recovery UI

```
┌──────────────────────────────────────────────────────┐
│  AI Writing Pro — Suspended                         │
│                                                      │
│  Reason: Avg response 3.8s (limit: 2s)             │
│  Suspended: May 4, 2026 14:32                       │
│                                                      │
│  Steps to restore:                                  │
│  1. Fix your server                                 │
│  2. Click "Request Re-Review"                       │
│  3. We run a new performance test                   │
│  4. Pass → live again within 10 minutes             │
│                                                      │
│  [Request Re-Review →]  [Upgrade to Managed Hosting]│
└──────────────────────────────────────────────────────┘
```

### Backend (Auto-Suspend Flow)

```
Cloudflare Analytics Engine
        ↓
Aggregation job (every 5 minutes):
  Check per-seller avg response time
        ↓
avg > 2s for 15 consecutive minutes?
        ↓
UPDATE agents SET status = 'suspended',
  suspended_at = NOW(),
  suspension_reason = 'performance_auto'
        ↓
Write to Cloudflare KV (instant edge response):
  AGENT_STATUS_KV.put('agent:${agentId}', { suspended: true })
        ↓
Send seller email + notify admin
        ↓
All user requests to this tool now return branded maintenance page
(KV check is O(1) — no DB hit)

Seller clicks "Request Re-Review":
        ↓
POST /api/sellers/agents/:id/request-review
→ Run fresh performance test
→ PASS → status = 'pending_review' → admin approves → live
→ FAIL → seller email again with data
```

---

## 2.7 Managed Hosting Upgrade

### UI (What Seller Sees)

```
┌──────────────────────────────────────────────────────┐
│  Managed Hosting Plans                               │
├──────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐           │
│  │ Basic           │  │ Pro             │           │
│  │ Rs 500/month    │  │ Rs 1,500/month  │           │
│  │                 │  │                 │           │
│  │ ✅ < 1s load    │  │ ✅ < 500ms      │           │
│  │ ✅ Auto-restart │  │ ✅ Dedicated    │           │
│  │ ✅ We manage it │  │ ✅ Priority     │           │
│  │                 │  │    support      │           │
│  │ [Choose Basic]  │  │ [Choose Pro]    │           │
│  └─────────────────┘  └─────────────────┘           │
│                                                      │
│  Your Docker Image URL:                              │
│  [hub.docker.com/r/your-tool:latest        ]        │
│  [Submit →]                                         │
└──────────────────────────────────────────────────────┘
```

### Backend (What Happens)

```
Seller submits Docker image URL
        ↓
POST /api/sellers/agents/:id/managed-hosting
Body: { tier: 'basic', dockerImage: 'hub.docker.com/...' }
        ↓
INSERT INTO managed_hosting:
  { agent_id, seller_id, tier, docker_image, status: 'provisioning' }
        ↓
Stripe subscription created for hosting fee
        ↓
Admin notified: "New managed hosting request"
        ↓
Admin provisions in Coolify (1 click — see admin flow)
        ↓
Performance test runs on Coolify URL
  PASS → UPDATE agents SET embed_url = coolify_hosted_url
         Email seller: "Your tool is now hosted by us"
  FAIL → Admin contacts seller to fix Docker image
```

---

# PART 3 — ADMIN FLOW (YOU — PLATFORM OWNER)

---

## 3.1 Admin Dashboard Overview

### UI (What Admin Sees)

```
┌──────────────────────────────────────────────────────┐
│  AI Genius Admin                     [👤 Admin ▾]   │
├────────────┬─────────────────────────────────────────┤
│            │  Overview — Today                       │
│ 📊 Overview│                                         │
│ 🔍 Pending │  New signups:          12               │
│ ✅ Approved│  Active subscribers:  847               │
│ ⚠️ Suspended  Revenue today:       Rs 4,230          │
│ 📡 Monitor │  Platform fee today:  Rs   634          │
│ 🖥️ Hosting │                                         │
│ 👤 Users   │  ⚠️  2 tools pending review             │
│ 💰 Revenue │  ⚠️  1 tool auto-suspended today        │
│            │  ✅  0 active incidents                  │
└────────────┴─────────────────────────────────────────┘
```

### Backend (What Happens)

```
GET /api/admin/overview
        ↓
Parallel queries:
  1. SELECT COUNT(*) FROM users WHERE created_at > today_start
  2. SELECT COUNT(*) FROM subscriptions WHERE status = 'active'
  3. SELECT SUM(platform_fee) FROM purchases WHERE created_at > today_start
  4. SELECT COUNT(*) FROM agents WHERE status = 'pending_review'
  5. SELECT COUNT(*) FROM agents WHERE status = 'suspended'
        ↓
Combined dashboard stats response
```

---

## 3.2 Reviewing Pending Tools

### UI (What Admin Sees)

```
┌──────────────────────────────────────────────────────┐
│  Pending Review (2)                                  │
├──────────────────────────────────────────────────────┤
│  ✍️ AI Writing Pro                                   │
│  Seller: WriteBot Inc  |  Category: Writing          │
│  Price: Rs 499/month                                 │
│                                                      │
│  Performance Test Results ✅ PASSED                  │
│    Avg Response:  1.2s  ✅                           │
│    P95 Response:  1.8s  ✅                           │
│    Error Rate:    0.3%  ✅                           │
│    Tested:        5 min ago                          │
│                                                      │
│  Embed URL: https://writebот.com/embed              │
│  [Preview Tool in sandbox ↗]                        │
│                                                      │
│  Admin checklist:                                    │
│  □ No seller branding visible                       │
│  □ No external links to seller site                 │
│  □ No hidden contact details                        │
│                                                      │
│  [✅ Approve & Go Live]   [❌ Reject with reason]   │
└──────────────────────────────────────────────────────┘
```

### Backend (What Happens)

```
GET /api/admin/agents/pending
→ SELECT * FROM agents WHERE status = 'pending_review'
  ORDER BY created_at ASC (FIFO queue)

Admin clicks "Approve":
        ↓
POST /api/admin/agents/:id/approve
Body: { approved: true }
        ↓
UPDATE agents SET
  status = 'approved',
  approved_at = NOW(),
  approved_by = :adminUserId
        ↓
Email to seller: "Your tool is now live on AI Genius!"
        ↓
Tool appears in marketplace immediately (no cache invalidation needed
as marketplace query filters by status = 'approved')

Admin clicks "Reject":
        ↓
POST /api/admin/agents/:id/approve
Body: { approved: false, reason: "Seller branding visible in footer" }
        ↓
UPDATE agents SET
  status = 'rejected_manual',
  rejection_reason = :reason
        ↓
Email to seller with reason + fix instructions
```

---

## 3.3 Monitoring Live Tool Performance

### UI (What Admin Sees)

```
┌──────────────────────────────────────────────────────┐
│  Live Performance Monitor          🔄 Refreshes 60s  │
├──────────────────────────────────────────────────────┤
│  Tool               Avg    P95    Uptime   Status    │
│  ─────────────────────────────────────────────────  │
│  AI Writing Pro     1.2s   1.8s   99.8%   ✅ Good   │
│  HR Automation      0.8s   1.2s   100%    ✅ Good   │
│  Legal AI Tool      1.9s   2.8s   98.1%   ⚠️ Watch  │
│  Finance Bot        4.1s   6.2s   91.2%   🔴 Susp.  │
│                                                      │
│  Auto-suspend rule: avg > 2s for 15 min → suspended  │
└──────────────────────────────────────────────────────┘
```

### Backend (What Happens)

```
Data source: Cloudflare Analytics Engine (not DB)
        ↓
Every request through Cloudflare Worker logs:
  { agentId, responseTimeMs, statusCode, timestamp }
        ↓
Admin dashboard polls: GET /api/admin/performance
        ↓
Cloudflare Analytics Engine API:
  SELECT agentId,
         avg(responseTimeMs) as avg_ms,
         percentile(responseTimeMs, 95) as p95_ms,
         (1 - avg(isError)) * 100 as uptime_pct
  FROM analytics_events
  WHERE timestamp > NOW() - 30 minutes
  GROUP BY agentId
        ↓
Joined with agent names from DB
        ↓
Auto-suspend cron job (every 5 min, server-side):
  For each agent with avg > 2s for last 15 min:
    → Auto-suspend (see seller flow 2.6)
```

---

## 3.4 Managing Suspended Tools

### UI (What Admin Sees)

```
┌──────────────────────────────────────────────────────┐
│  Suspended Tools (1)                                 │
├──────────────────────────────────────────────────────┤
│  💰 Finance Bot                                      │
│  Seller: FinAI Ltd                                   │
│  Suspended: May 4, 2026 14:32  (auto — performance) │
│  Duration: 2 hours 14 min                            │
│  Users shown maintenance page: 23                   │
│                                                      │
│  Seller action: Requested re-review at 14:55        │
│  Re-test result: ✅ Now passing (avg 1.3s)           │
│                                                      │
│  [✅ Restore Tool]    [Keep Suspended]              │
└──────────────────────────────────────────────────────┘
```

### Backend (What Happens)

```
Admin clicks "Restore Tool"
        ↓
POST /api/admin/agents/:id/restore
        ↓
1. Run fresh performance test
   FAIL → block restore, show admin warning
   PASS → continue

2. UPDATE agents SET
   status = 'approved',
   suspended_at = NULL,
   suspension_reason = NULL

3. Delete from Cloudflare KV:
   AGENT_STATUS_KV.delete('agent:${agentId}')
   → Maintenance page immediately stops serving
   → Tool is live again within seconds

4. Email seller: "Your tool has been restored."

5. Log event for audit trail
```

---

## 3.5 Managed Hosting Provisioning

### UI (What Admin Sees)

```
┌──────────────────────────────────────────────────────┐
│  Managed Hosting Queue (1 pending)                   │
├──────────────────────────────────────────────────────┤
│  ✍️ AI Writing Pro — Basic Plan (Rs 500/month)       │
│  Seller: WriteBot Inc                                │
│  Docker: hub.docker.com/writebот/tool:latest         │
│  Requested: May 4, 2026 16:20                        │
│  Stripe: ✅ Subscription active                      │
│                                                      │
│  [▶ Provision in Coolify]                           │
└──────────────────────────────────────────────────────┘
```

### Backend (What Happens)

```
Admin clicks "Provision in Coolify"
        ↓
POST /api/admin/managed-hosting/:id/provision
        ↓
1. Coolify API call:
   POST coolify.internal/api/v1/applications
   { dockerImage, name: agentId, port: 3000 }
   → Returns { coolifyAppId, deployedUrl }

2. UPDATE managed_hosting SET
   coolify_app_id = :id,
   hosted_url = :url,
   status = 'running'

3. Run performance test on deployedUrl:
   PASS:
     UPDATE agents SET embed_url = deployedUrl
     UPDATE managed_hosting SET status = 'active'
     Email seller: "You're now hosted on AI Genius infrastructure"
   FAIL:
     UPDATE managed_hosting SET status = 'failed'
     Contact seller to debug Docker image
```

### Coolify Dashboard (Direct Access — Not in Admin Panel)

```
coolify.aigenius.internal

┌──────────────────────────────────────────────────────┐
│ Applications                                         │
│                                                      │
│ writebот-tool     ✅ Running  CPU: 12%  RAM: 340MB  │
│ hr-automation     ✅ Running  CPU:  8%  RAM: 210MB  │
│ legal-ai          ⚠️ High CPU  CPU: 89%  RAM: 780MB │
│ finance-bot       ❌ Crashed             RAM: —      │
│                                                      │
│ Server: Hetzner CX32 · 4 CPU / 8GB RAM             │
│ Used: 3.1 GB / 8 GB  ·  Containers: 4 / ~20 max    │
└──────────────────────────────────────────────────────┘
```

---

## 3.6 Platform Revenue Dashboard

### UI (What Admin Sees)

```
┌──────────────────────────────────────────────────────┐
│  Revenue — May 2026                                  │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Gross Revenue (all tools):  Rs 1,26,400            │
│  Platform Commission (15%):  Rs  18,960  ← yours    │
│  Managed Hosting Revenue:    Rs   5,000  ← yours    │
│  ─────────────────────────────────────────           │
│  Total Platform Earnings:    Rs  23,960             │
│  Infrastructure Cost:        Rs   6,000             │
│  Net Profit:                 Rs  17,960             │
│                                                      │
│  Top Performing Tools:                              │
│  1. HR Automation Pro    Rs 34,200  (63 subs)       │
│  2. AI Writing Pro       Rs 23,400  (47 subs)       │
│  3. Legal AI Tool        Rs 18,900  (13 subs)       │
│                                                      │
│  [Export CSV]    [View in Stripe ↗]                 │
└──────────────────────────────────────────────────────┘
```

### Backend (What Happens)

```
GET /api/admin/revenue?month=2026-05
        ↓
1. Platform commission:
   SELECT SUM(platform_fee) FROM purchases
   WHERE created_at BETWEEN month_start AND month_end

2. Hosting revenue:
   SELECT SUM(monthly_cost_paise) FROM managed_hosting
   WHERE status = 'active'

3. Top tools by revenue:
   SELECT agent_id, SUM(amount) as revenue,
          COUNT(DISTINCT buyer_id) as subscribers
   FROM purchases
   WHERE month = '2026-05'
   GROUP BY agent_id
   ORDER BY revenue DESC LIMIT 10

4. Infrastructure cost:
   From platform config (server cost input)
        ↓
Net profit calculated and returned
```

---

## 3.7 User Management

### UI (What Admin Sees)

```
┌──────────────────────────────────────────────────────┐
│  Users (1,247 total)              [Search by email] │
├──────────────────────────────────────────────────────┤
│  Name           Role    Subs  Joined        Action  │
│  ──────────────────────────────────────────────────  │
│  Rahul Sharma   Buyer    3    Apr 2, 2026   [View]  │
│  WriteBot Inc   Seller   —    Mar 15, 2026  [View]  │
│  Priya Kapoor   Buyer    1    May 1, 2026   [View]  │
└──────────────────────────────────────────────────────┘
```

### Backend (What Happens)

```
GET /api/admin/users?page=1&role=all&search=
        ↓
SELECT u.*,
       COUNT(s.id) as active_subscriptions,
       COUNT(a.id) as listed_tools
FROM users u
LEFT JOIN subscriptions s ON u.id = s.buyer_id AND s.status = 'active'
LEFT JOIN agents a ON u.id = a.seller_id AND a.status = 'approved'
GROUP BY u.id
ORDER BY u.created_at DESC
LIMIT 50 OFFSET 0
```

---

# APPENDIX — Complete System Summary

## Every Request — Which Layer Handles It

```
User's Browser
      ↓
Cloudflare Edge (global — nearest to user)
  → Is agent suspended? (KV lookup — O(1), no DB)
  → Cache hit for static assets? → serve instantly
  → Strip seller branding (HTMLRewriter — streaming)
  → Log response time (Analytics Engine)
  → Forward to origin only if needed
      ↓
Next.js Server (Vercel)
  → Middleware: authenticated? (Supabase session check)
  → Route to correct page or API handler
  → Server Components: DB queries as props
  → API Routes: business logic + DB writes
      ↓
Supabase PostgreSQL
  → Primary data: users, agents, subscriptions,
    purchases, reviews, managed_hosting
      ↓
Stripe
  → Subscription billing + renewal
  → Automatic 85/15 split via Stripe Connect
  → Webhook events → /api/webhooks
      ↓
Cloudflare KV
  → Suspension flags (read by edge — no DB hit)
      ↓
Coolify (Hetzner/DigitalOcean server)
  → Docker containers for managed hosting sellers
  → Health monitoring + auto-restart
```

---

## Agent Status Lifecycle

```
Seller submits
      ↓
'testing'              ← auto performance test running
      ↓
FAIL → 'rejected_performance'   ← seller must fix + resubmit
PASS → 'pending_review'         ← waiting for admin approval
      ↓
Admin rejects → 'rejected_manual'   ← seller must fix
Admin approves → 'approved'         ← LIVE in marketplace
      ↓
Performance degrades → 'suspended'  ← auto after 15min breach
      ↓
Seller fixes → requests review → test again
Admin restores → 'approved'         ← LIVE again
```

---

## Revenue Split — Every Transaction

```
User pays Rs 1,000
      ↓
Stripe receives Rs 1,000
      ↓
Stripe processing fee (~Rs 59): → Stripe keeps
      ↓
Platform commission (15% of Rs 1,000): Rs 150 → our Stripe account
Seller payout (85% of Rs 1,000):       Rs 850 → seller's Stripe account
      ↓
All automatic via Stripe Connect Destination Charges.
Zero manual transfers. Zero ledger management.
```

---

## Google OAuth — Why No Email/Password

```
Email + OTP path:         Google OAuth path:
─────────────────         ──────────────────
1. Enter email            1. Click "Continue with Google"
2. Enter password         2. Pick Google account
3. Wait for OTP email     3. Done ✅
4. Check email
5. Enter 6-digit code
6. Code expired? Retry
7. Done

Drop-off risk: HIGH       Drop-off risk: VERY LOW
Dev time: 1 week          Dev time: 1 day
```

---

*Document complete — UI and backend flow for User, Seller, and Admin.*
*Version 1.0 | AI Genius Marketplace | 2026*
