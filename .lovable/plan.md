

## Real Dashboard Data from link_clicks

### What We're Building

Replace the hardcoded `mockClicksOverTime` chart on the dashboard with real data from the `link_clicks` table, and seed sample click data into the database so the chart isn't empty.

### Step 1: Seed sample click data

Write and run a script that inserts ~300 sample rows into `link_clicks` for the user's existing `affiliate_links`. Spread clicks across the last 30 days with realistic distribution (more on weekdays, some variance). Include varied `country_code`, `user_agent`, and `referrer` values.

Uses `psql` INSERT — no migration needed (data only).

### Step 2: Add a query hook for click trends

Create a `useClicksOverTime` hook in `useSupabaseData.ts` that:
- Queries `link_clicks` joined through `affiliate_links` (to respect RLS)
- Groups by date, counts clicks per day
- Returns the last 30 days as `{ date, clicks }[]`

Conversions aren't tracked in `link_clicks`, so the chart will show clicks only (conversions line removed or shown as 0 from `affiliate_links.conversions` aggregate).

### Step 3: Update Dashboard to use real data

In `Index.tsx`:
- Replace `mockClicksOverTime` import with the new `useClicksOverTime` hook
- Show a loading skeleton while data loads
- Keep the existing chart structure, just swap the data source
- Remove the hardcoded `+12%`, `+18%` change labels (they're fake) — either compute real deltas or just remove them

### Step 4: Compute real stat changes (optional light version)

For the stat cards, compare current period totals vs previous period from `link_clicks` to show actual trends, or simply show the raw numbers without fake percentages.

### Technical Details

| Area | Change |
|------|--------|
| Script (one-time) | Seed `link_clicks` with ~300 rows via `psql` |
| `useSupabaseData.ts` | Add `useClicksOverTime()` hook |
| `Index.tsx` | Swap mock data for real query, remove fake change percentages |
| `mock-data.ts` | Remove `mockClicksOverTime` export (keep other mocks for now) |

