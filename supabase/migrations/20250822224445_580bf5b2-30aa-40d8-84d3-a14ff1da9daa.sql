-- Add the user's elyphant.com email to business_admins table so they can access Trunkline
INSERT INTO public.business_admins (
  user_id,
  admin_level,
  can_view_payment_methods,
  can_manage_payment_methods,
  created_by
)
SELECT 
  auth.users.id,
  'admin',
  true,
  true,
  auth.users.id
FROM auth.users 
WHERE auth.users.email ILIKE '%@elyphant.com'
AND NOT EXISTS (
  SELECT 1 FROM public.business_admins 
  WHERE business_admins.user_id = auth.users.id
);