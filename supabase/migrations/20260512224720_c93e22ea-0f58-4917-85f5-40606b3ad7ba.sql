
-- Storage: prevent bucket listing; direct URL fetches still work via the public bucket flag
DROP POLICY IF EXISTS "Avatars are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to email assets" ON storage.objects;
DROP POLICY IF EXISTS "Public read for email-images" ON storage.objects;

-- password_reset_tokens: explicit deny for anon/authenticated (service role bypasses RLS)
CREATE POLICY "Deny client access to reset tokens"
  ON public.password_reset_tokens
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);
