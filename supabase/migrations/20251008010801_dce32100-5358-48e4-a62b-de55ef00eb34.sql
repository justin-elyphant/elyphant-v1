-- Create email-assets storage bucket for logos and email images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'email-assets',
  'email-assets',
  true,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to email assets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public read access to email assets'
  ) THEN
    CREATE POLICY "Public read access to email assets"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'email-assets');
  END IF;
END$$;

-- Allow authenticated users to upload email assets (for admin)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can upload email assets'
  ) THEN
    CREATE POLICY "Authenticated users can upload email assets"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'email-assets' 
      AND auth.role() = 'authenticated'
    );
  END IF;
END$$;

-- Create email_templates table for database-driven templates
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_type TEXT NOT NULL UNIQUE,
  template_name TEXT NOT NULL,
  subject_line TEXT NOT NULL,
  html_content TEXT NOT NULL,
  preheader TEXT,
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on email_templates
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read active templates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'email_templates' 
    AND policyname = 'Public can read active email templates'
  ) THEN
    CREATE POLICY "Public can read active email templates"
    ON public.email_templates FOR SELECT
    USING (is_active = true);
  END IF;
END$$;

-- Only business admins can modify templates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'email_templates' 
    AND policyname = 'Business admins can manage email templates v2'
  ) THEN
    CREATE POLICY "Business admins can manage email templates v2"
    ON public.email_templates FOR ALL
    USING (public.is_business_admin(auth.uid()));
  END IF;
END$$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_templates_type ON public.email_templates(template_type);

-- Add updated_at trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_email_templates_updated_at'
  ) THEN
    CREATE TRIGGER update_email_templates_updated_at
      BEFORE UPDATE ON public.email_templates
      FOR EACH ROW
      EXECUTE FUNCTION public.update_analytics_updated_at();
  END IF;
END$$;