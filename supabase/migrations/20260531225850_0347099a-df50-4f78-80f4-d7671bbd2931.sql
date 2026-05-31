
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_click_count(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.upsert_affiliate_products(jsonb, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_click_count(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.upsert_affiliate_products(jsonb, uuid) TO service_role;

ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid();
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid();

DROP POLICY IF EXISTS "Authenticated users can insert brands" ON public.brands;
DROP POLICY IF EXISTS "Authenticated users can update brands" ON public.brands;
DROP POLICY IF EXISTS "Authenticated users can delete brands" ON public.brands;

CREATE POLICY "Users can insert own brands"
ON public.brands FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own brands"
ON public.brands FOR UPDATE TO authenticated
USING (created_by = auth.uid() OR created_by IS NULL)
WITH CHECK (created_by = auth.uid() OR created_by IS NULL);

CREATE POLICY "Users can delete own brands"
ON public.brands FOR DELETE TO authenticated
USING (created_by = auth.uid() OR created_by IS NULL);

DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can delete products" ON public.products;

CREATE POLICY "Users can insert own products"
ON public.products FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own products"
ON public.products FOR UPDATE TO authenticated
USING (created_by = auth.uid() OR created_by IS NULL)
WITH CHECK (created_by = auth.uid() OR created_by IS NULL);

CREATE POLICY "Users can delete own products"
ON public.products FOR DELETE TO authenticated
USING (created_by = auth.uid() OR created_by IS NULL);
