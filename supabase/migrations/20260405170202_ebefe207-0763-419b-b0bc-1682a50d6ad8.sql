
-- Step 1: Add barcode and mpn columns to products
ALTER TABLE public.products ADD COLUMN barcode text;
ALTER TABLE public.products ADD COLUMN mpn text;

-- Indexes for cross-merchant matching
CREATE INDEX idx_products_barcode ON public.products (barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_products_sku ON public.products (sku);
CREATE INDEX idx_products_mpn ON public.products (mpn) WHERE mpn IS NOT NULL;

-- Step 2: Create link_repairs audit table
CREATE TABLE public.link_repairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid NOT NULL,
  old_url text NOT NULL,
  new_url text NOT NULL,
  old_product_id uuid,
  new_product_id uuid,
  reason text,
  repaired_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.link_repairs ENABLE ROW LEVEL SECURITY;

-- Users can view repairs of their own links
CREATE POLICY "Users can view own link repairs"
  ON public.link_repairs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.affiliate_links al
      WHERE al.id = link_repairs.link_id
        AND al.user_id = auth.uid()
    )
  );
