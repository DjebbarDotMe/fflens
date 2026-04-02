
-- Create channels table
CREATE TABLE public.channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own channels" ON public.channels FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own channels" ON public.channels FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own channels" ON public.channels FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own channels" ON public.channels FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Add channel_id to affiliate_links
ALTER TABLE public.affiliate_links ADD COLUMN channel_id UUID REFERENCES public.channels(id) ON DELETE SET NULL;

-- Add DELETE policy on products
CREATE POLICY "Authenticated users can delete products" ON public.products FOR DELETE TO authenticated USING (true);

-- Add UTM columns and onboarding flag to profiles
ALTER TABLE public.profiles ADD COLUMN utm_source TEXT;
ALTER TABLE public.profiles ADD COLUMN utm_medium TEXT;
ALTER TABLE public.profiles ADD COLUMN utm_campaign TEXT;
ALTER TABLE public.profiles ADD COLUMN has_completed_onboarding BOOLEAN NOT NULL DEFAULT false;
