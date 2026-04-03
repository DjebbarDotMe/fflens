
ALTER TABLE public.affiliate_links
  ADD COLUMN IF NOT EXISTS geo_rules jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ab_test_urls jsonb DEFAULT NULL;

ALTER TABLE public.link_clicks
  ADD COLUMN IF NOT EXISTS country_code text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS served_url text DEFAULT NULL;
