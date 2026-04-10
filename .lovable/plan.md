

## Hardening the Affiliate.com Integration

### Current State

The edge function and search UI are functional scaffolds. The audit correctly identifies gaps. Here's what's already covered vs what needs work:

**Already handled:** `image_url`, `currency`, `category` are mapped in both the edge function normalizer and the frontend import. The `description` column exists in the schema but is not mapped.

**Needs work:** 5 areas below.

---

### 1. Fix the N+1 Brand Lookup (Move import logic server-side)

**Problem:** Bulk-importing 20 products fires 40+ individual DB queries from the browser (brand lookup + create + product upsert per row).

**Fix:** Create a new edge function `import-affiliate-products` that:
- Accepts an array of products in one POST
- Performs brand lookup/create in a single batch (one query to find existing brands, one insert for new ones)
- Does a single `products` upsert call with the full array
- Logs the sync to `feed_sync_logs`
- Returns success/failure counts

The frontend `AffiliateSearchPanel` import buttons will call this single endpoint instead of doing client-side DB operations.

### 2. Selective Upsert (Protect Manual Edits)

**Problem:** Re-importing overwrites user-edited titles and descriptions.

**Fix:** In the new import edge function, use a raw SQL upsert via `supabase.rpc` that only updates volatile fields on conflict:
- **Always updated on re-import:** `price`, `sale_price`, `availability_status`, `commission_rate`, `feed_synced_at`
- **Only set on first insert:** `title`, `description`, `image_url`, `category`, `affiliate_url_template`

This is done with `ON CONFLICT ... DO UPDATE SET price = EXCLUDED.price, ...` (listing only volatile columns).

### 3. Pagination Support

**Problem:** Searching "Nike" returns thousands of results but we only fetch one page.

**Fix:**
- Add `page` parameter to the edge function, pass through to Affiliate.com API
- Add "Load More" button in the UI that increments the page and appends results
- Display total count from API response

### 4. Base URL as a Secret

**Problem:** The API base URL is hardcoded as a TODO placeholder.

**Fix:** Add `AFFILIATE_COM_BASE_URL` as a second secret alongside the API key. The edge function reads it from `Deno.env.get("AFFILIATE_COM_BASE_URL")` with a sensible fallback.

### 5. Error Handling & Description Mapping

- Add timeout (10s) to the upstream `fetch` call
- Forward `429` status with a user-friendly "rate limited" message
- Map `description` field in both the normalizer and the import logic

---

### Files changed

| File | Change |
|------|--------|
| `supabase/functions/affiliate-search/index.ts` | Add pagination param, base URL from env, timeout, 429 handling, description mapping |
| `supabase/functions/import-affiliate-products/index.ts` | **New** — batch import with selective upsert, brand dedup, sync logging |
| `src/components/AffiliateSearchPanel.tsx` | Replace client-side import with edge function call, add "Load More" button, add description to interface |
| Migration | Create RPC function for selective upsert (`upsert_affiliate_products`) |

### Secrets needed

- `AFFILIATE_COM_BASE_URL` — will prompt you to enter it (can be done later alongside the API key)

### Database migration

One new Postgres function `upsert_affiliate_products` that takes a JSONB array and performs the selective upsert + brand resolution in a single transaction.

