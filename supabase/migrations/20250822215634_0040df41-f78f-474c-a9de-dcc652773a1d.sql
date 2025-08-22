-- Add the current authenticated user as a business admin with full permissions
-- This will allow them to access email templates and other admin features

-- First, let's add a specific user as business admin (Mike Scott's ID from the database)
INSERT INTO public.business_admins (
  user_id,
  admin_level,
  can_view_payment_methods,
  can_manage_payment_methods,
  created_by
) VALUES (
  '52626ba1-065e-4b10-b8a2-d73a48fe940c',
  'owner',
  true,
  true,
  '52626ba1-065e-4b10-b8a2-d73a48fe940c'
)
ON CONFLICT (user_id) DO UPDATE SET
  admin_level = 'owner',
  can_view_payment_methods = true,
  can_manage_payment_methods = true,
  updated_at = now();