-- Create proper profile record for justin@elyphant.com account
INSERT INTO public.profiles (
  id,
  email,
  name,
  username,
  first_name,
  last_name,
  created_at,
  updated_at
) VALUES (
  '155db0e0-73f1-4fef-bb1e-8d9091d5f91a',
  'justin@elyphant.com',
  'Justin Meeks',
  'justin',
  'Justin',
  'Meeks',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  username = EXCLUDED.username,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  updated_at = now();

-- Ensure business admin record exists for justin@elyphant.com
INSERT INTO public.business_admins (
  user_id,
  admin_level,
  can_view_payment_methods,
  can_manage_payment_methods,
  created_by,
  created_at,
  updated_at
) VALUES (
  '155db0e0-73f1-4fef-bb1e-8d9091d5f91a',
  'admin',
  true,
  true,
  '155db0e0-73f1-4fef-bb1e-8d9091d5f91a',
  now(),
  now()
) ON CONFLICT (user_id) DO UPDATE SET
  admin_level = EXCLUDED.admin_level,
  can_view_payment_methods = EXCLUDED.can_view_payment_methods,
  can_manage_payment_methods = EXCLUDED.can_manage_payment_methods,
  updated_at = now();