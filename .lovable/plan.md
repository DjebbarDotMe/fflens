

## Migration: Extend Products + Add Feed Sync Infrastructure

### What's needed

Six new columns on `products`, one unique index, one new table, and one data insert.

### Migration SQL

**1. Add missing columns to `products`:**
- `asin text` — Amazon Standard ID
- `sale_price numeric` — discounted price
- `commissionable boolean DEFAULT true` — whether link earns commission
- `commission_rate numeric` — percentage rate
- `feed_source text` — origin feed identifier
- `feed_synced_at timestamptz` — last sync timestamp

**2. Create unique dedup index:**
- `CREATE UNIQUE INDEX idx_products_network_merchant_sku ON products (network_id, merchant_id, sku)` — prevents duplicate products per network+merchant

**3. Create `feed_sync_logs` table:**
```
feed_sync_logs (
  id uuid PK DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  feed_source text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  records_processed integer DEFAULT 0,
  records_failed integer DEFAULT 0,
  error_message text,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
)
```
- Enable RLS: users can SELECT/INSERT their own rows (`user_id = auth.uid()`)

**4. Insert `affiliate_com` network row:**
- Using the insert tool (data operation, not schema): name "Affiliate.com", slug "affiliate_com", url_template with `{{affiliate_id}}` placeholders

### No code changes needed
This is purely a database migration + one data insert. UI/code updates would follow separately if needed.

