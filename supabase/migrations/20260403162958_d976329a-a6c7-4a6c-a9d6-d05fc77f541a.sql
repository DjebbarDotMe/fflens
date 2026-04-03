
CREATE TABLE public.link_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid NOT NULL REFERENCES public.affiliate_links(id) ON DELETE CASCADE,
  checked_at timestamptz NOT NULL DEFAULT now(),
  redirect_chain jsonb DEFAULT '[]'::jsonb,
  final_url text,
  params_intact boolean DEFAULT false,
  missing_params text[] DEFAULT '{}',
  page_title text,
  product_available boolean,
  price_found numeric,
  overall_status text NOT NULL DEFAULT 'unknown',
  issues text[] DEFAULT '{}'
);

ALTER TABLE public.link_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view verifications of own links"
  ON public.link_verifications
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.affiliate_links al
    WHERE al.id = link_verifications.link_id AND al.user_id = auth.uid()
  ));

CREATE POLICY "Service role can insert verifications"
  ON public.link_verifications
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.affiliate_links al
    WHERE al.id = link_verifications.link_id AND al.user_id = auth.uid()
  ));
