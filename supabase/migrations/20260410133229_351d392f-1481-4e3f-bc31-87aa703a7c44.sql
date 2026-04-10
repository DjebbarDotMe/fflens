
CREATE OR REPLACE FUNCTION public.upsert_affiliate_products(
  p_products jsonb,
  p_network_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brand_names text[];
  v_product jsonb;
  v_brand_id uuid;
  v_inserted int := 0;
  v_updated int := 0;
  v_failed int := 0;
BEGIN
  -- Collect unique brand names
  SELECT array_agg(DISTINCT b)
  INTO v_brand_names
  FROM jsonb_array_elements(p_products) elem,
       LATERAL (SELECT elem->>'brand' AS b) sub
  WHERE b IS NOT NULL AND b != '';

  -- Ensure all brands exist
  IF v_brand_names IS NOT NULL THEN
    INSERT INTO brands (name)
    SELECT unnest(v_brand_names)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Upsert each product
  FOR v_product IN SELECT * FROM jsonb_array_elements(p_products)
  LOOP
    BEGIN
      -- Resolve brand
      v_brand_id := NULL;
      IF v_product->>'brand' IS NOT NULL AND v_product->>'brand' != '' THEN
        SELECT id INTO v_brand_id FROM brands WHERE lower(name) = lower(v_product->>'brand') LIMIT 1;
      END IF;

      INSERT INTO products (
        title, description, sku, brand_id, network_id, price, sale_price,
        asin, barcode, mpn, commission_rate, commissionable, merchant_id,
        affiliate_url_template, availability_status, category, image_url,
        currency, feed_source, feed_synced_at
      ) VALUES (
        v_product->>'name',
        v_product->>'description',
        COALESCE(v_product->>'sku', 'aff-' || gen_random_uuid()::text),
        v_brand_id,
        p_network_id,
        (v_product->>'regular_price')::numeric,
        (v_product->>'sale_price')::numeric,
        v_product->>'asin',
        v_product->>'barcode',
        v_product->>'mpn',
        (v_product->>'commission_rate')::numeric,
        true,
        v_product->>'merchant_id',
        v_product->>'commission_url',
        CASE WHEN (v_product->>'in_stock')::boolean THEN 'in_stock'::availability_status ELSE 'out_of_stock'::availability_status END,
        v_product->>'category',
        v_product->>'image_url',
        COALESCE(v_product->>'currency', 'USD'),
        'affiliate.com',
        now()
      )
      ON CONFLICT (network_id, merchant_id, sku) DO UPDATE SET
        price = EXCLUDED.price,
        sale_price = EXCLUDED.sale_price,
        availability_status = EXCLUDED.availability_status,
        commission_rate = EXCLUDED.commission_rate,
        feed_synced_at = now();

      -- Check if it was insert or update
      IF NOT FOUND THEN
        v_updated := v_updated + 1;
      ELSE
        v_inserted := v_inserted + 1;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      v_failed := v_failed + 1;
    END;
  END LOOP;

  RETURN jsonb_build_object('inserted', v_inserted, 'updated', v_updated, 'failed', v_failed);
END;
$$;
