

# Gap Analysis: Your Prompt vs. Current Implementation

Here's what's missing from our current build, mapped against your detailed prompt. I've adapted everything to our stack (React + Vite + Supabase, not Next.js).

---

## What We Already Have ✓
- App shell with sidebar navigation (Dashboard, Products, Brands, Links, Settings)
- Product data model with brand associations
- Affiliate URL template system with placeholder injection
- Dashboard with stats cards + Recharts click chart
- Product search/filter by brand and category
- Link generator with copy-to-clipboard
- Network type labels (Amazon, Impact/CJ, Rakuten, ShareASale)
- Settings page for affiliate ID config

## What's Missing — Prioritized

### 1. Networks table (separate from brands)
Your prompt distinguishes **networks** (Amazon, Impact, CJ, Rakuten) from **merchants/brands**. Currently we conflate them. We need:
- A `networks` table with `api_base_url`, `auth_type`
- Brands/merchants belong to a network
- Impact network added (missing from current `network_type` enum)

### 2. User credentials management (encrypted)
- `user_credentials` table: `user_id`, `network_id`, `affiliate_id`, `api_token_encrypted`
- Settings page needs per-network credential input (not just a single affiliate ID)
- Credentials stored encrypted in Supabase (pgcrypto)

### 3. Product fields: `sku`, `availability_status`, `merchant_id`
Current `products` model is missing:
- `sku` (unique per network)
- `availability_status` enum: `in_stock`, `out_of_stock`, `unknown`
- `merchant_id`
- `updated_at` timestamp
- Availability badge in product table UI

### 4. Link Health Monitor
Entirely missing. Needs:
- `link_health` table: `link_id`, `status_code`, `is_valid`, `error_message`, `last_checked_at`
- Health status indicator (✓/✗) on each link in the Links page
- Edge Function to check links via HTTP HEAD requests (no Puppeteer in our stack — use fetch with redirect follow)
- "Refresh Health" button for manual checks
- Broken links alert banner on Dashboard

### 5. Click tracking enrichment
Current `link_clicks` has `referrer`, `country`, `device`. Your prompt adds:
- `ip_hash` (anonymized)
- `user_agent`
- Remove `country`/`device` (derive from user_agent if needed)

### 6. Short link redirect route
- Route `/r/:code` that looks up the short code, increments click count, logs the click, and redirects
- This needs an Edge Function since Lovable is client-side only

### 7. QR code generation
- Currently placeholder — need actual QR code rendering (e.g., `qrcode` npm package)
- Show QR code in link generator modal

### 8. Product availability status in UI
- Badge showing in_stock/out_of_stock/unknown
- Filter by availability on Products page

### 9. Analytics improvements
- Top products by clicks (partially there)
- Clicks per day chart filtered by link (not just aggregate)
- Broken links alert banner

### 10. Bulk product import (CSV)
- Currently just a placeholder button
- Need CSV parsing + insert logic

### 11. Authentication
- Your prompt uses NextAuth; we'd use Supabase Auth (email + Google OAuth)
- Needed before user credentials can be stored per-user

---

## Out of Scope (Aligned with Your Prompt)
- Product ingestion from live APIs (Amazon PAAPI, Impact, CJ, Rakuten) — future feature
- Docker/self-hosting setup (N/A for Lovable)
- BullMQ/Redis queues (use Supabase pg_cron + Edge Functions instead)
- Admin panel (deferred)

---

## Recommended Implementation Order

1. **Set up Supabase database** — Create `networks`, `products`, `brands`, `user_credentials`, `affiliate_links`, `link_health`, `link_clicks` tables with proper RLS
2. **Add auth** — Supabase Auth with email + Google
3. **Update data models & UI** — Add missing fields (sku, availability, merchant_id), update Product/Brand pages
4. **User credentials page** — Per-network credential management in Settings
5. **Link health system** — Edge Function for HTTP checks, health status UI, broken link alerts
6. **Short link redirect** — Edge Function for `/r/:code` with click tracking
7. **QR code generation** — Real QR codes in link generator
8. **CSV import** — Bulk product import from CSV files

---

## Technical Notes

- **No Puppeteer**: Link health checks will use `fetch()` in an Edge Function (HEAD requests with redirect following). Sufficient for HTTP status + redirect validation.
- **Encrypted credentials**: Use Supabase Vault or pgcrypto `pgp_sym_encrypt`/`pgp_sym_decrypt` for user API tokens.
- **Short link redirects**: Requires an Edge Function since this is a client-side app — can't do server-side redirects from React Router.
- **Impact network**: Add `'impact'` to the network_type enum alongside existing ones.

