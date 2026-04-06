-- Add missing columns to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS asin text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_price numeric;
ALTER TABLE products ADD COLUMN IF NOT EXISTS commissionable boolean DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS commission_rate numeric;
ALTER TABLE products ADD COLUMN IF NOT EXISTS feed_source text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS feed_synced_at timestamptz;

-- Unique dedup index
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_network_merchant_sku ON products (network_id, merchant_id, sku);

-- Create feed_sync_logs table
CREATE TABLE IF NOT EXISTS feed_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  feed_source text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  records_processed integer DEFAULT 0,
  records_failed integer DEFAULT 0,
  error_message text,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE feed_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sync logs" ON feed_sync_logs
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own sync logs" ON feed_sync_logs
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());