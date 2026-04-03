

## Critical Assessment of Phase 2 Features

### Task 1: Geo-Targeting & A/B Testing — Proceed with Caution

**Verdict: Worth doing, but scope it tight.**

- JSONB columns for `geo_rules` and `ab_test_urls` are fine — flexible and don't break existing data.
- The "Advanced Options" accordion UI is reasonable. Keep it collapsed by default so it doesn't overwhelm the link creation flow.
- **Concern:** Without analytics to show which variant or geo-route won, A/B testing data is useless. Users will set it up but never know if it worked. We should at minimum record which URL was served in `link_clicks` so results can be analyzed later.

**Plan:**
1. Migration: Add `geo_rules jsonb` and `ab_test_urls jsonb` (both nullable) to `affiliate_links`. Add `country_code text` and `served_url text` columns to `link_clicks` for tracking.
2. UI: Add an Accordion component below the link generator with geo-rule inputs (country code + URL pairs) and an A/B toggle with secondary URL input. Store as JSON on insert.

---

### Task 2: Advanced Redirect Engine — Yes, with Realistic Expectations

**Verdict: Do it, but geo-detection will be limited.**

- Supabase Edge Functions run on Deno Deploy. The `cf-ipcountry` header is Cloudflare-specific and **not available** on Supabase edge functions. We'd need to use a free IP geolocation API or accept-language header as a fallback — or just skip geo for now and focus on A/B testing which works reliably.
- A/B split is straightforward: `Math.random() < 0.5`.
- Recording `country_code` and `served_url` in `link_clicks` is essential for any analytics value.

**Plan:**
1. Update `redirect-handler` to select `geo_rules, ab_test_urls` alongside `affiliate_url`.
2. Implement A/B logic: if `ab_test_urls` has entries, randomly pick between primary and alternates.
3. Attempt geo-detection via `cf-ipcountry` header (best-effort, won't work on all deployments). If matched, route to geo URL.
4. Record `country_code` and `served_url` in the `link_clicks` insert.

---

### Task 3: Automated Price & Stock Sync — Strong Pushback

**Verdict: Premature. Skip for now.**

- **No network APIs are actually integrated.** The `networks` table has URL templates and slugs, but there's no API authentication flow to pull data from Amazon, ShareASale, etc. Building a sync pipeline with no data source is building plumbing to nowhere.
- **Cron on Supabase** requires `pg_cron` + `pg_net` extensions and a persistent anon key in SQL — adding complexity for zero value right now.
- **Database triggers on JSONB parsing** are fragile and hard to debug.
- **Counter-proposal:** Skip this entirely until at least one network API integration is live. When ready, build a simpler approach: an edge function that users manually trigger per-network, not an automated pipeline.

---

### Task 4: AI Content Generator — Yes, Quick Win

**Verdict: High value, low effort. Do it.**

- This project has access to Lovable AI models (no API key needed), so we can use a real LLM instead of mock data.
- Add a "Generate Copy" button (Sparkles icon) to each link row's actions.
- Dialog fetches product title + brand name, calls an edge function that uses Lovable AI to generate 3 copy variants (Twitter/X, Pinterest, email).
- Each variant gets a "Copy to Clipboard" button.

**Plan:**
1. Create edge function `generate-copy` that accepts product title, brand name, and short code. Calls Lovable AI to generate 3 text variants.
2. Add Sparkles button to Links table actions column.
3. Build a Dialog with loading state, displaying 3 generated variants with copy buttons.

---

## Recommended Execution Order

1. **Task 1** — Geo/A/B data model + UI (needed before Task 2)
2. **Task 2** — Redirect engine upgrade (depends on Task 1 columns)
3. **Task 4** — AI content generator (independent, high impact)
4. ~~Task 3~~ — **Skip** until network APIs are integrated

## Summary of Changes

| Area | Changes |
|------|---------|
| Migrations | Add `geo_rules`, `ab_test_urls` to `affiliate_links`; add `country_code`, `served_url` to `link_clicks` |
| Edge functions | Update `redirect-handler`; create `generate-copy` |
| Pages | `Links.tsx` — Advanced Options accordion, AI copy button + dialog |
| Version | Bump to v1.3.0 |

**Total: 1 migration, 1 updated edge function, 1 new edge function, 1 modified page.**

