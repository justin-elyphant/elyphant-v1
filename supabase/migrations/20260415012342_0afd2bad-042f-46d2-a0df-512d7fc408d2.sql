-- Grant SELECT to anon role on profiles table
-- This is needed for the invite page and public profile pages
-- RLS policies still control which rows are visible
GRANT SELECT ON public.profiles TO anon;