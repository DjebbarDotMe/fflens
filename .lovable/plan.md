

## Deep Link Verification Pipeline

### What We're Building

A comprehensive link verification system that goes beyond the current simple HTTP HEAD check. The new system will:

1. **Follow the full redirect chain** and record each hop
2. **Verify affiliate tracking parameters** survive the redirect (tag, clickId, etc.)
3. **Scrape the final landing page** to check product availability, price, and page status
4. **Store detailed verification results** for each link

### Current State

The `check-link-health` edge function only does a `HEAD` request and checks if the HTTP status is < 400. It stores a binary `healthy`/`broken` result. No redirect chain analysis, no parameter verification, no page content inspection.

### Implementation Plan

**Step 1: Database migration — Add verification results table**

Create a `link_verifications` table to store detailed results per check:

| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid | PK |
| `link_id` | uuid | FK to affiliate_links |
| `checked_at` | timestamptz | When the check ran |
| `redirect_chain` | jsonb | Array of `{url, status_code}` hops |
| `final_url` | text | Where the redirect chain ended |
| `params_intact` | boolean | Whether affiliate params survived |
| `missing_params` | text[] | Which params were lost |
| `page_title` | text | Title of the landing page |
| `product_available` | boolean | Whether product appears in-stock |
| `price_found` | numeric | Price scraped from page (if any) |
| `overall_status` | text | `healthy` / `warning` / `broken` |
| `issues` | text[] | Human-readable list of problems found |

RLS: Users can view verifications for their own links (same pattern as `link_clicks`).

**Step 2: Upgrade `check-link-health` edge function**

Replace the simple HEAD check with a multi-step pipeline:

1. **Redirect chain tracking**: Use `fetch` with `redirect: "manual"` in a loop to follow each hop, recording URL and status at every step. Stop after 10 hops (loop protection).

2. **Parameter verification**: Parse the original `affiliate_url` to extract expected query params (tag, clickId, affiliate_id, etc.). Compare against the final URL's query params. Flag any that were dropped during redirects.

3. **Page content scraping**: On the final URL, do a `GET` request with a browser-like User-Agent. Parse the HTML response to extract:
   - `<title>` tag (detect "404", "Page Not Found", redirect-to-homepage patterns)
   - Price elements (common patterns: `[class*="price"]`, `meta[property="product:price:amount"]`, JSON-LD `@type: Product`)
   - Availability signals (schema.org `availability`, "out of stock" text, "add to cart" button presence)

4. **Store results**: Insert a row into `link_verifications` and update the `affiliate_links.health_status` based on the overall assessment:
   - `healthy` = redirect works, params intact, product page loads
   - `warning` = redirect works but params missing or product status unclear
   - `broken` = redirect fails, 404, or product page is dead

**Step 3: Update the Links UI**

- Change "Refresh Health" button behavior to call the upgraded function
- Add a detail popover/dialog when clicking a health badge, showing:
  - Redirect chain visualization (URL1 → URL2 → ... → Final)
  - Parameter check results (green checkmark / red X per param)
  - Product page snapshot (title, price found, availability)
  - List of issues found
- Add a `last_verified_at` timestamp display

### Technical Details

| Area | Changes |
|------|---------|
| Migration | Create `link_verifications` table with RLS |
| Edge function | Rewrite `check-link-health/index.ts` with redirect chain follower, param checker, and HTML scraper |
| UI | Update `Links.tsx` — health badge click opens verification detail dialog |
| No new dependencies | Uses native `fetch` + basic HTML string parsing (regex for title/meta/JSON-LD) |

### Limitations (Honest Assessment)

- **JavaScript-rendered pages** (SPAs) won't return useful HTML via server-side fetch. Most retail product pages server-render enough for price/availability detection.
- **Rate limiting**: Some retailers block rapid requests. We use a 10s timeout and browser-like headers to mitigate.
- **Network confirmation** (verifying the link is actually earning commissions) is not possible without API access to each network. We can detect if tracking params are present, but not if the network recognizes them. This is a UI-level "best effort" indicator.

