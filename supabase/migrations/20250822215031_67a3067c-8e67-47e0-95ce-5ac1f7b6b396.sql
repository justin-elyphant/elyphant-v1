-- Add the current authenticated user as a business admin with full permissions
-- This will allow them to access email templates and other admin features

-- Get the current user and add them to business_admins
INSERT INTO public.business_admins (
  user_id,
  admin_level,
  can_view_payment_methods,
  can_manage_payment_methods,
  created_by
)
SELECT 
  auth.uid(),
  'owner',
  true,
  true,
  auth.uid()
WHERE auth.uid() IS NOT NULL
ON CONFLICT (user_id) DO UPDATE SET
  admin_level = 'owner',
  can_view_payment_methods = true,
  can_manage_payment_methods = true,
  updated_at = now();