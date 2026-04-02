-- Add INSERT, UPDATE, DELETE policies for brands table
CREATE POLICY "Authenticated users can insert brands"
ON public.brands FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update brands"
ON public.brands FOR UPDATE TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete brands"
ON public.brands FOR DELETE TO authenticated
USING (true);