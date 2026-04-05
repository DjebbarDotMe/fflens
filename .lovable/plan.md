

## NeverDead Self-Healing Link Pipeline

### What We're Building

An automated pipeline that, when a broken link is detected, finds the same product at another merchant, rebuilds the affiliate URL with the user's credentials, and silently updates the link — turning the existing health check into a self-healing system.

### Current State

- `check-link-health` already detects broken links (step 1 is done)
- Schema has the right pieces: `products.sku`, `networks.url_template`, `user_credentials.affiliate_id`
- But nothing connects detection → lookup → rebuild → update

### Step 1: Add product identifiers for cross-merchant matching

Add columns to `products` for universal identifiers (UPC/EAN barcode, MPN) so the same physical product can be matched across merchants.

Migration:
- `ALTER TABLE products ADD COLUMN barcode text` (UPC/EAN)
- `ALTER TABLE products ADD COLUMN mpn text` (manufacturer part number)
- Create index on `(barcode)` and `(sku)` for fast lookup

### Step 2: Link affiliate_links to products properly

Currently `affiliate_links.product_id` exists but has no foreign key and products may not be populated. Ensure each link references a product so we know *what* to search for when it breaks.

### Step 3: Build the self-heal logic in `check-link-health`

Extend the existing edge function. After detecting a broken/warning link:

1. **Lookup product**: Get the linked product's `sku`, `barcode`, `mpn` from `products`
2. **Find alternatives**: Query `products` for rows with matching `barcode` OR `sku` that belong to a *different* `network_id`/`merchant_id`, and are `availability_status = 'in_stock'`
3. **Check user credentials**: Verify the user has a `user_credentials` entry for the alternative product's `network_id`
4. **Reconstruct URL**: Use `networks.url_template` + `user_credentials.affiliate_id` + product identifiers to build a new URL
5. **Validate new URL**: Quick HEAD request to confirm it's not also broken
6. **Update silently**: Write new `affiliate_url` to `affiliate_links`, log the swap in a new `link_repairs` audit table

### Step 4: Create `link_repairs` audit table

Track every auto-repair for transparency:

```
link_repairs (
  id uuid PK,
  link_id uuid NOT NULL,
  old_url text,
  new_url text,
  old_product_id uuid,
  new_product_id uuid,
  reason text,        -- e.g. "404", "out_of_stock"
  repaired_at timestamptz DEFAULT now()
)
```

RLS: Users can view repairs of own links (same pattern as `link_verifications`).

### Step 5: UI — show repair history

- Add a "Repairs" tab or section in `LinkVerificationDialog` showing swap history
- Badge on the Links page indicating "Auto-repaired" links
- Toast notification when repairs happen during a health check

### Step 6: Template-based URL reconstruction

Define a simple templating convention for `networks.url_template`, e.g.:
```
https://www.shareasale.com/r.cfm?b={{merchant_id}}&u={{affiliate_id}}&m={{merchant_id}}&urllink={{product_url}}
```

The edge function replaces `{{affiliate_id}}`, `{{merchant_id}}`, `{{sku}}` etc. from `user_credentials` and `products`.

### Technical Details

| Area | Change |
|---|---|
| Migration | Add `barcode`, `mpn` to `products`; create `link_repairs` table with RLS |
| `check-link-health/index.ts` | Add self-heal logic after broken detection (~80 lines) |
| `LinkVerificationDialog.tsx` | Add repair history section |
| `Links.tsx` | Show "Auto-repaired" badge |
| `useSupabaseData.ts` | Add `useLinkRepairs()` hook |

### Dependencies / Prerequisites

- Products table needs to be populated with real product data including `sku`/`barcode` for matching to work
- `networks.url_template` needs actual templates per network
- Users need `user_credentials` entries for multiple networks

### Risks

- If the product catalog is sparse, matching will rarely succeed — we should surface "no alternative found" clearly
- URL template patterns vary wildly across networks — may need per-network custom logic eventually

