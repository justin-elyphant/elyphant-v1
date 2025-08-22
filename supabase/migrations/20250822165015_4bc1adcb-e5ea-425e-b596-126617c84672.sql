-- Fix infinite recursion in business_admins RLS policy
-- Drop the problematic policy if it exists
DROP POLICY IF EXISTS "Business admins can view admin list" ON public.business_admins;

-- Create a security definer function to check admin status
CREATE OR REPLACE FUNCTION public.is_business_admin(check_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.business_admins
    WHERE user_id = check_user_id 
    AND admin_level IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Recreate the policy using the security definer function
CREATE POLICY "Business admins can view admin list" ON public.business_admins
FOR SELECT
USING (public.is_business_admin(auth.uid()));

-- Ensure pricing_settings table has proper access for authenticated users
CREATE POLICY IF NOT EXISTS "Authenticated users can read pricing settings" ON public.pricing_settings
FOR SELECT
USING (auth.role() = 'authenticated');