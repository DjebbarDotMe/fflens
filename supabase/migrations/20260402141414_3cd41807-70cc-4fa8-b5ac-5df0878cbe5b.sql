
-- Create availability status enum
CREATE TYPE public.availability_status AS ENUM ('in_stock', 'out_of_stock', 'unknown');

-- Create network auth type enum
CREATE TYPE public.network_auth_type AS ENUM ('api_key', 'oauth2', 'hmac');

-- Create health status enum
CREATE TYPE public.health_status AS ENUM ('healthy', 'broken', 'unknown');

-- 1. Networks table
CREATE TABLE public.networks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  api_base_url TEXT,
  auth_type network_auth_type NOT NULL DEFAULT 'api_key',
  url_template TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Brands table
CREATE TABLE public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  website_url TEXT,
  network_id UUID REFERENCES public.networks(id) ON DELETE SET NULL,
  product_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  price DECIMAL(10,2),
  currency TEXT NOT NULL DEFAULT 'USD',
  availability_status availability_status NOT NULL DEFAULT 'unknown',
  category TEXT,
  brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  network_id UUID REFERENCES public.networks(id) ON DELETE SET NULL,
  merchant_id TEXT,
  affiliate_url_template TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(sku, network_id)
);

-- 4. Profiles table (auto-created on signup)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. User credentials table (per-network affiliate IDs)
CREATE TABLE public.user_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  network_id UUID NOT NULL REFERENCES public.networks(id) ON DELETE CASCADE,
  affiliate_id TEXT NOT NULL,
  api_token_encrypted TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, network_id)
);

-- 6. Affiliate links table
CREATE TABLE public.affiliate_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  affiliate_url TEXT NOT NULL,
  short_code TEXT UNIQUE NOT NULL,
  click_count INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
  health_status health_status NOT NULL DEFAULT 'unknown',
  health_status_code INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Link health table
CREATE TABLE public.link_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES public.affiliate_links(id) ON DELETE CASCADE,
  status_code INTEGER,
  is_valid BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  last_checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Link clicks table
CREATE TABLE public.link_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES public.affiliate_links(id) ON DELETE CASCADE,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_hash TEXT,
  user_agent TEXT,
  referrer TEXT
);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update updated_at on products
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============ RLS Policies ============

-- Networks: readable by all authenticated users
ALTER TABLE public.networks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Networks are viewable by authenticated users" ON public.networks
  FOR SELECT TO authenticated USING (true);

-- Brands: readable by all authenticated users
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Brands are viewable by authenticated users" ON public.brands
  FOR SELECT TO authenticated USING (true);

-- Products: readable by all authenticated users
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are viewable by authenticated users" ON public.products
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert products" ON public.products
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update products" ON public.products
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Profiles: users can read/update own profile
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- User credentials: users can CRUD own credentials
ALTER TABLE public.user_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own credentials" ON public.user_credentials
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own credentials" ON public.user_credentials
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own credentials" ON public.user_credentials
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own credentials" ON public.user_credentials
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Affiliate links: users can CRUD own links
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own links" ON public.affiliate_links
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own links" ON public.affiliate_links
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own links" ON public.affiliate_links
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own links" ON public.affiliate_links
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Link health: viewable by link owner (join through affiliate_links)
ALTER TABLE public.link_health ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view health of own links" ON public.link_health
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.affiliate_links al
    WHERE al.id = link_health.link_id AND al.user_id = auth.uid()
  ));

-- Link clicks: viewable by link owner
ALTER TABLE public.link_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view clicks of own links" ON public.link_clicks
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.affiliate_links al
    WHERE al.id = link_clicks.link_id AND al.user_id = auth.uid()
  ));
