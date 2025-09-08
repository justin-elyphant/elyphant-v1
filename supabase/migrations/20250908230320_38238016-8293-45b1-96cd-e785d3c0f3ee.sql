-- Create profile record for justin@remotelee.com so it can be deleted
-- First, get the user ID for justin@remotelee.com from auth.users
INSERT INTO public.profiles (
  id,
  email,
  name,
  username,
  first_name,
  last_name,
  birth_year,
  created_at,
  updated_at
) 
SELECT 
  au.id,
  'justin@remotelee.com',
  'Justin Meeks',
  'justin_remotelee',
  'Justin',
  'Meeks',
  1990,
  now(),
  now()
FROM auth.users au 
WHERE au.email = 'justin@remotelee.com'
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  username = EXCLUDED.username,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  birth_year = EXCLUDED.birth_year,
  updated_at = now();