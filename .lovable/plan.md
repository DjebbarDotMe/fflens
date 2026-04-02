

## Critical Review of the Proposed Tasks

Here's my honest assessment of each task, what's worth doing, what needs rethinking, and what I'd push back on.

---

### Task 1: Channels — Mostly Good, Minor Concerns

**Verdict: Do it, but keep it simple.**

The concept is sound — segmenting links by channel (blog, YouTube, Instagram) is a real affiliate marketing need. However:

- The `url` field on channels is vague. What URL? The channel's homepage? This needs a clearer purpose or it'll just be a dead field nobody fills in.
- Adding `channel_id` as nullable FK to `affiliate_links` is the right call for backward compatibility.

**Plan:**
1. Migration: Create `channels` table (`id`, `user_id`, `name`, `url`, `created_at`) with RLS policies scoped to `user_id = auth.uid()`.
2. Migration: Add nullable `channel_id` column to `affiliate_links`.
3. Add `useChannels` hook to `useSupabaseData.ts`.
4. Update Links page: channel dropdown in generator + add link dialog, channel badge in links table.

---

### Task 2: Required Onboarding Wizard — Pushback

**Verdict: Partially disagree. The forced redirect is heavy-handed for an MVP.**

Concerns:
- **Forcing 3 steps before seeing the dashboard is an activation killer.** Users want to explore first, not fill out forms. A better pattern: show an empty-state prompt on each page ("Add your first brand to get started") rather than a gated wizard.
- **Step 2 (Brands) is odd as onboarding.** Brands are merchant/advertiser relationships — a new user likely doesn't know which brands to add yet. They'd add brands as they discover programs.
- **Checking "0 credentials OR 0 channels" is fragile.** What if a user deletes their last credential later? They'd get thrown back into onboarding.

**Counter-proposal:** Build a lightweight welcome modal (not a separate route) that appears once for new users. It guides them to add their first credential and channel, but is dismissable. Track completion via a `has_completed_onboarding` flag on the `profiles` table.

**Plan (revised approach):**
1. Migration: Add `has_completed_onboarding boolean DEFAULT false` to `profiles`.
2. Create `/onboarding` route with a 2-step wizard (Networks + Channels only — skip Brands).
3. Redirect new users (where `has_completed_onboarding = false`) to `/onboarding` after login.
4. On completion, set the flag and redirect to dashboard. Users can skip if they want.

---

### Task 3: CRUD for Products and Brands — Yes, Do It

**Verdict: Overdue. Straightforward.**

Currently Products has no edit/delete, and Brands has no edit/delete. The products table is also missing a DELETE RLS policy — that needs fixing.

**Plan:**
1. Migration: Add DELETE policy on `products` table for authenticated users.
2. Products page: Add edit dialog (reuse add form layout), delete with confirmation dialog.
3. Brands page: Same — edit dialog and delete with confirmation.

---

### Task 4: UTM Parameters — Yes, but Simpler Than Proposed

**Verdict: Good idea, but profiles table already exists — no new table needed.**

The `profiles` table exists with `id`, `email`, `display_name`. We just need to add UTM columns.

**Plan:**
1. Migration: Add `utm_source`, `utm_medium`, `utm_campaign` (all text, nullable) to `profiles`.
2. Wire Settings page UTM inputs to read/save from profile.
3. Update link generation logic to append UTM params when present.

---

### Task 5: Refresh Health Button — Yes

**Verdict: Good. The UI exists, the backend doesn't.**

**Plan:**
1. Create edge function `check-link-health` that does a HEAD request and returns status.
2. Wire the Refresh button on Links page to call the function, update `health_status` on `affiliate_links`, and refresh the query.

---

### Task 6: Short Link Redirect — Yes, but with a caveat

**Verdict: Important, but `link_clicks` INSERT policy is missing.**

Currently `link_clicks` has no INSERT RLS policy, and the redirect function needs to insert anonymously (no auth). We need either a service-role insert in the edge function or an anon INSERT policy.

**Plan:**
1. Create edge function `redirect-handler` using service role key to look up short code and insert click record.
2. Return 302 redirect to the destination URL.
3. No RLS change needed — service role bypasses RLS.

---

## Execution Order

I'd recommend this order based on dependencies and impact:

1. **Task 1** (Channels) — new data model, needed by Task 2
2. **Task 2** (Onboarding, revised) — depends on channels existing
3. **Task 3** (CRUD) — independent, high user value
4. **Task 4** (UTM) — independent, quick win
5. **Task 5** (Health check) — independent edge function
6. **Task 6** (Redirect) — independent edge function

### Summary of Changes

| Area | Files Modified/Created |
|------|----------------------|
| Migrations | 4 new migrations (channels table, channel_id on links, products DELETE policy, UTM cols on profiles) |
| Hooks | `useSupabaseData.ts` — add `useChannels`, `useProfile` |
| Pages | `Links.tsx`, `Products.tsx`, `Brands.tsx`, `SettingsPage.tsx` — CRUD + channel support |
| New pages | `Onboarding.tsx` |
| Routing | `App.tsx` — add `/onboarding` route + redirect logic |
| Edge functions | `check-link-health/index.ts`, `redirect-handler/index.ts` |
| Version | Bump to v1.2.0 |

**Total: ~6 migrations, 2 edge functions, 1 new page, 5 modified pages.**

Want me to proceed? I'd start with Tasks 1 and 2 as requested.

