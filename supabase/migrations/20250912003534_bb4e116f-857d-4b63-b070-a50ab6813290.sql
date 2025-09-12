-- Create a public storage bucket for cached email images
begin;

insert into storage.buckets (id, name, public)
values ('email-images', 'email-images', true)
on conflict (id) do nothing;

-- Public read policy for the bucket
DO $$
BEGIN
  CREATE POLICY "Public read for email-images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'email-images');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

commit;