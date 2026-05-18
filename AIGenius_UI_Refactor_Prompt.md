# AI Genius Platform — Production UI/UX Refactor Prompt

**For:** AI coding agents (Cursor, Claude Code, v0, Bolt, Lovable, Windsurf)  
**Scope:** Frontend UI/UX layer only  
**Authored by:** Senior Product Designer + Senior Frontend Architect perspective  
**Version:** 1.0

---

## CRITICAL CONSTRAINT — READ FIRST

**You are refactoring the UI/UX layer ONLY.**

Do NOT change, remove, or rewrite any of the following:
- Business logic of any kind
- API calls, endpoints, HTTP methods, request/response shapes
- Authentication flows, session handling, middleware
- Form validations (client-side or server-side triggers)
- Data fetching hooks, SWR/React Query keys, server actions
- Routing structure, page paths, dynamic segments
- State management logic, store structure, reducers
- Database queries, Drizzle/Prisma schema references
- Stripe checkout flows, webhook handlers
- SDK integration logic, HMAC verification flows
- Supabase auth calls, RLS policies referenced in code
- Environment variables usage
- Any `if/else` logic, conditional rendering conditions
- Error handling logic (only the error UI may be improved)
- Permission checks, role-based access control

**The only things you may change:**
- JSX/HTML structure and element hierarchy
- CSS classes, Tailwind utilities, inline styles
- Component decomposition for visual clarity (extract purely presentational sub-components)
- Icon imports (swap to Lucide React — keep same semantic meaning)
- Animation/transition classes
- Color tokens, spacing, typography
- Loading skeletons, empty states, success/error UI presentation
- Responsive layout breakpoints

If you are unsure whether a change touches logic — **do not make it.**

---

## Platform Context

AI Genius is a B2B/B2C marketplace where sellers list AI agents (Chat, Form/Tool, n8n Workflow types) and buyers subscribe to use them. The platform handles:

- Seller onboarding: bank/payout details, SDK integration, agent listing
- Buyer experience: marketplace browse, subscription, tool usage
- Admin: approval queue, settlement management
- Revenue model: platform takes 15%, seller gets 85%, weekly NEFT settlement

**Existing pages observed (refactor all of these):**

1. `/` — Landing page (currently "sellgetai" branding, rename to "AI Genius" everywhere)
2. `/dashboard/list-agent` — List a New Agent (3 type cards: Chat Agent, Form/Tool, n8n Workflow)
3. `/dashboard/seller/listings` — My Listings (agent cards + Recent Transactions table)
4. `/dashboard/seller/billing` — Billing & Payout (bank details form + earnings summary)
5. `/dashboard/seller/developer` — Developer & API (SDK config panel + step-by-step docs)

---

## Design System — Establish These Tokens First

Before touching any page, create or update your global design system. Every component must reference these tokens — no hardcoded hex values anywhere.

### Color Palette

```css
:root {
  /* Brand */
  --color-brand-primary: #2563EB;        /* Indigo-blue — CTAs, links, active */
  --color-brand-primary-hover: #1D4ED8;
  --color-brand-primary-subtle: #EFF6FF;
  --color-brand-accent: #0EA5E9;         /* Sky blue — secondary accent */

  /* Neutrals */
  --color-gray-50:  #F9FAFB;
  --color-gray-100: #F3F4F6;
  --color-gray-200: #E5E7EB;
  --color-gray-300: #D1D5DB;
  --color-gray-400: #9CA3AF;
  --color-gray-500: #6B7280;
  --color-gray-600: #4B5563;
  --color-gray-700: #374151;
  --color-gray-800: #1F2937;
  --color-gray-900: #111827;

  /* Semantic */
  --color-success: #16A34A;
  --color-success-bg: #F0FDF4;
  --color-warning: #D97706;
  --color-warning-bg: #FFFBEB;
  --color-danger:  #DC2626;
  --color-danger-bg: #FEF2F2;
  --color-info:    #2563EB;
  --color-info-bg: #EFF6FF;

  /* Surfaces */
  --surface-page:    #F8FAFC;
  --surface-card:    #FFFFFF;
  --surface-raised:  #FFFFFF;
  --surface-overlay: rgba(17, 24, 39, 0.5);

  /* Borders */
  --border-default: #E5E7EB;
  --border-strong:  #D1D5DB;
  --border-focus:   #2563EB;
}
```

### Typography

Use **Geist** (Vercel's font — clean, modern, SaaS-native) via Google Fonts or next/font.  
Fallback: `system-ui, -apple-system, sans-serif`

```css
/* Scale */
--text-xs:   0.75rem;   /* 12px — captions, badges */
--text-sm:   0.875rem;  /* 14px — body, table cells, form labels */
--text-base: 1rem;      /* 16px — default body */
--text-lg:   1.125rem;  /* 18px — card titles */
--text-xl:   1.25rem;   /* 20px — section headers */
--text-2xl:  1.5rem;    /* 24px — page titles */
--text-3xl:  1.875rem;  /* 30px — dashboard hero numbers */
--text-4xl:  2.25rem;   /* 36px — landing hero */
--text-5xl:  3rem;      /* 48px — landing headline */

/* Weights: 400 regular, 500 medium, 600 semibold, 700 bold only */
/* Line heights: 1.4 tight (headings), 1.6 normal (body), 1.75 relaxed (long text) */
```

### Spacing System

Use Tailwind's default 4px base unit. Stick to: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64px.  
No odd spacing values like 7px, 13px, 22px.

### Border Radius

```
--radius-sm:  6px   (badges, tags, small inputs)
--radius-md:  8px   (buttons, inputs, small cards)
--radius-lg:  12px  (cards, modals, panels)
--radius-xl:  16px  (large cards, feature blocks)
--radius-2xl: 24px  (hero cards, landing sections)
--radius-full: 9999px (pills, avatars)
```

### Shadow Scale

```css
--shadow-xs: 0 1px 2px rgba(0,0,0,0.05);
--shadow-sm: 0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.05);
--shadow-md: 0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -1px rgba(0,0,0,0.05);
--shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.04);
--shadow-focus: 0 0 0 3px rgba(37,99,235,0.15);
```

---

## Component Library Standards

Every component must follow these rules exactly.

### Buttons

```
PRIMARY:   bg-brand-primary, white text, radius-md, h-10 (40px), px-4, font-medium
           hover: bg-brand-primary-hover + shadow-sm, transition 150ms
           active: scale(0.98)
           focus: shadow-focus ring

SECONDARY: bg-white, border border-gray-200, gray-700 text, same sizing
           hover: bg-gray-50

GHOST:     transparent, gray-600 text, no border
           hover: bg-gray-100

DANGER:    bg-danger, white text
ICON:      40x40px, radius-md, ghost style

SIZES:
  sm: h-8  (32px), px-3, text-sm
  md: h-10 (40px), px-4, text-sm  ← default
  lg: h-11 (44px), px-5, text-base
  xl: h-12 (48px), px-6, text-base  ← CTA only

Disabled: opacity-50, cursor-not-allowed, no hover effects
Loading: show spinner (Lucide Loader2, animate-spin) + keep button width fixed
```

### Form Inputs

```
INPUT BASE:
  height: 40px (h-10)
  border: 1px solid var(--border-default)
  border-radius: var(--radius-md)
  padding: 0 12px
  font-size: text-sm
  background: white
  color: gray-900

  focus: border-color border-brand-primary, shadow-focus, outline: none
  error: border-color danger, error message below in text-sm text-danger
  disabled: bg-gray-50, text-gray-400, cursor-not-allowed

LABEL: text-sm font-medium text-gray-700, margin-bottom 6px
HELPER TEXT: text-xs text-gray-500, margin-top 4px
ERROR TEXT: text-xs text-danger, margin-top 4px, flex items-center gap-1 + AlertCircle icon

SELECT: same as input, with ChevronDown icon right-aligned (custom styled, not browser default)
TEXTAREA: min-height 96px, same border/focus/radius as input, resize-y only

FIELD GROUPS: 
  label + input + helper/error all in a <div class="flex flex-col gap-1.5">
  Form grid: CSS Grid, 2 columns on desktop, 1 on mobile, gap-4
```

### Cards

```
STANDARD CARD:
  bg-white, border border-gray-200, radius-lg, shadow-sm
  padding: 20px 24px (p-5 px-6)

RAISED CARD (hover state):
  Same base + transition shadow 200ms
  hover: shadow-md, translate-y(-1px)

METRIC CARD (stat display):
  bg-white, border, radius-lg, p-6
  Label: text-xs font-medium text-gray-500 uppercase tracking-wide
  Value: text-3xl font-bold text-gray-900
  Trend: text-sm with ArrowUpRight (green) or ArrowDownRight (red)

AGENT LISTING CARD:
  border, radius-xl, p-5
  Left: icon/avatar 40x40 radius-lg bg-brand-subtle
  Middle: name (text-base font-semibold), description (text-sm text-gray-500)
  Right: badges + action menu
  Bottom: stats row (icon + text-sm text-gray-500)
```

### Badges / Status Chips

```
Base: inline-flex items-center gap-1, text-xs font-medium, px-2.5 py-0.5, radius-full

LIVE/ACTIVE:   bg-green-50  text-green-700  border border-green-200
PENDING:       bg-yellow-50 text-yellow-700 border border-yellow-200
REJECTED:      bg-red-50    text-red-700    border border-red-200
DRAFT:         bg-gray-100  text-gray-600   border border-gray-200
CHAT AGENT:    bg-blue-50   text-blue-700   border border-blue-200
FORM/TOOL:     bg-purple-50 text-purple-700 border border-purple-200
N8N WORKFLOW:  bg-orange-50 text-orange-700 border border-orange-200

Include a 6px filled circle before text for status badges (●)
```

### Tables

```
Container: border border-gray-200 radius-lg overflow-hidden shadow-xs

HEADER ROW:
  bg-gray-50, border-b border-gray-200
  text-xs font-medium text-gray-500 uppercase tracking-wide
  padding: 10px 16px

DATA ROWS:
  bg-white, border-b border-gray-100 (last row: no border)
  text-sm text-gray-700, padding: 14px 16px
  hover: bg-gray-50/50
  transition: background 100ms

EMPTY STATE (inside table):
  Center aligned, 80px padding
  Icon (Inbox, 32px, text-gray-300)
  Title: text-sm font-medium text-gray-500
  Sub: text-xs text-gray-400

AMOUNT COLUMN: font-mono text-gray-900
PAYOUT COLUMN: font-mono font-medium text-green-600
DATE COLUMN: text-gray-500
```

### Navigation Sidebar

```
WIDTH: 224px (fixed), full height, border-r border-gray-200, bg-white

LOGO AREA:
  height: 60px, px-4, flex items-center
  Logo: icon 28px + text-base font-bold text-gray-900
  No border-bottom — let content define the boundary

SECTION LABELS:
  text-xs font-medium text-gray-400 uppercase tracking-wider
  px-4, pt-5 pb-2

NAV ITEMS:
  height: 36px, px-3, radius-md, mx-2
  text-sm font-medium, flex items-center gap-2.5
  icon: 16px (Lucide), text-gray-400

  DEFAULT: text-gray-600, icon text-gray-400
  HOVER:   bg-gray-100, text-gray-800, icon text-gray-600
  ACTIVE:  bg-brand-subtle, text-brand-primary, icon text-brand-primary

BOTTOM SECTION:
  User avatar + name + "Sign out" link
  Avatar: 28px circle, bg-gray-200, initials, text-xs
  Separated by border-t border-gray-100

TRANSITION: all 150ms ease
```

### Page Header Pattern

```
Every dashboard page follows this exact structure:

<div class="page-header">
  <div>
    <h1 class="text-2xl font-bold text-gray-900">{Page Title}</h1>
    <p class="text-sm text-gray-500 mt-0.5">{Page subtitle}</p>
  </div>
  <div class="header-actions">
    {Primary CTA button if applicable}
  </div>
</div>

Spacing from sidebar to content: padding 32px (p-8)
Header margin-bottom: 24px (mb-6)
```

---

## Page-by-Page Refactor Instructions

### Page 1: Landing Page (`/`)

**Current state:** Basic hero with large text, two CTA buttons, floating agent cards around the hero.  
**Reference:** Stripe.com homepage, Linear.app, Lemon Squeezy

**Hero Section:**
```
Layout: Full-viewport hero, centered content, max-width 720px
Background: White with very subtle grid pattern overlay (CSS grid, 1px lines, 3% opacity)

Announcement bar (top of hero):
  Small pill badge: "● Live in 140+ countries" 
  bg-blue-50, border border-blue-200, text-blue-700, text-xs, radius-full, px-3 py-1

Headline (h1):
  Split line layout — do NOT change the text unless just cleaning up brand name:
  Line 1: "Buy, sell & deploy" — text-5xl font-bold text-gray-900
  Line 2: "intelligent agents" — same size, color: brand-primary, font-style: italic
  Line 3: "from anywhere." — text-5xl font-bold text-gray-900
  
  Animation: Lines stagger in on load — 
    translateY(20px) opacity(0) → translateY(0) opacity(1)
    Delays: 0ms, 100ms, 200ms
    Duration: 500ms, ease-out
    Use CSS @keyframes, NOT JS. Respect prefers-reduced-motion.

Subtitle:
  text-lg text-gray-500, max-width 480px, text-center, line-height 1.7
  margin-top: 20px

CTA Group:
  margin-top: 32px, flex items-center gap-3, justify-center
  Primary: "Browse marketplace →" — xl button, brand-primary
  Secondary: "List your agent" — xl button, ghost style with border

Search bar:
  max-width 480px, margin-top 48px
  height 52px, radius-xl, border-2 border-gray-200
  focus: border-brand-primary, shadow-focus
  Left: Search icon (16px, gray-400), placeholder "Search 2,400+ agents..."
  Right: "Search" button — brand-primary, h-9, radius-lg, absolute positioned inside

Floating agent cards (keep the concept, improve execution):
  4 cards positioned absolutely around hero (two left, two right)
  Card: bg-white, border, radius-xl, shadow-md, p-3 px-4, w-44
  Content: icon 20px + agent name text-sm font-medium + badge "● CategoryName · live"
  Animation: Float gently up-down, 6s period, each card offset by 1.5s
    transform: translateY(-8px) → translateY(0px), alternate infinite
    CSS only: @keyframes float
```

**Trust/Stats bar (below hero):**
```
6 stats in a horizontal row, dividers between
Items: "2,400+ Agents", "140+ Countries", "10K+ Buyers", "85% Seller Payout", "$0 Upfront", "Weekly Settlements"
Style: text-sm font-semibold text-gray-800 + text-xs text-gray-400 label below
Container: border-y border-gray-200, py-8, bg-gray-50/50
```

**How it works section (add this):**
```
3 steps: List → Subscribe → Use
Each: numbered circle (1/2/3, brand-primary), title (text-lg font-semibold), description (text-sm text-gray-500)
Layout: 3-column grid, center-aligned
```

**Footer:**
```
Minimal: logo left, "© 2026 AI Genius. All rights reserved." center, links right
bg-white, border-t border-gray-200, py-6
```

---

### Page 2: List a New Agent (`/dashboard/list-agent`)

**Current state:** 3 type selector cards (Chat Agent, Form/Tool, n8n Workflow) + form below  
**Problem:** Cards feel flat, form feels generic, no visual hierarchy between sections

**Agent Type Selector Cards:**
```
3 cards in a row, each equal width, clickable
UNSELECTED:
  border border-gray-200, bg-white, radius-xl, p-5
  Icon: 40x40 container, bg-gray-100, radius-lg, icon 20px text-gray-500
  Title: text-base font-semibold text-gray-800, mt-3
  Desc: text-sm text-gray-500, mt-1, line-height 1.5
  hover: border-gray-300, bg-gray-50, shadow-xs, cursor-pointer
  transition: all 200ms

SELECTED:
  border-2 border-brand-primary, bg-brand-subtle (blue-50), radius-xl, p-5
  Icon container: bg-brand-primary, icon white
  Title: text-brand-primary font-semibold
  Top-right: Checkmark circle (CheckCircle2, 16px, brand-primary)
  No hover animation when already selected

Type-specific icon choices:
  Chat Agent:    MessageSquare (Lucide)
  Form/Tool:     LayoutTemplate or Sliders (Lucide)
  n8n Workflow:  GitBranch or Workflow (Lucide)
```

**Form Sections:**
```
Divide the form into clearly labeled sections using a card-per-section pattern:

SECTION CARD style:
  bg-white, border border-gray-200, radius-xl, p-6, mb-4
  Section header inside: flex items-center gap-3
    Left: 32x32 icon container, bg-brand-subtle radius-lg, icon 16px brand-primary
    Right: title text-base font-semibold text-gray-900
           subtitle text-sm text-gray-500
  Divider: border-t border-gray-100, my-4
  Form fields below divider

SECTION 1: "Agent Configuration"
  Grid: 2 columns
  Fields: Agent Name, Tag, Category (select), Monthly Price

SECTION 2: "Integration"  
  Fields: Backend SDK Endpoint URL (full width)
  Below URL field: 
    Info box (bg-blue-50, border border-blue-200, radius-lg, p-3)
    Icon: Info (14px, blue-600)
    Text: "Your backend must implement @aigenius/sdk for HMAC verification"
    Link: "View Integration Docs →" (blue-600, text-sm)

SECTION 3: "Description & Media"
  Fields: Short Description (textarea), Full Description (textarea), Screenshots upload

Submit button: 
  Full width at bottom OR right-aligned
  "Publish Agent →" — xl size, brand-primary
  Below button: "text-xs text-gray-400 text-center" → "Your agent will be reviewed within 1–2 business days"
```

**Page layout:**
```
Max-width: 760px, centered (not full bleed)
Back link: "← Back to Listings" — text-sm text-gray-500, hover text-gray-700, mb-6
Page title above back link is WRONG — put title below back link
Title: "List a New Agent" text-2xl font-bold
Subtitle: "Publish your AI agent to thousands of buyers worldwide." text-sm text-gray-500 mt-1
```

**Integration Docs link in header:**
```
Keep the "Integration Docs" button in top-right of Agent Configuration section
Style: text-sm, border border-gray-200, radius-md, px-3 py-1.5, flex items-center gap-1.5
Icon: ExternalLink (12px)
hover: bg-gray-50
```

---

### Page 3: My Listings (`/dashboard/seller/listings`)

**Current state:** Flat card for each listing, transaction table below  
**Reference:** Linear issue list, Stripe Payments list

**Page header:**
```
Left: "My Listings" h1 + subtitle
Right: "+ Create Listing" button — brand-primary, md size, Plus icon left
```

**Agent listing card:**
```
bg-white, border border-gray-200, radius-xl, p-5
HOVER: shadow-md, border-gray-300, transition 200ms

Layout: flex, align-items center, gap-4

LEFT: Agent icon/avatar
  48x48, radius-xl, bg-brand-subtle
  Agent type icon (MessageSquare / LayoutTemplate / GitBranch), 22px, brand-primary

MIDDLE: Agent info (flex-1)
  Row 1: Agent name (text-base font-semibold text-gray-900)
          + type badge (Chat Agent / Form/Tool etc.)
          + status badge (Live / Pending / Rejected)
          — gap-2, flex items-center
  Row 2: Description (text-sm text-gray-500, line-clamp-1), mt-0.5
  Row 3: Stats row (mt-2, flex gap-4):
    "👥 1 active" → Users icon 14px + "1 active" text-sm text-gray-500
    "💰 $17.00 earned" → TrendingUp icon 14px text-green-500 + amount text-sm font-medium text-gray-700

RIGHT: Action group (flex items-center gap-2)
  "Edit" button — ghost, sm, Edit2 icon
  "View Stats" button — ghost, sm, BarChart2 icon  
  "View Marketplace" button — ghost, sm, ExternalLink icon
  OR: 3-dot MoreHorizontal menu containing all three
```

**Empty state (when no listings):**
```
Full card, center-aligned, py-16
Icon: Bot (48px, text-gray-200)
Title: "No agents listed yet" text-base font-semibold text-gray-500
Sub: "Create your first listing and start earning." text-sm text-gray-400 mt-1
CTA: "+ Create your first listing" — brand-primary button, mt-4
```

**Recent Transactions table:**
```
Section header: flex items-center gap-2
  TrendingUp icon (16px, brand-primary)
  "Recent Transactions" text-lg font-semibold text-gray-900

Table columns: AGENT, BUYER, AMOUNT, YOUR PAYOUT, DATE
  AGENT: flex items-center gap-2, small agent icon + agent name text-sm font-medium
  BUYER: avatar circle (24px, initials) + name text-sm
  AMOUNT: font-mono text-sm text-gray-700
  YOUR PAYOUT: font-mono text-sm font-semibold text-green-600
  DATE: text-sm text-gray-400

Row hover: bg-gray-50/50

Table container: mt-6, border border-gray-200 radius-xl overflow-hidden
```

---

### Page 4: Billing & Payout (`/dashboard/seller/billing`)

**Current state:** Setup Payouts form (bank details) + 3 metric cards at bottom  
**Problem:** Form is inside a beige/tan card which looks off-brand. Metrics are below fold.

**Refactor layout:**
```
2-column layout on desktop (60/40 split):
  LEFT: Form card
  RIGHT: Earnings summary (currently at bottom, move here)

On mobile/tablet: stack vertically, form first

Max-width: 900px centered
```

**Bank Account Details form card:**
```
bg-white, border border-gray-200, radius-xl, p-6 (NOT beige/tan background)

Header:
  "Setup Payouts" text-xl font-semibold text-gray-900
  Subtitle: "Provide your bank details to receive weekly payouts. You'll receive 85% of every transaction."
  Info pill below subtitle: 
    "🔒 Your details are encrypted with AES-256" 
    bg-gray-50, border border-gray-200, radius-lg, text-xs text-gray-500, p-2 px-3

Form grid (2-col on desktop, 1-col on mobile):
  Row 1: Account Holder Name | Bank Name
  Row 2: Account Number | IFSC Code
  Row 3: Account Type (select) | UPI ID (Optional)
  Full width: PAN Number
  
  IFSC field: Add "Validate IFSC" inline button on right of input (ghost, xs, text-brand-primary)
  PAN field: Add format hint below "Format: ABCDE1234F"
  
  All existing validations stay exactly as-is.

Submit button: "Submit for Verification" — full width, xl, brand-primary, mt-2
Below button: 
  Verification timeline: "⏱ Verification typically takes 1-2 business days"
  text-xs text-gray-400, text-center

VERIFIED STATE (if already verified):
  Show green banner at top: "✓ Bank account verified" bg-green-50 border border-green-200 text-green-700
  Replace form with read-only display + "Update Details" ghost button
```

**Earnings Summary (right column):**
```
3 stacked metric cards:

TOTAL EARNED:
  Icon: TrendingUp (20px, green-500), bg-green-50 rounded-lg p-2
  Label: "Total Earned" text-xs font-medium text-gray-500 uppercase
  Value: "$17.00" text-3xl font-bold text-gray-900
  Sub: "Lifetime earnings" text-xs text-gray-400

PENDING PAYOUT:
  Icon: Clock (20px, orange-500), bg-orange-50
  Label: "Pending Payout"
  Value: "$17.00"
  Sub: "Settles on 1st of month" text-xs text-gray-400

PLATFORM FEE:
  Icon: Receipt (20px, gray-400), bg-gray-100
  Label: "Platform Fee"
  Value: "$3.00"
  Sub: "15% commission" text-xs text-gray-400

Cards: bg-white, border border-gray-200, radius-xl, p-5, flex items-start gap-3
```

---

### Page 5: Developer & API (`/dashboard/seller/developer`)

**Current state:** "SDK Configuration Panel" with agent selector dropdown + step-by-step install guide  
**Reference:** Stripe Developer docs, Vercel integration pages, Clerk dashboard

**Page header:**
```
NOT a centered h1 — align left like all other dashboard pages
Title: "Developer & API" text-2xl font-bold
Subtitle: "Manage SDK credentials and integrate your backend with AI Genius."
```

**SDK Configuration Panel:**
```
Card: bg-white, border border-gray-200, radius-xl, overflow-hidden

Header strip: bg-gray-50, border-b border-gray-200, px-6 py-4
  Left: flex items-center gap-2
    Settings2 icon (16px, brand-primary) 
    "SDK Configuration" text-base font-semibold

Body: px-6 py-5

Step 1 — SELECT YOUR AGENT:
  Label: "1. Select your agent" text-xs font-medium text-gray-500 uppercase tracking-wide
  Select dropdown: full-width, shows all seller's agents by name
  
Step 2 — CREDENTIALS (shown after agent selected):
  2-column layout:
  LEFT:
    Label: "Agent ID"
    Value: monospace code block (bg-gray-900 text-green-400 text-sm, radius-md, p-3 px-4)
    Example: agt_a1b2c3d4e5f6
    Copy button: Copy icon, ghost, sm — on click: show "Copied!" tooltip for 2s

  RIGHT:
    Label: "SDK Secret"
    Value: masked "sk_live_••••••••••••••••"
    Two buttons: Eye icon "Reveal" + Copy icon "Copy"
    Warning below: "⚠ Never commit this to Git or share publicly." text-xs text-red-500

KEEP the "Select an agent to view its secret" placeholder text when no agent selected.
```

**Step-by-step integration guide:**
```
Vertical stepper component:

STEP INDICATOR (left side of each step):
  Blue circle with step number (1/2/3/4)
  Connected by vertical line between steps (2px, brand-primary, dashed)
  Completed steps: filled circle (brand-primary) + checkmark

EACH STEP CARD:
  bg-white, border border-gray-200, radius-xl, p-6, ml-10 (indent for connector)

STEP 1: "Install the SDK"
  Description text-sm text-gray-600
  Code block:
    bg-gray-950, border border-gray-800, radius-lg, p-4
    Monospace text-sm, syntax highlighted
    npm install @aigenius/sdk → green
    Top-right: Copy button (ClipboardCopy, 14px, text-gray-400, hover text-white)
    Top-right label: "TERMINAL" text-xs text-gray-500 font-mono

STEP 2: "Set environment variables"
  Code block with .env example:
    AIGENIUS_SECRET=sk_live_...
    AIGENIUS_AGENT_ID=agt_...

STEP 3: "Implement your handler"
  Language tabs: TypeScript | JavaScript | Python
  (tabs are visual only — keep whatever language content already exists)
  Larger code block, scrollable

STEP 4: "Register your endpoint"
  Endpoint URL input field + "Run Connection Test" button inline
  Status indicator:
    UNTESTED: gray dot + "Not tested yet"
    TESTING:  yellow dot + spinner + "Testing connection..."
    PASSED:   green dot + "Connection verified ✓"
    FAILED:   red dot + "Connection failed — check your endpoint"

Code blocks styling throughout:
  bg-gray-950, text-sm font-mono, radius-lg, p-4
  Line numbers (optional, subtle — text-gray-600)
  Keyword highlighting: blue-400
  Strings: green-400
  Comments: gray-500
  Never change the actual code content — only the styling wrapper
```

---

## Loading, Empty, and Error States

Apply these to EVERY page and component:

### Skeleton Loading

```
When data is fetching (loading=true):
  Replace content with skeleton placeholders
  
Skeleton base: bg-gray-200, radius-md, animate-pulse
  Animate: opacity 0.5 → 1 → 0.5, 1.5s ease-in-out infinite

Metric card skeleton: 3 lines — 60px wide label, 120px wide value, 80px wide sub
Agent card skeleton: avatar circle + 3 lines (name, desc, stats)
Table row skeleton: 5 cells of varying widths

Use Tailwind: class="animate-pulse bg-gray-200 rounded-md h-4 w-32"
Do NOT show spinners in the middle of the page — use skeleton.
```

### Empty States

```
Full-page empty (no data at all):
  flex items-center justify-center, min-height 300px
  Icon: Inbox or Bot, 48px, text-gray-200
  Title: text-base font-semibold text-gray-500, mt-3
  Subtitle: text-sm text-gray-400, mt-1
  CTA button: mt-5, brand-primary

Table empty (search returns nothing):
  Inside table body, single row spanning all columns
  py-12 text-center
  Icon: SearchX 32px text-gray-200
  "No results found" text-sm text-gray-400
```

### Error States

```
API error / fetch failed:
  Alert component:
    bg-red-50, border border-red-200, radius-lg, p-4
    flex items-start gap-3
    AlertCircle icon 18px text-red-500
    Title: "Something went wrong" text-sm font-medium text-red-700
    Desc: error.message text-sm text-red-600
    Retry button: ghost sm "Try again" — calls same fetch again

Form validation errors:
  Keep all existing validation logic
  Show error below each field: text-xs text-red-600 + AlertCircle icon 12px inline
  Field border: border-red-300, focus: border-red-500 shadow-[0_0_0_3px_rgba(220,38,38,0.1)]

Toast notifications:
  Use Sonner or react-hot-toast (whichever is already installed)
  Style: bg-gray-900 text-white for neutral, keep green/red for success/error
  Position: bottom-right
  Duration: 4000ms
  Keep all existing toast trigger logic
```

### Success States

```
Form submission success:
  Brief toast: "✓ Saved successfully" — green
  
  For bank details submit: 
    Replace form with success card (green border, checkmark, "Under verification")
    — do NOT break the existing success handler

Button loading state:
  Replace button text with: <Loader2 class="animate-spin h-4 w-4 mr-2"/> Loading...
  Button stays disabled during loading, returns to normal text on complete/error
  Width must not change — use min-width
```

---

## Animation Guidelines

All animations must respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Allowed animations:**
```
Page transitions:    fadeIn + slideUp 16px, 300ms ease-out
                     Only on initial page load, not on re-renders

Sidebar nav active:  background slide, 150ms ease
Card hover:          shadow + translateY(-1px), 200ms ease
Button hover:        background, 150ms ease
Button press:        scale(0.98), 100ms ease

Skeleton pulse:      opacity 0.5↔1, 1.5s ease-in-out infinite
Toast slide-in:      slideInFromRight 300ms ease-out

Floating hero cards: translateY(-8px)↔0, 6s ease-in-out infinite, alternate
                     Each card: animation-delay 0s, 1.5s, 3s, 4.5s

Badge status dot:    No animation (remove if there was a pulse/blink)

Type selector check: scale(0→1), 150ms ease — for CheckCircle2 appearing when selected

Code copy success:   "Copied!" tooltip: fadeIn 150ms, auto-hide after 1.5s
```

**NEVER animate:**
- Table row content
- Form field values
- Any element that carries data (numbers, names, emails)
- Navigation changes (just instant swap)
- Anything inside a loading skeleton (except the pulse itself)

---

## Responsive Behavior

### Breakpoints (Tailwind defaults)
```
sm:  640px+
md:  768px+
lg:  1024px+
xl:  1280px+
```

### Sidebar
```
Desktop (lg+): Fixed 224px sidebar, content offset by 224px
Tablet (md):   Sidebar collapses to icon-only (48px wide), labels hidden, tooltip on hover
Mobile (sm):   Sidebar hidden, hamburger menu top-left → slides in as overlay with backdrop
               Overlay: fixed, full-height, z-50, bg-white, shadow-xl, w-64
               Backdrop: fixed inset-0 bg-gray-900/50 z-40, click to close
```

### Content areas
```
Dashboard pages: 
  Desktop: p-8, max-width content (no max-width constraint — full available width)
  Tablet:  p-6
  Mobile:  p-4

Forms:
  Desktop: 2-column grid (grid-cols-2 gap-4)
  Mobile:  1-column (grid-cols-1)

Tables:
  Desktop: all columns visible
  Tablet:  hide low-priority columns (DATE becomes tooltip)
  Mobile:  horizontal scroll (overflow-x-auto), min-width 600px on table

Agent type selector cards:
  Desktop: 3 columns
  Tablet:  3 columns (smaller)
  Mobile:  1 column (stack vertically)

Billing page 2-column:
  Desktop: 60/40 split
  Mobile:  Full width, form first, earnings cards below

Metric cards:
  Desktop: 3 in a row
  Mobile:  Stack vertically
```

---

## Icon Standards

Use **Lucide React** exclusively. Import individually, never import the whole package.

```
Navigation icons:
  Overview:       LayoutDashboard
  My Listings:    Package
  Billing & Payout: CreditCard
  Developer & API: Code2
  Earnings:       DollarSign
  Marketplace:    Store
  Settings:       Settings

Agent type icons:
  Chat Agent:    MessageSquare
  Form/Tool:     LayoutTemplate
  n8n Workflow:  GitBranch

Action icons:
  Edit:     Pencil or Edit2
  Delete:   Trash2
  View:     Eye
  Copy:     ClipboardCopy
  External: ExternalLink
  More:     MoreHorizontal
  Plus:     Plus
  Back:     ArrowLeft
  Search:   Search
  Filter:   Filter
  Sort:     ArrowUpDown
  Refresh:  RotateCcw

Status icons:
  Success:  CheckCircle2 (green)
  Error:    AlertCircle (red)
  Warning:  AlertTriangle (yellow)
  Info:     Info (blue)
  Loading:  Loader2 (animate-spin)

Data icons:
  Revenue:  TrendingUp
  Users:    Users
  Stats:    BarChart2
  Payout:   Wallet
  Clock:    Clock
  Lock:     Lock

Size standards:
  Navigation: 16px (w-4 h-4)
  Inline with text: 14px (w-3.5 h-3.5)
  Card icons: 18-20px (w-5 h-5)
  Empty state: 40-48px (w-10 h-10 or w-12 h-12)
  Hero/marketing: 24-32px
```

---

## Accessibility Requirements

```
FOCUS:
  All interactive elements: visible focus ring — shadow-focus (3px ring, brand-primary 15% opacity)
  Never: outline: none without replacement
  Tab order must be logical (top-to-bottom, left-to-right)

COLOR CONTRAST:
  All text on white: min 4.5:1 ratio (WCAG AA)
  Large text (18px+): min 3:1
  Brand blue (#2563EB) on white: ✓ passes
  Gray-500 (#6B7280) on white: ✓ passes for large text, fail for small — use gray-600 minimum

ARIA:
  Keep all existing aria-label, aria-required attributes
  Status badges: aria-label="Status: Live" (not just color)
  Icon-only buttons: must have aria-label
  Loading states: aria-busy="true" on the loading container

FORMS:
  Every input has an associated <label> (htmlFor / id pair)
  Error messages: aria-describedby pointing to error element
  Required fields: aria-required="true" + visual * marker

KEYBOARD:
  Dropdown menus: Escape to close, Arrow keys to navigate
  Modal/overlay: focus trap inside, Escape to close, return focus on close
  Table: rows should be navigable with arrow keys if interactive
```

---

## What To Do With the Brand Name

The app in the screenshots shows "sellgetai" as branding. Update all visible text/logos to "AI Genius" everywhere in the UI layer:

```
Logo text: "AI Genius"  
Page titles: "AI Genius"
Email templates referenced in UI: "AI Genius"
Footer copyright: "© 2026 AI Genius"
SDK docs text: "@aigenius/sdk" (keep as-is — it's the actual package name)
```

Do NOT change: any API endpoint strings, environment variable names, package.json names, import paths.

---

## Final Quality Checklist

Before marking the refactor complete, verify:

```
□ No hardcoded hex values — all colors via CSS variables or Tailwind tokens
□ No pixel values outside the spacing system (4/8/12/16/20/24/32/40/48/64px)
□ Every interactive element has a hover + focus state
□ Every data-loading state has a skeleton
□ Every empty collection has an empty state with CTA
□ Every form error is visible, accessible, and styled correctly
□ All icons are Lucide React, sized consistently
□ Sidebar navigation active state works for all routes
□ Mobile layout tested at 375px viewport — nothing overflows
□ No hardcoded text colors (no color: #333 etc.) — all via Tailwind
□ All existing API calls, hooks, validations, and logic untouched
□ No new dependencies added without necessity — use what's installed
□ prefers-reduced-motion respected for all animations
□ No "vibe-coded" inline styles — everything in Tailwind classes or CSS variables
□ Tables horizontally scroll on mobile
□ Floating hero cards animate on landing page
□ Code blocks have copy button (UI only, existing clipboard logic preserved)
□ Brand name updated to "AI Genius" in all visible UI text
```

---

*This prompt was generated from a production-grade UI audit of the AI Genius platform (localhost:3000). All business logic, routing, API integration, and data flows observed in the screenshots are to be preserved exactly. Only the visual layer is in scope.*
