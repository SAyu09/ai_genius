# Getsell - Project Architecture & Refactoring Guide

## 1. Introduction
This document outlines the current state, folder structure, business logic, and flow of the **Getsell** platform. Use this as a reference guide to refactor the codebase without breaking existing relationships and data flows.

## 2. Tech Stack
- **Framework:** Next.js 16+ (App Router)
- **Styling:** Tailwind CSS v4, Radix UI Primitives (shadcn/ui)
- **Database ORM:** Drizzle ORM
- **Database Engine:** PostgreSQL (Supabase)
- **Authentication:** Supabase SSR (Server-Side Rendering Auth)
- **Payments:** Stripe & Stripe Connect
- **Storage:** Supabase Storage or S3 (AWS SDK installed)

## 3. Folder Structure

```text
.
├── src/
│   ├── app/                # Next.js App Router Pages & API Routes
│   │   ├── api/            # Backend endpoints (auth, checkout, agents, etc.)
│   │   ├── dashboard/      # Protected Seller/Buyer Dashboard
│   │   ├── marketplace/    # Public Agent Marketplace
│   │   ├── pricing/        # Pricing page
│   │   ├── sell/           # Seller landing page
│   │   ├── sign-in/        # Authentication pages
│   │   └── sign-up/
│   ├── assets/             # Static assets/images
│   ├── components/         # Reusable React components
│   │   ├── site/           # Marketing/Site components (Hero, FAQ, etc.)
│   │   └── ui/             # Shadcn UI primitives (Button, Card, Input, etc.)
│   ├── data/               # Static/Mock data files
│   ├── db/                 # Database Schema & Drizzle config
│   │   ├── index.ts        # Database connection setup
│   │   └── schema.ts       # Main DB tables and relationships
│   ├── hooks/              # Custom React Hooks
│   ├── lib/                # Utility functions and library wrappers
│   │   ├── auth.ts         # Authentication helpers
│   │   ├── storage.ts      # File upload/storage utilities
│   │   ├── stripe.ts       # Stripe initialization and helpers
│   │   ├── supabase-client.ts # Supabase client singleton
│   │   └── utils.ts        # Tailwind merge & clsx utilities
│   └── middleware.ts       # Next.js Middleware for Auth & Protected Routes
├── drizzle.config.ts       # Drizzle CLI configuration
├── next.config.ts          # Next.js configuration
├── package.json            # Dependencies and scripts
└── tailwind.config.* / postcss.config.* # Styling configs
```

## 4. Database Schema Logic (`src/db/schema.ts`)
The platform has a relational structure centered around four primary tables:
1. **users:** Stores Buyers, Sellers, and Admins. Holds Stripe account details (`stripeAccountId`) for seller payouts.
2. **agents:** The core digital assets listed by Sellers. Contains pricing (in cents), descriptions, and an `assetKey` pointing to the private S3/Storage bucket. Linked to `users` (Seller).
3. **purchases:** The transactional ledger. Links a `buyerId` to an `agentId`. Records Stripe Session IDs, amounts paid, platform fees, and seller payouts.
4. **reviews:** Links a `buyerId` to an `agentId` with a 1-5 star rating and comment.

> **Refactoring Note:** When modifying relations in Drizzle (e.g., adding a new entity like `Subscriptions` or `ChatLogs`), always update the `relations` block alongside the table definition to ensure proper querying capabilities.

## 5. Application Flow & Logic

### Authentication Flow
1. User signs in/up via `/sign-in` or `/sign-up`.
2. Auth is handled via Supabase.
3. Next.js **Middleware** (`src/middleware.ts`) automatically refreshes expired sessions and checks access.
4. **Protected Routes:** `/dashboard`, `/api/checkout`, `/api/upload`, `/api/sellers`, `/api/purchases`. Accessing these without a session redirects back to `/sign-in` with a `callbackUrl`.

### Seller Flow (Listing an Agent)
1. Seller navigates to `/dashboard/list-agent`.
2. Fills out Agent details (Name, Tag, Description, Price).
3. Submits form -> calls `POST /api/sellers/agents`.
4. The API saves the record to the `agents` table (currently bypassing real file uploads for demo purposes).

### Buyer Flow (Purchasing an Agent)
1. Buyer browses `/marketplace`.
2. Selects an agent and clicks "Buy" or "Subscribe".
3. Triggers `POST /api/checkout`.
4. Server creates a Stripe Checkout Session.
5. Upon successful payment, Stripe fires a webhook to `POST /api/webhooks`.
6. Webhook verifies the signature and writes the transaction to the `purchases` table.
7. Buyer can now view and download the agent from their dashboard.

## 6. What's Implemented (Status)
- **UI/UX Foundation:** Marketing pages (Hero, FAQ, Layouts), Dashboard, Marketplace layout, Auth pages.
- **Database Schema:** Fully mapped out with Drizzle ORM.
- **Middleware:** Working route protection and session management.
- **API Endpoints Skeleton:** Folders exist for agents, auth, checkout, purchases, sellers, upload, and webhooks.
- **Dashboard Logic:** Base UI for managing listed agents (`/dashboard`), listing new agents (`/dashboard/list-agent`).

## 7. Refactoring Guidelines & Best Practices
- **Use Shadcn UI:** When creating new components, rely on the `src/components/ui/` primitive building blocks to keep styling consistent.
- **Client vs Server Components:** Keep the `"use client"` directive strictly at the top of interactive components. Move data fetching to Server Components (like `page.tsx`) whenever possible and pass data down as props.
- **Database Changes:** If you alter `schema.ts`, remember to generate a new migration (e.g. using `npx drizzle-kit generate`) and apply it using `npx drizzle-kit push` (or your preferred migrate script).
- **Environment Variables:** Make sure you don't refactor out the `NEXT_PUBLIC_` prefix for Supabase client-side keys.
- **API Routing:** Next.js App Router uses `route.ts` files inside `/api` directories. Keep business logic separate from the route handlers if it gets too complex (e.g., consider creating a `src/services` folder).
