
CREATE OR REPLACE FUNCTION public.increment_click_count(link_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE affiliate_links SET click_count = click_count + 1 WHERE id = link_id;
END;
$$;
