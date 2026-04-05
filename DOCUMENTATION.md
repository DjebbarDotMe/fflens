# AffiliateHub — Full Technical Documentation

> **Last updated:** 2026-04-05
> **Stack:** React 18 · TypeScript · Vite 5 · Tailwind CSS · shadcn/ui · Lovable Cloud (Supabase)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Authentication & Authorization](#3-authentication--authorization)
4. [Database Schema](#4-database-schema)
5. [Row-Level Security (RLS) Policies](#5-row-level-security-rls-policies)
6. [Edge Functions (Backend)](#6-edge-functions-backend)
7. [Frontend Pages & Features](#7-frontend-pages--features)
8. [Data Hooks & State Management](#8-data-hooks--state-management)
9. [Affiliate Link Lifecycle](#9-affiliate-link-lifecycle)
10. [Utility Functions](#10-utility-functions)
11. [File Structure](#11-file-structure)
12. [Environment Variables](#12-environment-variables)
13. [Seed Data](#13-seed-data)

---

## 1. Project Overview

**AffiliateHub** is a full-stack affiliate marketing dashboard built for **Solo Affiliate Publishers** — individual content creators who manage affiliate links across multiple networks (Amazon, Impact, CJ, Rakuten, ShareASale, etc.).

### Key Capabilities

| Feature | Description |
|---------|-------------|
| Authentication | Email/password signup, login, password reset, email confirmation |
| Onboarding | 2-step wizard: connect networks → create channels |
| Brand Management | Add/edit/delete brands linked to affiliate networks |
| Product Catalog | Manual entry or bulk CSV import with deduplication |
| Affiliate Link Generator | Auto-generate tracked links with UTM params, geo-routing, A/B testing |
| Link Health Monitoring | Edge function crawls links, follows redirects, scrapes pages, detects broken links |
| Link Verification | Deep verification: redirect chain, affiliate param integrity, product availability, pricing |
| Click Tracking | Redirect handler logs clicks with referrer, user-agent, country, served URL |
| AI Copy Generator | Generate promotional copy for Twitter, Pinterest, and email using Lovable AI |
| Dashboard | Real-time charts (last 30 days clicks from `link_clicks`), top links, broken link alerts |
| Settings | Manage network credentials (affiliate IDs + encrypted API tokens), default UTM params |

---

## 2. Architecture

```
┌─────────────────────────────────────────────┐
│                  Frontend                   │
│   React 18 + Vite + TanStack Query          │
│   Pages: Auth, Onboarding, Dashboard,       │
│          Products, Brands, Links, Settings   │
└──────────────────┬──────────────────────────┘
                   │ Supabase JS Client
                   ▼
┌─────────────────────────────────────────────┐
│              Lovable Cloud                  │
│  ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │ Postgres │ │   Auth   │ │   Edge     │  │
│  │  + RLS   │ │          │ │ Functions  │  │
│  └──────────┘ └──────────┘ └────────────┘  │
│                                             │
│  Edge Functions:                            │
│  • check-link-health  (link verification)   │
│  • redirect-handler   (click tracking)      │
│  • generate-copy      (AI copywriting)      │
└─────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript 5, Vite 5 |
| Styling | Tailwind CSS v3, shadcn/ui components |
| State | TanStack React Query v5 |
| Routing | React Router v6 |
| Charts | Recharts |
| QR Codes | qrcode.react |
| Backend | Lovable Cloud (Supabase Postgres, Auth, Edge Functions) |
| AI | Lovable AI Gateway (`google/gemini-3-flash-preview`) |

---

## 3. Authentication & Authorization

### Auth Flow

1. **Sign Up** — `supabase.auth.signUp()` with email/password. Email confirmation required (auto-confirm is **disabled**).
2. **Sign In** — `supabase.auth.signInWithPassword()`.
3. **Password Reset** — `supabase.auth.resetPasswordForEmail()` redirects to `/reset-password`.
4. **Session** — Managed via `AuthProvider` context (`src/hooks/useAuth.tsx`). Listens to `onAuthStateChange` and exposes `{ session, user, loading, signOut }`.

### Profile Creation

A database trigger (`handle_new_user`) automatically creates a `profiles` row when a new user signs up:

```sql
CREATE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;
```

### Onboarding Gate

After login, the app checks `profiles.has_completed_onboarding`. If `false`, the user is redirected to `/onboarding` (a 2-step wizard for network credentials and channels). On completion, the flag is set to `true`.

### Route Protection

```
/auth              → Public (login/signup)
/reset-password    → Public (password reset)
/onboarding        → Requires auth, shown only if onboarding incomplete
/*                 → Requires auth + completed onboarding
```

Implemented in `App.tsx` via `ProtectedRoutes` component.

---

## 4. Database Schema

### Tables

#### `profiles`
Stores user profile data, created automatically on signup.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid (PK) | No | — | Matches `auth.users.id` |
| `email` | text | Yes | — | User's email |
| `display_name` | text | Yes | — | Display name |
| `has_completed_onboarding` | boolean | No | `false` | Onboarding gate flag |
| `utm_source` | text | Yes | — | Default UTM source for links |
| `utm_medium` | text | Yes | — | Default UTM medium |
| `utm_campaign` | text | Yes | — | Default UTM campaign |
| `created_at` | timestamptz | No | `now()` | — |

#### `networks`
Reference table of affiliate networks (Amazon, Impact, CJ, Rakuten, ShareASale).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid (PK) | No | `gen_random_uuid()` | — |
| `name` | text | No | — | e.g. "Amazon Associates" |
| `slug` | text | No | — | e.g. "amazon" |
| `url_template` | text | No | — | Link template with `{placeholders}` |
| `api_base_url` | text | Yes | — | Network API endpoint |
| `auth_type` | enum | No | `'api_key'` | `api_key`, `oauth2`, or `hmac` |
| `created_at` | timestamptz | No | `now()` | — |

#### `brands`
Affiliate brands/merchants.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid (PK) | No | `gen_random_uuid()` | — |
| `name` | text | No | — | Brand name |
| `website_url` | text | Yes | — | Brand website |
| `network_id` | uuid (FK → networks) | Yes | — | Associated network |
| `product_count` | integer | No | `0` | Cached product count |
| `created_at` | timestamptz | No | `now()` | — |

#### `products`
Product catalog — supports manual entry and CSV import.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid (PK) | No | `gen_random_uuid()` | — |
| `sku` | text | No | — | Unique product identifier |
| `title` | text | No | — | Product name |
| `description` | text | Yes | — | Product description |
| `price` | numeric | Yes | — | Price |
| `currency` | text | No | `'USD'` | ISO currency code |
| `category` | text | Yes | — | Category |
| `image_url` | text | Yes | — | Product image URL |
| `brand_id` | uuid (FK → brands) | Yes | — | Associated brand |
| `network_id` | uuid (FK → networks) | Yes | — | Associated network |
| `merchant_id` | text | Yes | — | Merchant identifier |
| `affiliate_url_template` | text | Yes | — | Custom URL template |
| `availability_status` | enum | No | `'unknown'` | `in_stock`, `out_of_stock`, `unknown` |
| `status` | text | No | `'active'` | Product status |
| `created_at` | timestamptz | No | `now()` | — |
| `updated_at` | timestamptz | No | `now()` | Auto-updated via trigger |

#### `affiliate_links`
Generated affiliate links — the core entity.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid (PK) | No | `gen_random_uuid()` | — |
| `user_id` | uuid | No | — | Owner (auth.uid) |
| `product_id` | uuid (FK → products) | No | — | Associated product |
| `affiliate_url` | text | No | — | Full affiliate URL |
| `short_code` | text | No | — | Short code for redirect |
| `channel_id` | uuid (FK → channels) | Yes | — | Optional channel |
| `click_count` | integer | No | `0` | Total clicks |
| `conversions` | integer | No | `0` | Total conversions |
| `revenue` | numeric | No | `0` | Total revenue |
| `health_status` | enum | No | `'unknown'` | `healthy`, `broken`, `unknown` |
| `health_status_code` | integer | Yes | — | Last HTTP status code |
| `geo_rules` | jsonb | Yes | — | `{ "US": "url1", "UK": "url2" }` |
| `ab_test_urls` | jsonb | Yes | — | `["alternate_url"]` |
| `created_at` | timestamptz | No | `now()` | — |

#### `channels`
Distribution channels (e.g. "My Tech Blog", "YouTube", "Instagram Bio").

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid (PK) | No | `gen_random_uuid()` | — |
| `user_id` | uuid | No | — | Owner |
| `name` | text | No | — | Channel name |
| `url` | text | Yes | — | Channel URL |
| `created_at` | timestamptz | No | `now()` | — |

#### `link_clicks`
Click event log — populated by the `redirect-handler` edge function.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid (PK) | No | `gen_random_uuid()` | — |
| `link_id` | uuid (FK → affiliate_links) | No | — | Which link was clicked |
| `clicked_at` | timestamptz | No | `now()` | Timestamp |
| `ip_hash` | text | Yes | — | Hashed IP for dedup |
| `user_agent` | text | Yes | — | Browser user-agent |
| `referrer` | text | Yes | — | HTTP referrer |
| `country_code` | text | Yes | — | ISO country code |
| `served_url` | text | Yes | — | Actual URL served (for A/B, geo) |

#### `link_health`
Simple health check results.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid (PK) | No | `gen_random_uuid()` | — |
| `link_id` | uuid (FK → affiliate_links) | No | — | — |
| `status_code` | integer | Yes | — | HTTP status |
| `is_valid` | boolean | No | `false` | Whether link is valid |
| `error_message` | text | Yes | — | Error details |
| `last_checked_at` | timestamptz | No | `now()` | — |

#### `link_verifications`
Deep verification results — redirect chains, param checking, page scraping.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid (PK) | No | `gen_random_uuid()` | — |
| `link_id` | uuid (FK → affiliate_links) | No | — | — |
| `redirect_chain` | jsonb | Yes | `'[]'` | Array of `{ url, status_code }` |
| `final_url` | text | Yes | — | Final destination URL |
| `params_intact` | boolean | Yes | `false` | Are affiliate params preserved? |
| `missing_params` | text[] | Yes | `'{}'` | Lost tracking parameters |
| `page_title` | text | Yes | — | Page `<title>` tag |
| `product_available` | boolean | Yes | — | From JSON-LD / text matching |
| `price_found` | numeric | Yes | — | From JSON-LD / meta tags |
| `overall_status` | text | No | `'unknown'` | `healthy`, `warning`, `broken` |
| `issues` | text[] | Yes | `'{}'` | List of detected issues |
| `checked_at` | timestamptz | No | `now()` | — |

#### `user_credentials`
Per-user network credentials (affiliate IDs and API tokens).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid (PK) | No | `gen_random_uuid()` | — |
| `user_id` | uuid | No | — | Owner |
| `network_id` | uuid (FK → networks) | No | — | Which network |
| `affiliate_id` | text | No | — | e.g. "mystore-20" |
| `api_token_encrypted` | text | Yes | — | Encrypted API token |
| `created_at` | timestamptz | No | `now()` | — |

### Database Functions

| Function | Purpose |
|----------|---------|
| `handle_new_user()` | Trigger: creates `profiles` row on signup |
| `update_updated_at()` | Trigger: auto-updates `updated_at` column |
| `increment_click_count(link_id)` | SECURITY DEFINER: atomically increments `affiliate_links.click_count` |

### Enums

| Enum | Values |
|------|--------|
| `health_status` | `healthy`, `broken`, `unknown` |
| `availability_status` | `in_stock`, `out_of_stock`, `unknown` |
| `network_auth_type` | `api_key`, `oauth2`, `hmac` |

---

## 5. Row-Level Security (RLS) Policies

All tables have RLS **enabled**. Below is a summary of access rules per table.

### User-Scoped Tables (filtered by `user_id = auth.uid()`)

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `affiliate_links` | Own | Own | Own | Own |
| `channels` | Own | Own | Own | Own |
| `user_credentials` | Own | Own | Own | Own |
| `profiles` | Own | ❌ (trigger only) | Own | ❌ |

### Shared Tables (authenticated access)

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `brands` | All authenticated | All authenticated | All authenticated | All authenticated |
| `products` | All authenticated | All authenticated | All authenticated | All authenticated |
| `networks` | All authenticated | ❌ | ❌ | ❌ |

### Join-Scoped Tables (access via `affiliate_links.user_id`)

These tables don't have a direct `user_id` column. RLS uses a subquery to verify ownership through `affiliate_links`:

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `link_clicks` | Via link ownership | ❌ (edge function only) | ❌ | ❌ |
| `link_health` | Via link ownership | ❌ (edge function only) | ❌ | ❌ |
| `link_verifications` | Via link ownership | Via link ownership | ❌ | ❌ |

**Example RLS policy (link_clicks):**
```sql
CREATE POLICY "Users can view clicks of own links" ON public.link_clicks
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM affiliate_links al
    WHERE al.id = link_clicks.link_id AND al.user_id = auth.uid()
  )
);
```

---

## 6. Edge Functions (Backend)

### `check-link-health`

**Purpose:** Deep verification of all user's affiliate links.

**Trigger:** User clicks "Refresh Health" button on the Links page.

**Auth:** Requires `Authorization: Bearer <jwt>` header. Validates user via `supabase.auth.getUser()`.

**Process for each link:**

1. **Follow redirects** — manually follows up to 10 HTTP redirects, recording each hop's URL and status code.
2. **Check affiliate params** — compares known affiliate parameters (`tag`, `clickid`, `affiliate_id`, `ref`, `utm_source`, etc.) between original and final URL. Reports any lost parameters.
3. **Scrape final page** — extracts:
   - Page `<title>` tag
   - Product availability (JSON-LD `Product` schema, meta tags, or text patterns like "out of stock")
   - Price (JSON-LD offers, `og:price:amount` meta tag)
   - 404 detection (title-based)

**Writes to:**
- `link_verifications` — full verification record
- `affiliate_links.health_status` + `health_status_code` — summary status

### `redirect-handler`

**Purpose:** Short-link redirect service with click tracking, geo-routing, and A/B testing.

**Auth:** Uses service role key (no user auth required — this is a public redirect endpoint).

**Process:**

1. Receives `?code=<short_code>` query parameter
2. Looks up `affiliate_links` by `short_code`
3. **A/B testing:** If `ab_test_urls` has entries, randomly selects between primary URL and alternates
4. **Geo-routing:** If `geo_rules` is set, checks `cf-ipcountry` header and routes to country-specific URL
5. **Records click** in `link_clicks` with referrer, user-agent, country, and served URL
6. **Increments** `affiliate_links.click_count` via `increment_click_count` RPC
7. Returns **HTTP 302** redirect to destination URL

### `generate-copy`

**Purpose:** AI-powered promotional copy generation for affiliate links.

**Auth:** No JWT verification (public endpoint with `LOVABLE_API_KEY`).

**Process:**

1. Receives `{ productTitle, brandName, shortCode }` in request body
2. Calls Lovable AI Gateway (`google/gemini-3-flash-preview`) with a marketing copywriter system prompt
3. Uses function calling (`return_copy_variants`) for structured output
4. Returns `{ twitter, pinterest, email }` — three platform-specific copy variants

**Rate limiting:** Passes through AI gateway 429/402 errors.

---

## 7. Frontend Pages & Features

### `/auth` — AuthPage
- Login / Sign Up toggle
- Forgot password flow
- Email + password form
- Redirects to `/` on successful auth

### `/onboarding` — Onboarding Wizard
- **Step 1:** Add network credentials (select network + enter affiliate ID)
- **Step 2:** Create channels (name + optional URL)
- Both steps are skippable
- Sets `profiles.has_completed_onboarding = true` on completion

### `/` — Dashboard (Index)
- **Stat cards:** Total Products, Active Brands, Total Clicks, Est. Revenue (computed from `affiliate_links`)
- **Broken links alert:** Shows if any links have `health_status = 'broken'`
- **Clicks chart:** Line chart showing last 30 days of clicks from `link_clicks` table (real data, not mock)
- **Top Performing Links:** Table sorted by click count (top 5)
- Loading skeletons during data fetch

### `/products` — Products
- Product table with brand, network, price, availability, status
- Add product dialog (manual entry)
- CSV import dialog (bulk import with preview, validation, duplicate detection)
- Edit / delete products
- Category and status badges

### `/brands` — Brands
- Brand table with network association and product count
- Add / edit / delete brands
- Network selector

### `/links` — Affiliate Links
- **Quick Generator:** Select product + optional channel → auto-generates affiliate URL with UTM params
  - Advanced options: geo-targeting rules, A/B testing toggle
  - QR code generation for each link
- **Add Link dialog:** Manual URL entry with product/channel association
- **Links table:** Shows product, short code, channel, clicks, conversions, revenue, health status
- **Refresh Health:** Invokes `check-link-health` edge function
- **Health badge click:** Opens `LinkVerificationDialog` showing full verification details
- **AI Copy Generator:** Invokes `generate-copy` for Twitter/Pinterest/email variants
- Edit / delete links
- Clipboard copy for URLs

### `/settings` — Settings
- **Network Credentials:** Add/remove affiliate IDs and API tokens per network
- **Default UTM Parameters:** Configure `utm_source`, `utm_medium`, `utm_campaign` (stored in `profiles`)
- Credentials table with encrypted token indicator

### `/reset-password` — Password Reset
- Token-based password reset form

---

## 8. Data Hooks & State Management

All data fetching uses **TanStack React Query** via custom hooks in `src/hooks/useSupabaseData.ts`:

| Hook | Table | Query Details |
|------|-------|---------------|
| `useNetworks()` | `networks` | `SELECT *` ordered by name |
| `useBrands()` | `brands` | Joins `networks(name, slug, auth_type, url_template)` |
| `useProducts()` | `products` | Joins `brands(name)`, `networks(name, slug)` |
| `useAffiliateLinks()` | `affiliate_links` | Joins `products(title, brands(name))`, `channels(name)` |
| `useUserCredentials()` | `user_credentials` | Joins `networks(name)` |
| `useChannels()` | `channels` | `SELECT *` ordered by name |
| `useClicksOverTime(days)` | `link_clicks` | Groups by date, pre-fills empty days with 0 |
| `useProfile(userId)` | `profiles` | Single row by user ID |

**Mutations** are done inline in page components via `supabase.from(...).insert/update/delete()`, followed by `queryClient.invalidateQueries()`.

### Auth Context

`src/hooks/useAuth.tsx` provides an `AuthProvider` with:
- `session` / `user` — current auth state
- `loading` — true until first auth check completes
- `signOut()` — calls `supabase.auth.signOut()`

---

## 9. Affiliate Link Lifecycle

```
1. User adds product (manual or CSV import)
        ↓
2. User generates affiliate link
   - Selects product → template resolves with affiliate ID from credentials
   - UTM params appended from profile settings
   - Optional: geo-rules, A/B test URL
   - Short code auto-generated from product title
        ↓
3. Link stored in `affiliate_links`
   - health_status = "unknown"
        ↓
4. User shares link (copy URL / QR code / AI-generated copy)
        ↓
5. Visitor clicks short link → `redirect-handler` edge function
   - Resolves short_code → destination URL
   - Applies geo-routing or A/B testing
   - Logs click to `link_clicks`
   - Increments `click_count`
   - 302 redirect to destination
        ↓
6. User clicks "Refresh Health" → `check-link-health` edge function
   - Follows redirect chain
   - Checks affiliate param integrity
   - Scrapes landing page
   - Updates `health_status` on `affiliate_links`
   - Stores full report in `link_verifications`
        ↓
7. Dashboard shows real click data from `link_clicks`
   - 30-day line chart
   - Aggregated stats from `affiliate_links`
```

---

## 10. Utility Functions

### `src/lib/affiliate-utils.ts`

| Function/Const | Purpose |
|----------------|---------|
| `generateAffiliateUrl(template, url, params)` | Resolves URL template with placeholder substitution |
| `generateShortCode(name)` | Creates URL-safe slug from product title (max 20 chars) |
| `networkTypeLabels` | Human-readable network names |
| `networkTypeColors` | Tailwind classes for network badges |
| `availabilityLabels/Colors` | Display labels for availability enum |
| `healthStatusLabels/Colors` | Display labels for health status enum |

### `src/lib/mock-data.ts`

Contains sample products, brands, and links used as fallback/reference. The `mockClicksOverTime` export was removed — the dashboard now uses real `link_clicks` data.

---

## 11. File Structure

```
src/
├── App.tsx                    # Root: routes, auth provider, query client
├── components/
│   ├── AppLayout.tsx          # Sidebar + main content wrapper
│   ├── AppSidebar.tsx         # Navigation sidebar
│   ├── CsvImportDialog.tsx    # CSV import with preview/validation
│   ├── LinkVerificationDialog.tsx  # Health check details modal
│   ├── NavLink.tsx            # Sidebar nav item
│   └── ui/                    # shadcn/ui primitives (40+ components)
├── hooks/
│   ├── useAuth.tsx            # Auth context provider + hook
│   ├── useSupabaseData.ts     # All data-fetching hooks
│   └── use-mobile.tsx         # Mobile breakpoint hook
├── integrations/supabase/
│   ├── client.ts              # Auto-generated Supabase client
│   └── types.ts               # Auto-generated TypeScript types
├── lib/
│   ├── affiliate-utils.ts     # URL generation, labels, colors
│   ├── mock-data.ts           # Sample data (reference only)
│   └── utils.ts               # cn() helper
├── pages/
│   ├── AuthPage.tsx           # Login / signup / forgot password
│   ├── Brands.tsx             # Brand management
│   ├── Index.tsx              # Dashboard with real click data
│   ├── Links.tsx              # Affiliate link management
│   ├── NotFound.tsx           # 404 page
│   ├── Onboarding.tsx         # 2-step setup wizard
│   ├── Products.tsx           # Product catalog
│   ├── ResetPassword.tsx      # Password reset form
│   └── SettingsPage.tsx       # Credentials + UTM settings
└── index.css                  # Tailwind config + design tokens

supabase/
├── config.toml                # Project configuration
└── functions/
    ├── check-link-health/index.ts   # Link verification engine
    ├── generate-copy/index.ts       # AI copy generator
    └── redirect-handler/index.ts    # Click tracking redirect
```

---

## 12. Environment Variables

| Variable | Source | Purpose |
|----------|--------|---------|
| `VITE_SUPABASE_URL` | Auto-configured | Supabase API URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Auto-configured | Supabase anon key |
| `VITE_SUPABASE_PROJECT_ID` | Auto-configured | Project identifier |

### Edge Function Secrets

| Secret | Used By | Purpose |
|--------|---------|---------|
| `SUPABASE_URL` | All edge functions | Supabase API endpoint |
| `SUPABASE_ANON_KEY` | check-link-health | Client creation with user JWT |
| `SUPABASE_SERVICE_ROLE_KEY` | redirect-handler | Service-level access (bypasses RLS) |
| `LOVABLE_API_KEY` | generate-copy | Lovable AI Gateway authentication |

---

## 13. Seed Data

~300 sample click rows were seeded into `link_clicks` via a one-time script, distributed across the last 30 days for the user's existing `affiliate_links`. The seed data includes:

- **Country codes:** US, GB, DE, CA, AU, FR, JP, BR, IN, MX
- **Referrers:** google.com, twitter.com, facebook.com, reddit.com, direct, youtube.com, pinterest.com, tiktok.com
- **User agents:** Chrome/Windows, Safari/Mac, Firefox/Linux, Chrome/Mobile, Safari/iOS
- **Distribution:** Weighted toward weekdays, with natural variance

This data powers the "Clicks (Last 30 Days)" chart on the dashboard.
