# 🌌 AI Genius — Next-Gen AI Agent Marketplace

AI Genius is a state-of-the-art decentralized marketplace and sandbox ecosystem for hosting, building, and monetizing autonomous AI Agents. Designed with a frictionless **OLX-Style Dual-Role Architecture**, it allows creators to instantly construct hosted or workflow-driven AI agents and permits buyers to acquire premium licenses seamlessly.

---

## 🚀 Key Innovations & Architectural Philosophy

We have structured the platform's user experience around a **high-conversion, high-engagement strategy**:

### 🔄 OLX-Style Unified Identity
*   **Single Identity:** Users maintain one unified record in the `users` database table. There are no separate buyer or seller registration flows.
*   **Zustand-Powered Context Toggle:** A client-side global store (`useAuthStore`) maintains `activeRoleContext` ('buyer' or 'seller'). Clicking the context switcher dynamically changes layouts, sidebar navigation, and header features in real-time.
*   **Just-in-Time Upgrades:** Standard buyers upgrading to Creators triggers a background POST request to `/api/sellers/register` to update the role to `seller` in the database, followed by a NextAuth `useSession().update()` trigger. This seamlessly refreshes the JWT cookie without requiring a manual logout/login loop.

### 🎨 The "Sunk Cost" Creator Flow
*   **Zero-Friction Entry:** Rather than forcing creators to complete complex KYC and Stripe payout forms before creating an agent, they can instantly open the **Creator Studio** and start configuring their model.
*   **Autosave Engine:** The list-agent workspace dynamically invokes an intelligent API layer. The first save triggers a `POST` request (returning a `draftId` and saving the agent as `"draft"`), and subsequent edits trigger a dynamic `PATCH` request to prevent database record duplication.
*   **Just-in-Time KYC:** Financial/banking verification is shifted to the final, high-intent action: **Publishing**. When the creator clicks "Publish", a sleek overlay `Dialog` modal appears asking for settlement details. Completing the KYC automatically closes the modal and instantly publishes the agent for admin review.

---

## 🛠 Tech Stack

*   **Framework:** Next.js 16.2.4 (App Router, Turbopack) & React 19.2.4
*   **Styling:** Tailwind CSS v4, Radix UI Primitives, Lucide Icons, Framer Motion
*   **State & Auth:** NextAuth 5 (Beta 31), Zustand 5.0
*   **Database & ORM:** Drizzle ORM 0.45.2, PostgreSQL (Supabase)
*   **Payments & KYC:** Stripe Checkout, Stripe Custom Payouts, Secure Custom Bank Details
*   **Storage:** S3-Compatible Storage (Supabase Storage Bucket)

---

## 📂 Directory Structure

The repository follows a strict modular and clean-layer layout:

```text
.
├── src/
│   ├── app/                    # Next.js App Router (Routing and Pages)
│   │   ├── (frontend)/         # Pure client-facing dashboards and views
│   │   │   ├── (dashboard)/    # Dashboard layout for Buyer & Seller contexts
│   │   │   │   ├── dashboard/  # Interactive dashboards and creator listings
│   │   │   │   └── marketplace/# Marketplace exploration & buyer purchases
│   │   │   └── sell/           # "Become a Creator" marketing landing page
│   │   └── api/                # API route handlers
│   │       ├── agents/         # GET, POST, and PATCH endpoints for agents
│   │       ├── checkout/       # Stripe payment session initialization
│   │       ├── sellers/        # Dynamic seller registration and profiles
│   │       └── webhooks/       # Stripe webhook listeners for purchase updates
│   ├── backend/                # Server-Side Core Logic
│   │   ├── db/                 # Drizzle connection index and schemas
│   │   └── lib/                # Auth configurations, Stripe utilities, S3 clients
│   ├── components/             # Reusable UI components
│   │   ├── site/               # Header, Sidebar, and marketing site elements
│   │   └── ui/                 # Accessible Radix/Shadcn primitives
│   ├── features/               # Dedicated functional components (e.g. KYC forms)
│   ├── store/                  # Global client-side states (Zustand)
│   └── types/                  # TypeScript interfaces and auth schemas
├── drizzle.config.ts           # Drizzle schema path and database configuration
├── package.json                # Project dependencies and script commands
└── seed.js                     # Seed script for bootstrapping demo data
```

---

## 📊 Database Schema Summary

The database is built dynamically with PostgreSQL via Drizzle ORM (`src/backend/db/schema.ts`):

| Table Name | Primary Purpose | Key Fields | Relationships |
| :--- | :--- | :--- | :--- |
| **`users`** | Central identity record for all accounts | `id`, `email`, `role`, `stripeCustomerId` | Many `agents`, `purchases`, `reviews` |
| **`seller_profiles`** | Metadata for users operating in Creator mode | `id`, `userId`, `gamificationTier`, `settlementStatus` | One to One with `users` |
| **`seller_bank_details`** | Secure bank/UPI accounts for JIT payout verification | `id`, `sellerId`, `bankName`, `panNumberEncrypted` | One to One with `users` |
| **`agents`** | Digital assets listed by creators | `id`, `sellerId`, `name`, `pricingModel`, `status` | Belongs to `users` (Seller) |
| **`purchases`** | Transactional ledger for sold licenses | `id`, `buyerId`, `agentId`, `amountPaid`, `platformFee` | Links `users` (Buyer) & `agents` |
| **`subscriptions`** | Recurring access rights for hosted models | `id`, `buyerId`, `agentId`, `status`, `stripeSubscriptionId` | Links `users` & `agents` |
| **`managed_hosting`** | Host/Docker/Coolify configs for sandbox testing | `id`, `agentId`, `dockerImage`, `hostedUrl`, `status` | Links `users` & `agents` |
| **`reviews`** | Ratings and comments left by verified buyers | `id`, `buyerId`, `agentId`, `stars`, `comment` | Links `users` & `agents` |
| **`refunds`** | Disputed payments processed by admins | `id`, `purchaseId`, `amountPaise`, `decision` | Belongs to `purchases` |

---

## ⚙️ Getting Started & Local Setup

Follow these steps to run a premium local instance of AI Genius:

### 1. Prerequisites
Ensure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v20+ recommended)
*   [PostgreSQL](https://www.postgresql.org/) database or a [Supabase](https://supabase.com/) project URL

### 2. Environment Variables Configuration
Duplicate the `.env` template or populate variables in a `.env` file at the root:

```bash
# Database Setup
DATABASE_URL="postgresql://username:password@host:port/database"

# NextAuth Authentication Config
AUTH_SECRET="your-32-char-random-auth-secret"
AUTH_URL="http://localhost:3000"
AUTH_GOOGLE_ID="your-google-oauth-client-id"
AUTH_GOOGLE_SECRET="your-google-oauth-client-secret"

# Stripe Configuration
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# S3 Storage Configuration
S3_REGION="ap-southeast-1"
S3_ACCESS_KEY_ID="your-access-key"
S3_SECRET_ACCESS_KEY="your-secret"
S3_ENDPOINT="https://your-bucket-endpoint"
S3_BUCKET_NAME="agents"

# Platform Encryption Secret
ENCRYPTION_SECRET="your-32-byte-aes-encryption-secret"
```

### 3. Install Dependencies
Run the installation script:
```bash
npm install
```

### 4. Database Setup & Seeding
Deploy migrations directly using Drizzle Kit and populate sample agents:
```bash
# Push Drizzle schema to PostgreSQL database
npx drizzle-kit push

# Seed sample agents and a system seller profile
node seed.js
```

### 5. Running the Application
Launch the developer environment with Next.js Turbopack:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛡 Next.js 16 Developer Guardrails

Please observe these design principles when adding new features:
1.  **Context Switching Safety:** Do not introduce global middleware routing limits on dashboard subpaths (e.g., forcing a redirect based on role alone). Standardize route security inside specific pages or layover layouts to protect the dual-role flow.
2.  **NextAuth Syncs:** Any database role update requires invoking the NextAuth update trigger (`const { update } = useSession(); update()`) to align the dynamic JWT session with the database record.
3.  **ORM Guidelines:** When adding database fields, declare their respective relations in `src/backend/db/schema.ts` to allow structured nested querying through Drizzle.
4.  **Client vs Server Component Boundaries:** Keep interactive states (like switching contexts) strictly labeled with `"use client"`. Heavy API interactions and base dashboard page layouts should remain Server Components for fast initial paint times.
