-- 1. Ensure page_configurations table exists
CREATE TABLE IF NOT EXISTS public.page_configurations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  cover_url text,
  active boolean DEFAULT true,
  created_at timestamp WITH time zone NOT NULL DEFAULT now(),
  updated_at timestamp WITH time zone NOT NULL DEFAULT now(),
  CONSTRAINT page_configurations_pkey PRIMARY KEY (id)
);

-- 2. Enable RLS on page_configurations
ALTER TABLE public.page_configurations ENABLE ROW LEVEL SECURITY;

-- 3. Policies for page_configurations

-- Public Read
DROP POLICY IF EXISTS "Public read access" ON public.page_configurations;
CREATE POLICY "Public read access"
ON public.page_configurations FOR SELECT
TO public
USING (true);

-- Admin Write (Update/Insert/Delete)
DROP POLICY IF EXISTS "Admin full access" ON public.page_configurations;
CREATE POLICY "Admin full access"
ON public.page_configurations FOR ALL
TO public
USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);

-- 4. Storage Policies for site-media bucket
-- Ensure bucket exists (optional, sometimes helpful)
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-media', 'site-media', true)
ON CONFLICT (id) DO NOTHING;

-- Public Read for all objects in site-media
DROP POLICY IF EXISTS "Public Access site-media" ON storage.objects;
CREATE POLICY "Public Access site-media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'site-media');

-- Admin Upload/Update/Delete
DROP POLICY IF EXISTS "Admin Upload site-media" ON storage.objects;
CREATE POLICY "Admin Upload site-media"
ON storage.objects FOR ALL
TO public
USING (
  bucket_id = 'site-media' AND
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
)
WITH CHECK (
  bucket_id = 'site-media' AND
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);

-- 5. Insert default configurations (SaaS Defaults)
INSERT INTO public.page_configurations (slug, title, cover_url)
VALUES 
  ('como-chegar', 'Como Chegar', '/actions/como-chegar.png'),
  ('events', 'Festas & Eventos', '/actions/festas-eventos.png'),
  ('history', 'Nossa História', '/actions/nossa-historia.png'),
  ('tours', 'Passeios & Atividades', '/actions/passeios-atividades.png')
ON CONFLICT (slug) DO NOTHING;
